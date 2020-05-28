import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { safeLoad, safeDump } from 'js-yaml';
import { saveAs } from 'file-saver';
import { connect } from 'react-redux';
import MonacoEditor from 'react-monaco-editor';
import { ActionGroup, Alert, Button, Split, SplitItem, Popover } from '@patternfly/react-core';
import { DownloadIcon, InfoCircleIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import {
  global_BackgroundColor_100 as lineNumberActiveForeground,
  global_BackgroundColor_300 as lineNumberForeground,
  global_BackgroundColor_dark_100 as editorBackground,
} from '@patternfly/react-tokens';
import {
  FLAGS,
  ALL_NAMESPACES_KEY,
  getBadgeFromType,
  Shortcut,
  ShortcutTable,
} from '@console/shared';

import { connectToFlags } from '../reducers/features';
import { errorModal } from './modals';
import { Firehose, checkAccess, history, Loading, resourceObjPath } from './utils';
import {
  referenceForModel,
  k8sCreate,
  k8sUpdate,
  referenceFor,
  groupVersionFor,
} from '../module/k8s';
import { ConsoleYAMLSampleModel } from '../models';
import { getResourceSidebarSamples } from './sidebars/resource-sidebar-samples';
import { ResourceSidebar } from './sidebars/resource-sidebar';
import { yamlTemplates } from '../models/yaml-templates';

import { definitionFor, getStoredSwagger } from '../module/k8s/swagger';
import {
  MonacoToProtocolConverter,
  ProtocolToMonacoConverter,
} from 'monaco-languageclient/lib/monaco-converter';
import { getLanguageService, TextDocument } from 'yaml-language-server';
import { openAPItoJSONSchema } from '../module/k8s/openapi-to-json-schema';
import * as URL from 'url';

window.monaco.editor.defineTheme('console', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // avoid pf tokens for `rules` since tokens are opaque strings that might not be hex values
    { token: 'number', foreground: 'ace12e' },
    { token: 'type', foreground: '73bcf7' },
    { token: 'string', foreground: 'f0ab00' },
    { token: 'keyword', foreground: 'cbc0ff' },
  ],
  colors: {
    'editor.background': editorBackground.value,
    'editorGutter.background': '#292e34', // no pf token defined
    'editorLineNumber.activeForeground': lineNumberActiveForeground.value,
    'editorLineNumber.foreground': lineNumberForeground.value,
  },
});

const generateObjToLoad = (kind, id, yaml, namespace = 'default') => {
  const sampleObj = safeLoad(yaml ? yaml : yamlTemplates.getIn([kind, id]));
  if (_.has(sampleObj.metadata, 'namespace')) {
    sampleObj.metadata.namespace = namespace;
  }
  return sampleObj;
};

const stateToProps = ({ k8s, UI }) => ({
  activeNamespace: UI.get('activeNamespace'),
  impersonate: UI.get('impersonate'),
  models: k8s.getIn(['RESOURCES', 'models']),
});

const isDesktop = () => window.innerWidth > 767;
const desktopGutter = 30;

/**
 * This component loads the entire Monaco editor library with it.
 * Consider using `AsyncComponent` to dynamically load this component when needed.
 */
/** @augments {React.Component<{obj?: any, create: boolean, kind: string, redirectURL?: string, resourceObjPath?: (obj: K8sResourceKind, objRef: string) => string}, onChange?: (yaml: string) => void>} */
export const EditYAML_ = connect(stateToProps)(
  class EditYAML extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        error: null,
        success: null,
        height: 500,
        initialized: false,
        stale: false,
        sampleObj: props.sampleObj,
        fileUpload: props.fileUpload,
        showSidebar: props.create,
      };
      this.monacoRef = React.createRef();
      this.resize = () => {
        this.setState({ height: this.height });
        if (this.monacoRef.current) {
          this.monacoRef.current.editor.layout({ height: this.editorHeight, width: this.width });
        }
      };
      // k8s uses strings for resource versions
      this.displayedVersion = '0';
      // Default cancel action is browser back navigation
      this.onCancel = 'onCancel' in props ? props.onCancel : history.goBack;
      this.downloadSampleYaml_ = this.downloadSampleYaml_.bind(this);
      this.editorDidMount = this.editorDidMount.bind(this);
      this.buttons = this.props.buttonsRef;

      if (this.props.error) {
        this.handleError(this.props.error);
      }
    }

    getModel(obj) {
      if (_.isEmpty(obj)) {
        return null;
      }
      const { models } = this.props;
      return models.get(referenceFor(obj)) || models.get(obj.kind);
    }

    handleError(error) {
      this.setState({ error, success: null }, () => {
        this.resize();
      });
    }

    componentDidUpdate(prevProps, prevState) {
      if (
        !_.isEqual(prevState, this.state) ||
        prevProps.yamlSamplesList !== this.props.yamlSamplesList
      ) {
        this.resize();
      }
    }

    componentDidMount() {
      this.loadYaml();
      window.addEventListener('resize', this.resize);
      window.addEventListener('sidebar_toggle', this.resize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.resize);
      window.removeEventListener('sidebar_toggle', this.resize);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (nextProps.isOver) {
        return;
      }
      const newVersion = _.get(nextProps.obj, 'metadata.resourceVersion');
      const stale = this.displayedVersion !== newVersion;
      this.setState({ stale });
      if (nextProps.error) {
        this.handleError(nextProps.error);
      } else if (this.state.error) {
        //clear stale error state
        this.setState({ error: '' });
      }
      if (nextProps.sampleObj) {
        this.loadYaml(!_.isEqual(this.state.sampleObj, nextProps.sampleObj), nextProps.sampleObj);
      } else if (nextProps.fileUpload) {
        this.loadYaml(
          !_.isEqual(this.state.fileUpload, nextProps.fileUpload),
          nextProps.fileUpload,
        );
      } else {
        this.loadYaml();
      }
    }

    editorDidMount(editor, monaco) {
      editor.layout();
      editor.focus();
      this.registerYAMLinMonaco(monaco);
      monaco.editor.getModels()[0].updateOptions({ tabSize: 2 });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => this.save());
    }

    get editorHeight() {
      const buttonsHeight = this.buttons ? this.buttons.getBoundingClientRect().height : 0;
      // if viewport width is > 767, also subtract top padding on .yaml-editor
      return isDesktop()
        ? Math.floor(this.height - buttonsHeight - desktopGutter)
        : Math.floor(this.height - buttonsHeight);
    }

    get height() {
      return Math.floor(
        // notifications can appear above and below .pf-c-page, so calculate height using the bottom of .pf-c-page
        document.getElementsByClassName('pf-c-page')[0].getBoundingClientRect().bottom -
          this.editor.getBoundingClientRect().top,
      );
    }

    get width() {
      const hasSidebarSidebar = _.first(
        document.getElementsByClassName('co-p-has-sidebar__sidebar'),
      );
      const contentScrollableWidth = document
        .getElementById('content-scrollable')
        .getBoundingClientRect().width;
      // if viewport width is > 767, also subtract left and right margins on .yaml-editor
      const hasSidebarBodyWidth = isDesktop()
        ? contentScrollableWidth - desktopGutter * 2
        : contentScrollableWidth;
      return hasSidebarSidebar
        ? hasSidebarBodyWidth - hasSidebarSidebar.getBoundingClientRect().width
        : hasSidebarBodyWidth;
    }

    // Unfortunately, `editor.focus()` doesn't work when hiding the shortcuts
    // popover. We need to find the actual DOM element.
    focusEditor = () =>
      setTimeout(() => document.querySelector('.monaco-editor textarea')?.focus());

    reload() {
      this.loadYaml(true);
      this.setState({
        sampleObj: null,
        error: null,
        success: null,
      });
    }

    checkEditAccess(obj) {
      const { readOnly, impersonate } = this.props;
      if (readOnly) {
        // We're already read-only. No need for the access review.
        return;
      }

      const model = this.getModel(obj);
      if (!model) {
        return;
      }

      const { name, namespace } = obj.metadata;
      const resourceAttributes = {
        group: model.apiGroup,
        resource: model.plural,
        verb: 'update',
        name,
        namespace,
      };
      checkAccess(resourceAttributes, impersonate).then((resp) => {
        const notAllowed = !resp.status.allowed;
        this.setState({ notAllowed });
        if (this.monacoRef.current) {
          this.monacoRef.current.editor.updateOptions({ readOnly: notAllowed });
        }
      });
    }

    convertObjToYAMLString(obj) {
      let yaml = '';
      if (obj) {
        if (_.isString(obj)) {
          yaml = obj;
        } else {
          try {
            yaml = safeDump(obj);
            this.checkEditAccess(obj);
          } catch (e) {
            yaml = `Error getting YAML: ${e}`;
          }
        }
      }

      return yaml;
    }

    loadYaml(reload = false, obj = this.props.obj) {
      if (this.state.initialized && !reload) {
        return;
      }

      const yaml = this.convertObjToYAMLString(obj);

      this.displayedVersion = _.get(obj, 'metadata.resourceVersion');
      this.setState({ yaml, initialized: true, stale: false });
      this.resize();
    }

    addToYAML(id, obj) {
      const yaml = this.convertObjToYAMLString(obj);

      const selection = this.monacoRef.current.editor.getSelection();
      const range = new window.monaco.Range(
        selection.startLineNumber,
        selection.startColumn,
        selection.endLineNumber,
        selection.endColumn,
      );

      // Grab the current position and indent every row to left-align the text at the same indentation
      const indentSize = new Array(selection.startColumn).join(' ');
      const lines = yaml.split('\n');
      const lineCount = lines.length;
      const indentedText = lines
        .map((line, i) => {
          if (i === 0) {
            // Already indented, leave it alone
            return line;
          }
          return `${indentSize}${line}`;
        })
        .join('\n');

      // Grab the selection size of what we are about to add
      const newContentSelection = new window.monaco.Selection(
        selection.startLineNumber,
        0,
        selection.startLineNumber + lineCount - 1,
        lines[lines.length - 1].length,
      );

      const op = { range, text: indentedText, forceMoveMarkers: true };
      this.monacoRef.current.editor.executeEdits(id, [op], [newContentSelection]);
      this.monacoRef.current.editor.focus();

      this.displayedVersion = _.get(obj, 'metadata.resourceVersion');
      this.setState({ yaml: this.monacoRef.current.editor.getValue() });
      this.resize();
    }

    getEditor() {
      return this.monacoRef.current.editor;
    }

    save() {
      const { onSave } = this.props;
      let obj;

      if (onSave) {
        onSave(this.getEditor().getValue());
        return;
      }

      try {
        obj = safeLoad(this.getEditor().getValue());
      } catch (e) {
        this.handleError(`Error parsing YAML: ${e}`);
        return;
      }

      if (!obj.apiVersion) {
        this.handleError('No "apiVersion" field found in YAML.');
        return;
      }

      if (!obj.kind) {
        this.handleError('No "kind" field found in YAML.');
        return;
      }

      const model = this.getModel(obj);
      if (!model) {
        this.handleError(
          `The server doesn't have a resource type "kind: ${obj.kind}, apiVersion: ${obj.apiVersion}".`,
        );
        return;
      }

      // If this is a namesapced resource, default to the active namespace when none is specified in the YAML.
      if (!obj.metadata.namespace && model.namespaced) {
        if (this.props.activeNamespace === ALL_NAMESPACES_KEY) {
          this.handleError('No "metadata.namespace" field found in YAML.');
          return;
        }
        obj.metadata.namespace = this.props.activeNamespace;
      }

      const { namespace: newNamespace, name: newName } = obj.metadata;

      if (!this.props.create && this.props.obj) {
        const { namespace, name } = this.props.obj.metadata;

        if (name !== newName) {
          this.handleError(
            `Cannot change resource name (original: "${name}", updated: "${newName}").`,
          );
          return;
        }
        if (namespace !== newNamespace) {
          this.handleError(
            `Cannot change resource namespace (original: "${namespace}", updated: "${newNamespace}").`,
          );
          return;
        }
        if (this.props.obj.kind !== obj.kind) {
          this.handleError(
            `Cannot change resource kind (original: "${this.props.obj.kind}", updated: "${obj.kind}").`,
          );
          return;
        }

        const apiGroup = groupVersionFor(this.props.obj.apiVersion).group;
        const newAPIGroup = groupVersionFor(obj.apiVersion).group;
        if (apiGroup !== newAPIGroup) {
          this.handleError(
            `Cannot change API group (original: "${apiGroup}", updated: "${newAPIGroup}").`,
          );
          return;
        }
      }

      this.setState({ success: null, error: null }, () => {
        let action = k8sUpdate;
        let redirect = false;
        if (this.props.create) {
          action = k8sCreate;
          delete obj.metadata.resourceVersion;
          redirect = true;
        }
        action(model, obj, newNamespace, newName)
          .then((o) => {
            if (redirect) {
              let url = this.props.redirectURL;
              if (!url) {
                const path = _.isFunction(this.props.resourceObjPath)
                  ? this.props.resourceObjPath
                  : resourceObjPath;
                url = path(o, referenceFor(o));
              }
              history.push(url);
              // TODO: (ggreer). show message on new page. maybe delete old obj?
              return;
            }
            const success = `${newName} has been updated to version ${o.metadata.resourceVersion}`;
            this.setState({ success, error: null });
            this.loadYaml(true, o);
          })
          .catch((e) => this.handleError(e.message));
      });
    }

    download(data = this.getEditor().getValue()) {
      const blob = new Blob([data], { type: 'text/yaml;charset=utf-8' });
      let filename = 'k8s-object.yaml';
      try {
        const obj = safeLoad(data);
        if (obj.kind) {
          filename = `${obj.kind.toLowerCase()}-${obj.metadata.name}.yaml`;
        }
      } catch (unused) {
        // unused
      }
      saveAs(blob, filename);
    }

    getYamlContent_(id = 'default', yaml = '', kind = referenceForModel(this.props.model)) {
      try {
        const sampleObj = generateObjToLoad(kind, id, yaml, this.props.obj.metadata.namespace);
        this.setState({ sampleObj });
        return sampleObj;
      } catch (error) {
        errorModal({
          title: 'Failed to Parse YAML Sample',
          error: (
            <div className="co-pre-line">{error.message || error.name || 'An error occurred.'}</div>
          ),
        });
      }
    }

    insertYamlContent_ = (id, yaml, kind) => {
      const content = this.getYamlContent_(id, yaml, kind);
      this.addToYAML(id, content);
    };

    replaceYamlContent_ = (id, yaml, kind) => {
      const content = this.getYamlContent_(id, yaml, kind);
      this.loadYaml(true, content);
    };

    downloadSampleYaml_(id = 'default', yaml = '', kind = referenceForModel(this.props.model)) {
      try {
        const sampleObj = generateObjToLoad(kind, id, yaml, this.props.obj.metadata.namespace);
        const data = safeDump(sampleObj);
        this.download(data);
      } catch (e) {
        this.download(yaml);
      }
    }

    registerYAMLinMonaco(monaco) {
      const LANGUAGE_ID = 'yaml';
      const MODEL_URI = 'inmemory://model.yaml';
      const MONACO_URI = monaco.Uri.parse(MODEL_URI);

      const m2p = new MonacoToProtocolConverter();
      const p2m = new ProtocolToMonacoConverter();

      function createDocument(model) {
        return TextDocument.create(
          MODEL_URI,
          model.getModeId(),
          model.getVersionId(),
          model.getValue(),
        );
      }

      const yamlService = this.createYAMLService();

      // validation is not a 'registered' feature like the others, it relies on calling the yamlService
      // directly for validation results when content in the editor has changed
      this.YAMLValidation(monaco, p2m, MONACO_URI, createDocument, yamlService);

      /**
       * This exists because react-monaco-editor passes the same monaco
       * object each time. Without it you would be registering all the features again and
       * getting duplicate results.
       *
       * Monaco does not provide any apis for unregistering or checking if the features have already
       * been registered for a language.
       *
       * We check that > 1 YAML language exists because one is the default and one is the initial register
       * that setups our features.
       */
      if (monaco.languages.getLanguages().filter((x) => x.id === LANGUAGE_ID).length > 1) {
        return;
      }

      this.registerYAMLLanguage(monaco); // register the YAML language with monaco
      this.registerYAMLCompletion(LANGUAGE_ID, monaco, m2p, p2m, createDocument, yamlService);
      this.registerYAMLDocumentSymbols(LANGUAGE_ID, monaco, p2m, createDocument, yamlService);
      this.registerYAMLHover(LANGUAGE_ID, monaco, m2p, p2m, createDocument, yamlService);
    }

    registerYAMLLanguage(monaco) {
      // register the YAML language with Monaco
      monaco.languages.register({
        id: 'yaml',
        extensions: ['.yml', '.yaml'],
        aliases: ['YAML', 'yaml'],
        mimetypes: ['application/yaml'],
      });
    }

    createYAMLService() {
      const resolveSchema = function(url) {
        const promise = new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => resolve(xhr.responseText);
          xhr.onerror = () => reject(xhr.statusText);
          xhr.open('GET', url, true);
          xhr.send();
        });
        return promise;
      };

      const workspaceContext = {
        resolveRelativePath: (relativePath, resource) => URL.resolve(resource, relativePath),
      };

      const yamlService = getLanguageService(resolveSchema, workspaceContext, []);

      // Prepare the schema
      const yamlOpenAPI = getStoredSwagger();

      // Convert the openAPI schema to something the language server understands
      const kubernetesJSONSchema = openAPItoJSONSchema(yamlOpenAPI);

      const schemas = [
        {
          uri: 'inmemory:yaml',
          fileMatch: ['*'],
          schema: kubernetesJSONSchema,
        },
      ];
      yamlService.configure({
        validate: true,
        schemas,
        hover: true,
        completion: true,
      });
      return yamlService;
    }

    registerYAMLCompletion(languageID, monaco, m2p, p2m, createDocument, yamlService) {
      monaco.languages.registerCompletionItemProvider(languageID, {
        provideCompletionItems(model, position) {
          const document = createDocument(model);
          return yamlService
            .doComplete(document, m2p.asPosition(position.lineNumber, position.column), true)
            .then((list) => {
              return p2m.asCompletionResult(list);
            });
        },

        resolveCompletionItem(item) {
          return yamlService
            .doResolve(m2p.asCompletionItem(item))
            .then((result) => p2m.asCompletionItem(result));
        },
      });
    }

    registerYAMLDocumentSymbols(languageID, monaco, p2m, createDocument, yamlService) {
      monaco.languages.registerDocumentSymbolProvider(languageID, {
        provideDocumentSymbols(model) {
          const document = createDocument(model);
          return p2m.asSymbolInformations(yamlService.findDocumentSymbols(document));
        },
      });
    }

    registerYAMLHover(languageID, monaco, m2p, p2m, createDocument, yamlService) {
      monaco.languages.registerHoverProvider(languageID, {
        provideHover(model, position) {
          const doc = createDocument(model);
          return yamlService
            .doHover(doc, m2p.asPosition(position.lineNumber, position.column))
            .then((hover) => {
              return p2m.asHover(hover);
            })
            .then((e) => {
              for (const el of document.getElementsByClassName('monaco-editor-hover')) {
                el.onclick = (event) => event.preventDefault();
                el.onauxclick = (event) => {
                  window.open(event.target.getAttribute('data-href'), '_blank').opener = null;
                  event.preventDefault();
                };
              }
              return e;
            });
        },
      });
    }

    YAMLValidation(monaco, p2m, monacoURI, createDocument, yamlService) {
      const pendingValidationRequests = new Map();

      const getModel = () => monaco.editor.getModels()[0];

      const cleanPendingValidation = (document) => {
        const request = pendingValidationRequests.get(document.uri);
        if (request !== undefined) {
          clearTimeout(request);
          pendingValidationRequests.delete(document.uri);
        }
      };

      const cleanDiagnostics = () =>
        monaco.editor.setModelMarkers(monaco.editor.getModel(monacoURI), 'default', []);

      const doValidate = (document) => {
        if (document.getText().length === 0) {
          cleanDiagnostics();
          return;
        }
        yamlService.doValidation(document, true).then((diagnostics) => {
          const markers = p2m.asDiagnostics(diagnostics);
          monaco.editor.setModelMarkers(getModel(), 'default', markers);
        });
      };

      getModel().onDidChangeContent(() => {
        const document = createDocument(getModel());
        cleanPendingValidation(document);
        pendingValidationRequests.set(
          document.uri,
          setTimeout(() => {
            pendingValidationRequests.delete(document.uri);
            doValidate(document);
          }),
        );
      });
    }

    toggleSidebar = () => {
      this.setState((state) => {
        return { showSidebar: !state.showSidebar };
      });
      window.dispatchEvent(new Event('sidebar_toggle'));
    };

    render() {
      if (!this.props.create && !this.props.obj) {
        return <Loading />;
      }

      const {
        connectDropTarget,
        isOver,
        canDrop,
        create,
        yamlSamplesList,
        customClass,
        onChange = () => null,
        hideActions = false,
      } = this.props;
      const klass = classNames('co-file-dropzone-container', {
        'co-file-dropzone--drop-over': isOver,
      });

      const { error, success, stale, yaml, height, showSidebar } = this.state;
      const {
        obj,
        download = true,
        header,
        genericYAML = false,
        children: customAlerts,
      } = this.props;
      const readOnly = this.props.readOnly || this.state.notAllowed;
      const options = { readOnly, scrollBeyondLastLine: false };
      const model = this.getModel(obj);
      const { samples, snippets } = model
        ? getResourceSidebarSamples(model, yamlSamplesList)
        : { samples: [], snippets: [] };
      const definition = model ? definitionFor(model) : { properties: [] };
      const showSchema = definition && !_.isEmpty(definition.properties);
      const hasSidebarContent = showSchema || !_.isEmpty(samples) || !_.isEmpty(snippets);
      const editYamlComponent = (
        <div className="co-file-dropzone">
          {canDrop && (
            <div className={klass}>
              <p className="co-file-dropzone__drop-text">Drop file here</p>
            </div>
          )}

          <div>
            {create && !this.props.hideHeader && (
              <div className="yaml-editor__header">
                <Split>
                  <SplitItem isFilled>
                    <h1 className="yaml-editor__header-text">{header}</h1>
                  </SplitItem>
                  <SplitItem>{getBadgeFromType(model && model.badge)}</SplitItem>
                </Split>
                <p className="help-block">
                  Create by manually entering YAML or JSON definitions, or by dragging and dropping
                  a file into the editor.
                </p>
              </div>
            )}
            <div className="pf-c-form">
              <div className="co-p-has-sidebar">
                <div className="co-p-has-sidebar__body">
                  <div
                    className={classNames('yaml-editor', customClass)}
                    ref={(r) => (this.editor = r)}
                  >
                    <div className="yaml-editor__links">
                      {!genericYAML && (
                        <div className="yaml-editor__link">
                          <Popover
                            aria-label="Shortcuts"
                            bodyContent={
                              <ShortcutTable>
                                <Shortcut ctrl keyName="space">
                                  Activate auto complete
                                </Shortcut>
                                <Shortcut ctrlCmd shift keyName="o">
                                  View document outline
                                </Shortcut>
                                <Shortcut hover>View property descriptions</Shortcut>
                                <Shortcut ctrlCmd keyName="s">
                                  Save
                                </Shortcut>
                              </ShortcutTable>
                            }
                            maxWidth="25rem"
                            distance={18}
                            onHide={this.focusEditor}
                          >
                            <Button type="button" variant="link" isInline>
                              <QuestionCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
                              View shortcuts
                            </Button>
                          </Popover>
                        </div>
                      )}
                      {!showSidebar && hasSidebarContent && (
                        <>
                          <div className="co-action-divider">|</div>
                          <div className="yaml-editor__link">
                            <Button
                              type="button"
                              variant="link"
                              isInline
                              onClick={this.toggleSidebar}
                            >
                              <InfoCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
                              View sidebar
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                    <MonacoEditor
                      ref={this.monacoRef}
                      language="yaml"
                      theme="console"
                      value={yaml}
                      options={options}
                      editorDidMount={this.editorDidMount}
                      onChange={(newValue) =>
                        this.setState({ yaml: newValue }, () => onChange(newValue))
                      }
                    />
                    {!hideActions && (
                      <div className="yaml-editor__buttons" ref={(r) => (this.buttons = r)}>
                        {customAlerts}
                        {error && (
                          <Alert
                            isInline
                            className="co-alert co-alert--scrollable"
                            variant="danger"
                            title="An error occurred"
                          >
                            <div className="co-pre-line">{error}</div>
                          </Alert>
                        )}
                        {success && (
                          <Alert isInline className="co-alert" variant="success" title={success} />
                        )}
                        {stale && (
                          <Alert
                            isInline
                            className="co-alert"
                            variant="info"
                            title="This object has been updated."
                          >
                            Click reload to see the new version.
                          </Alert>
                        )}
                        <ActionGroup className="pf-c-form__group--no-top-margin">
                          {create && (
                            <Button
                              type="submit"
                              variant="primary"
                              id="save-changes"
                              onClick={() => this.save()}
                            >
                              Create
                            </Button>
                          )}
                          {!create && !readOnly && (
                            <Button
                              type="submit"
                              variant="primary"
                              id="save-changes"
                              onClick={() => this.save()}
                            >
                              Save
                            </Button>
                          )}
                          {!create && !genericYAML && (
                            <Button
                              type="submit"
                              variant="secondary"
                              id="reload-object"
                              onClick={() => this.reload()}
                            >
                              Reload
                            </Button>
                          )}
                          <Button variant="secondary" id="cancel" onClick={() => this.onCancel()}>
                            Cancel
                          </Button>
                          {download && (
                            <Button
                              type="submit"
                              variant="secondary"
                              className="pf-c-button--align-right hidden-sm hidden-xs"
                              onClick={() => this.download()}
                            >
                              <DownloadIcon /> Download
                            </Button>
                          )}
                        </ActionGroup>
                      </div>
                    )}
                  </div>
                </div>
                {hasSidebarContent && (
                  <ResourceSidebar
                    isCreateMode={create}
                    kindObj={model}
                    height={height}
                    loadSampleYaml={this.replaceYamlContent_}
                    insertSnippetYaml={this.insertYamlContent_}
                    downloadSampleYaml={this.downloadSampleYaml_}
                    showSidebar={showSidebar}
                    toggleSidebar={this.toggleSidebar}
                    samples={samples}
                    snippets={snippets}
                    showSchema={showSchema}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      );

      return _.isFunction(connectDropTarget)
        ? connectDropTarget(editYamlComponent)
        : editYamlComponent;
    }
  },
);

export const EditYAML = connectToFlags(FLAGS.CONSOLE_YAML_SAMPLE)(({ flags, ...props }) => {
  const resources = flags[FLAGS.CONSOLE_YAML_SAMPLE]
    ? [
        {
          kind: referenceForModel(ConsoleYAMLSampleModel),
          isList: true,
          prop: 'yamlSamplesList',
        },
      ]
    : [];

  return (
    <Firehose resources={resources}>
      <EditYAML_ {...props} />
    </Firehose>
  );
});

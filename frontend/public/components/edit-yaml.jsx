import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { safeLoad, safeDump } from 'js-yaml';
import { saveAs } from 'file-saver';
import { connect } from 'react-redux';
import { ActionGroup, Alert, Button, Split, SplitItem } from '@patternfly/react-core';
import { DownloadIcon } from '@patternfly/react-icons';

import { FLAGS, ALL_NAMESPACES_KEY, getBadgeFromType } from '@console/shared';

import { connectToFlags } from '../reducers/features';
import { errorModal } from './modals';
import { Firehose, checkAccess, history, Loading, resourceObjPath, AsyncComponent } from './utils';
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

import { definitionFor } from '../module/k8s/swagger';

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
      // this.resize = () => {
      //   this.setState({ height: this.height });
      //   if (this.monacoRef.current) {
      //     this.monacoRef.current.editor.layout({ height: this.editorHeight, width: this.width });
      //   }
      // };
      // k8s uses strings for resource versions
      this.displayedVersion = '0';
      // Default cancel action is browser back navigation
      this.onCancel = 'onCancel' in props ? props.onCancel : history.goBack;
      this.downloadSampleYaml_ = this.downloadSampleYaml_.bind(this);
      // this.editorDidMount = this.editorDidMount.bind(this);
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
        // this.resize();
      });
    }

    componentDidUpdate(prevProps, prevState) {
      if (
        !_.isEqual(prevState, this.state) ||
        prevProps.yamlSamplesList !== this.props.yamlSamplesList
      ) {
        // this.resize();
      }
    }

    componentDidMount() {
      this.loadYaml();
      // window.addEventListener('resize', this.resize);
      // window.addEventListener('sidebar_toggle', this.resize);
    }

    componentWillUnmount() {
      // window.removeEventListener('resize', this.resize);
      // window.removeEventListener('sidebar_toggle', this.resize);
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
      // this.resize();
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
      // this.resize();
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
      } catch ({ message, name }) {
        errorModal({
          title: 'Failed to Parse YAML Sample',
          error: <div className="co-pre-line">{message || name || 'An error occurred.'}</div>,
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
        <div
          className="co-file-dropzone"
          style={{ display: 'flex', flex: 1, flexDirection: 'column' }}
        >
          {canDrop && (
            <div className={klass}>
              <p className="co-file-dropzone__drop-text">Drop file here</p>
            </div>
          )}

          <>
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
            <div
              className="pf-c-form"
              style={{ display: 'flex', flex: 1, flexDirection: 'column' }}
            >
              <div className="co-p-has-sidebar">
                <div className="co-p-has-sidebar__body">
                  <div
                    className={classNames('yaml-editor', customClass)}
                    ref={(r) => (this.editor = r)}
                    style={{ display: 'flex', flex: 1, flexDirection: 'column', height: '100%' }}
                  >
                    <AsyncComponent
                      loader={() =>
                        import('@console/shared/src/components/editor/YAMLEditor').then(
                          (c) => c.default,
                        )
                      }
                      ref={this.monacoRef}
                      value={yaml}
                      options={options}
                      showShortcuts={!genericYAML}
                      showSidebar={!showSidebar && hasSidebarContent}
                      onToggleSidebar={this.toggleSidebar}
                      onChange={(newValue) =>
                        this.setState({ yaml: newValue }, () => onChange(newValue))
                      }
                      onSave={() => this.save()}
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
          </>
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

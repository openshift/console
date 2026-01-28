import * as _ from 'lodash';
import type { ComponentProps, ReactNode, FC } from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { css } from '@patternfly/react-styles';
import { useDispatch, useSelector, connect } from 'react-redux';
import { action } from 'typesafe-actions';
import { ActionType, getOLSCodeBlock } from '@console/internal/reducers/ols';
import { safeLoad, safeLoadAll, safeDump } from 'js-yaml';
import { ActionGroup, Alert, Button } from '@patternfly/react-core';
import { DownloadIcon } from '@patternfly/react-icons/dist/esm/icons/download-icon';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { FLAGS, ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { getBadgeFromType } from '@console/shared/src/components/badges/badge-factory';
import { useResourceSidebarSamples } from '@console/shared/src/hooks/useResourceSidebarSamples';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { useResourceConnectionHandler } from '@console/shared/src/hooks/useResourceConnectionHandler';

import PageBody from '@console/shared/src/components/layout/PageBody';
import type { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { CodeEditor } from '@console/shared/src/components/editor/CodeEditor';
import { CodeEditorSidebar } from '@console/shared/src/components/editor/CodeEditorSidebar';
import { fold } from '@console/shared/src/components/editor/yaml-editor-utils';
import { downloadYaml } from '@console/shared/src/components/editor/yaml-download-utils';
import { useFullscreen } from '@console/shared/src/hooks/useFullscreen';
import {
  isYAMLTemplate,
  getImpersonate,
  YAMLTemplate,
  K8sResourceKind,
} from '@console/dynamic-plugin-sdk';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { connectToFlags, WithFlagsProps } from '../reducers/connectToFlags';
import { LazyManagedResourceSaveModalOverlay } from './modals';
import ReplaceCodeModal from './modals/replace-code-modal';
import { checkAccess } from './utils/rbac';
import { Firehose } from './utils/firehose';
import { Loading } from './utils/status-box';
import { resourceObjPath, resourceListPathFromModel } from './utils/resource-link';
import { FirehoseResult } from './utils/types';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import {
  referenceForModel,
  k8sCreate,
  k8sUpdate,
  k8sList,
  referenceFor,
  groupVersionFor,
  AccessReviewResourceAttributes,
  CodeEditorRef,
  K8sModel,
  K8sResourceCommon,
} from '../module/k8s';
import { ConsoleYAMLSampleModel } from '../models';
import { getYAMLTemplates } from '../models/yaml-templates';
import { findOwner } from '../module/k8s/managed-by';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { definitionFor } from '../module/k8s/swagger';
import { ImportYAMLResults } from './import-yaml-results';
import { EditYamlSettingsModal, useEditYamlSettings } from './modals/edit-yaml-settings-modal';
import { CodeEditorControl } from '@patternfly/react-code-editor';
import { CompressIcon } from '@patternfly/react-icons/dist/js/icons/compress-icon';
import { ExpandIcon } from '@patternfly/react-icons/dist/js/icons/expand-icon';
import { ToggleSidebarButton } from '@console/shared/src/components/editor/ToggleSidebarButton';
import { RootState } from '@console/internal/redux';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ErrorModal } from './modals/error-modal';
import type { CodeEditorProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

const generateObjToLoad = (
  templateExtensions: Parameters<typeof getYAMLTemplates>[0],
  kind: string,
  id: string,
  yaml: string,
  namespace = 'default',
) => {
  const sampleObj: K8sResourceKind = safeLoad(
    yaml ? yaml : getYAMLTemplates(templateExtensions).getIn([kind, id]),
  );
  if (_.has(sampleObj.metadata, 'namespace')) {
    sampleObj.metadata.namespace = namespace;
  }
  return sampleObj;
};

const stateToProps = (state: RootState) => ({
  activeNamespace: getActiveNamespace(state),
  impersonate: getImpersonate(state),
  models: state.k8s.getIn(['RESOURCES', 'models']) as Map<string, K8sModel>,
});

type EditYAMLProps = {
  /** The sample object to load into the editor */
  sampleObj?: ReturnType<typeof generateObjToLoad>;
  /** Whether to allow multiple YAML documents in the editor */
  allowMultiple?: boolean;
  /** Whether this is a create operation */
  create: boolean;
  /** List of YAML samples to display */
  yamlSamplesList?: FirehoseResult;
  /** Custom CSS class for the editor */
  customClass?: string;
  /** Callback function to handle changes in the YAML content */
  onChange?: (yaml: string) => void;
  /** Model to use for the editor */
  model?: K8sModel;
  /** Whether to show tooltips in the editor */
  showTooltips?: boolean;
  /** Whether to add a button to download the YAML */
  download?: boolean;
  /** Header text or component to display above the editor */
  header?: ComponentProps<typeof PageHeading>['title'];
  /** Whether the YAML is generic (not tied to a specific resource) */
  genericYAML?: boolean;
  /** Custom alerts to display in the editor */
  children?: ReactNode;
  /** URL to redirect to after saving */
  redirectURL?: string;
  /** Function to clear the file upload state */
  clearFileUpload: () => void;
  /** Callback function to save the YAML content */
  onSave?: (yaml: string) => void;
  /** Whether this is a redirect from code import */
  isCodeImportRedirect?: boolean;
  /** The object being edited */
  obj?: K8sResourceKind;
  /** Error message to display */
  error?: string;
  /** Whether the editor is in read-only mode */
  readOnly?: boolean;
  /** Whether to hide the header */
  hideHeader?: boolean;
  /** Function to get the resource object path */
  resourceObjPath?: (obj: K8sResourceKind, objRef: string) => string;
  /** Callback function to be called on cancel */
  onCancel?: () => void;
  /** The file upload content */
  fileUpload?: string;
};

type EditYAMLInnerProps = ReturnType<typeof stateToProps> & EditYAMLProps;

const EditYAMLInner: FC<EditYAMLInnerProps> = (props) => {
  const {
    allowMultiple,
    create,
    yamlSamplesList,
    customClass,
    onChange = () => null,
    models,
    download: canDownload = true,
    header,
    genericYAML = false,
    children: customAlerts,
    redirectURL,
    clearFileUpload,
    onSave,
    isCodeImportRedirect,
  } = props;

  const navigate = useNavigate();
  const fireTelemetryEvent = useTelemetry();
  const postFormSubmissionCallback = useResourceConnectionHandler<K8sResourceCommon>();
  const [errors, setErrors] = useState<string[]>(null);
  const [success, setSuccess] = useState<string>(null);
  const [initialized, setInitialized] = useState(false);
  const [stale, setStale] = useState(false);
  const [sampleObj, setSampleObj] = useState(props.sampleObj);
  const [showSidebar, setShowSidebar] = useState(!!create);
  const [owner, setOwner] = useState(null);
  const [notAllowed, setNotAllowed] = useState<boolean>();
  const [displayResults, setDisplayResults] = useState<boolean>();
  const [resourceObjects, setResourceObjects] = useState();
  const [editorMounted, setEditorMounted] = useState(false);
  const [fullscreenRef, toggleFullscreen, isFullscreen, canUseFullScreen] = useFullscreen();
  const launchModal = useOverlay();

  const [templateExtensions, resolvedTemplates] = useResolvedExtensions<YAMLTemplate>(
    useCallback(
      (e): e is YAMLTemplate => isYAMLTemplate(e) && e.properties.model.kind === props?.obj?.kind,
      [props?.obj?.kind],
    ),
  );

  const { theme, fontSize, showTooltips, stickyScrollEnabled } = useEditYamlSettings();

  const [callbackCommand, setCallbackCommand] = useState('');
  const [showReplaceCodeModal, setShowReplaceCodeModal] = useState(false);
  const [olsCode, setOLSCode] = useState('');
  const olsCodeBlock = useSelector(getOLSCodeBlock);

  const closeOLS = () => action(ActionType.CloseOLS);
  const dispatch = useDispatch();

  const monacoRef = useRef<CodeEditorRef>();
  const editor = useRef();
  const buttons = useRef();

  const { t } = useTranslation();

  const getEditor = (): editor.IStandaloneCodeEditor | undefined =>
    'editor' in monacoRef?.current ? monacoRef.current.editor : undefined;

  const getModel = useCallback(
    (obj) => {
      if (_.isEmpty(obj) || !models) {
        return null;
      }
      return models.get(referenceFor(obj)) || models.get(obj.kind);
    },
    [models],
  );

  const model = getModel(props.obj) || props.model;
  const { samples, snippets } = useResourceSidebarSamples(model, yamlSamplesList);

  const navigateToResourceList = () => {
    if (model) {
      const namespace =
        model.namespaced && props.activeNamespace !== ALL_NAMESPACES_KEY
          ? props.activeNamespace
          : undefined;
      navigate(resourceListPathFromModel(model, namespace));
    } else {
      navigate(-1); // fallback to previous page if no model available
    }
  };
  const displayedVersion = useRef('0');
  const onCancel = 'onCancel' in props ? props.onCancel : navigateToResourceList;

  async function createResources(objs) {
    const results = [];
    for (const obj of objs) {
      try {
        const result = await k8sCreate(getModel(obj), obj);
        results.push({
          status: 'fulfilled',
          result,
        });
      } catch (error) {
        results.push({
          status: 'rejected',
          reason: error.toString(),
        });
      }
    }
    return Promise.resolve(results);
  }

  const checkEditAccess = useCallback(
    (obj) => {
      if (props.readOnly) {
        // We're already read-only. No need for the access review.
        return;
      }

      if (create) {
        // No need to check edit access if creating a resource.
        // Note that the Create button is only displayed for users with
        // correct permissions.
        return;
      }

      const objModel = getModel(obj);
      if (!objModel) {
        return;
      }

      const { name, namespace } = obj.metadata;
      const resourceAttributes: AccessReviewResourceAttributes = {
        group: objModel.apiGroup,
        resource: objModel.plural,
        verb: 'update',
        name,
        namespace,
      };
      checkAccess(resourceAttributes, props.impersonate)
        .then((resp) => {
          const notAll = !resp.status.allowed;
          setNotAllowed(notAll);
          editorMounted && getEditor()?.updateOptions({ readOnly: notAll });
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('Error while check edit access', e);
        });
    },
    [props.readOnly, props.impersonate, create, editorMounted, getModel],
  );

  const appendYAMLString = useCallback((yaml) => {
    const currentYAML = getEditor()?.getValue();
    return _.isEmpty(currentYAML)
      ? yaml
      : `${currentYAML}${currentYAML.trim().endsWith('---') ? '\n' : '\n---\n'}${yaml}`;
  }, []);

  const convertObjToYAMLString = useCallback(
    (obj) => {
      let yaml = '';
      if (obj) {
        if (_.isString(obj)) {
          yaml = allowMultiple ? appendYAMLString(obj) : obj;
        } else {
          try {
            yaml = safeDump(obj, { lineWidth: -1 });
            checkEditAccess(obj);
          } catch (e) {
            yaml = t('public~Error getting YAML: {{e}}', { e });
          }
        }
      }

      return yaml;
    },
    [appendYAMLString, allowMultiple, checkEditAccess, t],
  );

  const getResourceKindfromYAML = useCallback(
    (yaml) => {
      try {
        const obj = safeLoad(yaml);
        return getModel(obj)?.kind;
      } catch (e) {
        return 'unknown';
      }
    },
    [getModel],
  );

  const loadYaml = useCallback(
    (reloaded = false, obj: K8sResourceKind | string = props.obj) => {
      if (initialized && !reloaded) {
        return;
      }

      const yaml = convertObjToYAMLString(obj);
      displayedVersion.current = _.get(obj, 'metadata.resourceVersion');
      editorMounted && getEditor()?.setValue(yaml);
      setInitialized(true);
      setStale(false);
    },
    [convertObjToYAMLString, initialized, props.obj, editorMounted],
  );

  const handleCodeReplace = (_event) => {
    if (_event.target.id === 'confirm-replace') {
      getEditor()?.setValue(olsCodeBlock?.value);
    } else if (_event.target.id === 'keep-both') {
      getEditor()?.setValue(appendYAMLString(olsCodeBlock?.value));
      fireTelemetryEvent('OLS Code Imported', {
        triggeredFrom: olsCodeBlock?.triggeredFrom,
        resourceType: getResourceKindfromYAML(olsCodeBlock?.value),
      });
    }
    setShowReplaceCodeModal(false);
  };

  const isValidYaml = (str) => {
    if (_.isEmpty(str)) {
      return false;
    }
    try {
      safeLoad(str);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!isValidYaml(olsCodeBlock?.value) || !isCodeImportRedirect) {
      return;
    }

    const currentYAML = editorMounted && getEditor()?.getValue();

    if (_.isEmpty(currentYAML) || currentYAML === olsCode) {
      getEditor()?.setValue(olsCodeBlock?.value);
      fireTelemetryEvent('OLS Code Imported', {
        triggeredFrom: olsCodeBlock?.triggeredFrom,
        resourceType: getResourceKindfromYAML(olsCodeBlock?.value),
      });
    } else {
      setShowReplaceCodeModal(true);
    }

    setOLSCode(olsCodeBlock?.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [olsCodeBlock, initialized, isCodeImportRedirect, editorMounted]);

  const handleError = (err, value = null) => {
    setSuccess(value);
    setErrors((prevState) => {
      let error = prevState || [];
      if (!_.isEmpty(err)) {
        error = [...error, err];
      }
      return error;
    });
  };

  const handleErrors = (resourceObject, err) => {
    const resourceName = resourceObject?.metadata?.name;
    const kind = resourceObject?.kind;
    setErrors((prevState) => {
      const error = [...(prevState || []), resourceName ? `${kind} ${resourceName}: ${err}` : err];
      return error;
    });
  };

  const loadCSVs = useCallback(() => {
    const namespace = props.obj?.metadata?.namespace;
    if (create || !namespace || !props.obj?.metadata?.ownerReferences?.length) {
      return;
    }
    k8sList(ClusterServiceVersionModel, { ns: namespace })
      .then((csvList) => {
        const own = findOwner(props.obj, csvList);
        setOwner(own);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Could not fetch CSVs', e);
      });
  }, [create, props.obj]);

  useEffect(() => {
    editorMounted && loadYaml();
    loadCSVs();
  }, [loadCSVs, loadYaml, editorMounted]);

  // unsafecomponentwillreceiveprops
  useEffect(() => {
    const newVersion = _.get(props.obj, 'metadata.resourceVersion');
    const s = displayedVersion.current !== newVersion && editorMounted;
    setStale(s);
    if (props.sampleObj) {
      editorMounted && loadYaml(!_.isEqual(sampleObj, props.sampleObj), props.sampleObj);
    } else {
      editorMounted && loadYaml();
    }
  }, [props, loadYaml, sampleObj, editorMounted]);

  // update editor as fileUpload changes
  const prevProps = useRef(props);
  useEffect(() => {
    if (props.fileUpload) {
      editorMounted &&
        loadYaml(!_.isEqual(prevProps.current.fileUpload, props.fileUpload), props.fileUpload);
    }
    prevProps.current = props;
  }, [props.fileUpload, props, loadYaml, editorMounted]);

  const reload = () => {
    loadYaml(true);
    const currentEditor = getEditor();
    fold(currentEditor, currentEditor.getModel(), false);
    setSampleObj(null);
    setErrors(null);
    setSuccess(null);
  };

  const updateYAML = useCallback(
    (obj) => {
      setSuccess(null);
      setErrors(null);
      const objModel = getModel(obj);
      const response = create
        ? k8sCreate(objModel, _.omit(obj, ['metadata.resourceVersion']))
        : k8sUpdate(objModel, obj, obj.metadata.namespace, obj.metadata.name);

      response
        .then((o) => postFormSubmissionCallback(o))
        .then((o) => {
          if (create) {
            let url = redirectURL;
            if (!url) {
              const path = _.isFunction(props.resourceObjPath)
                ? props.resourceObjPath
                : resourceObjPath;
              url = path(o, referenceFor(o));
            }
            navigate(url);
            // TODO: (ggreer). show message on new page. maybe delete old obj?
            return;
          }
          const s = t('public~{{name}} has been updated to version {{version}}', {
            name: obj.metadata.name,
            version: o.metadata.resourceVersion,
          });
          setSuccess(s);
          setErrors(null);
          loadYaml(true, o);
        })
        .catch((e) => {
          handleError(e.message);
        });
    },
    [
      create,
      loadYaml,
      t,
      postFormSubmissionCallback,
      redirectURL,
      props.resourceObjPath,
      navigate,
      getModel,
    ],
  );

  const setDisplay = useCallback(
    (value) => {
      clearFileUpload();
      setDisplayResults(value);
    },
    [clearFileUpload],
  );

  const onRetry = (retryObjs) => {
    setDisplay(false);
    if (retryObjs) {
      const yamlDocuments = retryObjs.map((obj) => convertObjToYAMLString(obj));
      setDisplayResults(false);
      getEditor()?.setValue(yamlDocuments.join('---\n'));
    }
  };

  const validate = useCallback(
    (obj) => {
      if (!obj) {
        return t('public~No YAML content found.');
      }

      if (!obj.apiVersion) {
        return t('public~No "apiVersion" field found in YAML.');
      }

      if (!obj.kind) {
        return t('public~No "kind" field found in YAML.');
      }

      const objModel = getModel(obj);
      if (!objModel) {
        return t(
          'public~The server doesn\'t have a resource type "kind: {{kind}}, apiVersion: {{apiVersion}}".',
          { kind: obj.kind, apiVersion: obj.apiVersion },
        );
      }

      if (!obj.metadata) {
        return t('public~No "metadata" field found in YAML.');
      }

      if (obj.metadata.namespace && !objModel.namespaced) {
        delete obj.metadata.namespace;
      }

      // If this is a namespaced resource, default to the active namespace when none is specified in the YAML.
      if (!obj.metadata.namespace && objModel.namespaced) {
        if (props.activeNamespace === ALL_NAMESPACES_KEY) {
          return t('public~No "metadata.namespace" field found in YAML.');
        }
        obj.metadata.namespace = props.activeNamespace;
      }
    },
    [props.activeNamespace, t, getModel],
  );

  const [saving, setSaving] = useState(false);

  const saveCallback = useCallback(() => {
    let obj;

    if (onSave) {
      onSave(editorMounted && getEditor()?.getValue());
      return;
    }

    try {
      obj = safeLoad(editorMounted && getEditor()?.getValue());
    } catch (e) {
      handleError(t('public~Error parsing YAML: {{e}}', { e }));
      return;
    }

    const error = validate(obj);
    if (error) {
      handleError(error);
      return;
    }

    const { namespace: newNamespace, name: newName } = obj.metadata;

    if (!create && props.obj) {
      const { namespace, name } = props.obj.metadata;

      if (name !== newName) {
        handleError(
          t('public~Cannot change resource name (original: "{{name}}", updated: "{{newName}}").', {
            name,
            newName,
          }),
        );
        return;
      }
      if (namespace !== newNamespace) {
        handleError(
          t(
            'public~Cannot change resource namespace (original: "{{namespace}}", updated: "{{newNamespace}}").',
            { namespace, newNamespace },
          ),
        );
        return;
      }
      if (props.obj.kind !== obj.kind) {
        handleError(
          t(
            'public~Cannot change resource kind (original: "{{original}}", updated: "{{updated}}").',
            { original: props.obj.kind, updated: obj.kind },
          ),
        );
        return;
      }

      const apiGroup = groupVersionFor(props.obj.apiVersion).group;
      const newAPIGroup = groupVersionFor(obj.apiVersion).group;

      if (apiGroup !== newAPIGroup) {
        handleError(
          t(
            'public~Cannot change API group (original: "{{apiGroup}}", updated: "{{newAPIGroup}}").',
            { apiGroup, newAPIGroup },
          ),
        );
        return;
      }

      if (owner) {
        launchModal(LazyManagedResourceSaveModalOverlay, {
          resource: obj,
          onSubmit: () => updateYAML(obj),
          owner,
        });
        return;
      }
    }
    updateYAML(obj);
  }, [create, owner, t, updateYAML, validate, onSave, props.obj, editorMounted, launchModal]);

  const save = () => {
    setErrors([]);
    setCallbackCommand('save');
    setSaving((current) => !current);
  };

  const saveAllCallback = useCallback(() => {
    let objs;
    let hasErrors = false;

    try {
      objs = safeLoadAll(editorMounted && getEditor()?.getValue()).filter((obj) => obj);
    } catch (e) {
      handleError(t('public~Error parsing YAML: {{e}}', { e }));
      return;
    }

    if (objs.length === 1) {
      if (objs[0]?.apiVersion === 'v1' && objs[0]?.kind?.includes('List') && objs[0]?.items) {
        if (objs[0]?.items?.length > 0) {
          objs = objs[0].items;
        } else {
          handleError(t('public~"items" list is empty'));
          return;
        }
      } else {
        save();
        return;
      }
    } else if (objs.length === 0) {
      return;
    }

    //Run through client side validation for all resources
    objs.forEach((obj) => {
      const validationError = validate(obj);
      if (validationError) {
        hasErrors = true;
        handleErrors(obj, validationError);
      }
    });

    if (!hasErrors) {
      //Check for duplicate name/kinds. ~ is not a valid name character, so use it to separate the fields
      const filteredEntried = _.filter(objs, (obj) => !obj.metadata.generateName);
      const uniqueEntries = _.uniqBy(filteredEntried, (obj) =>
        [
          obj.metadata.name,
          obj.metadata.namespace,
          obj.kind,
          groupVersionFor(obj.apiVersion).group,
        ].join('~'),
      );
      if (uniqueEntries.length !== filteredEntried.length) {
        handleError(
          t('public~Resources in the same namespace and API group must have unique names'),
        );
        return;
      }
      setErrors(null);
      setResourceObjects(objs);
      setDisplay(true);
    }
  }, [t, setDisplay, validate, editorMounted]);

  const saveAll = () => {
    setErrors([]);
    setCallbackCommand('saveall');
    setSaving((current) => !current);
  };

  useEffect(() => {
    if (callbackCommand === 'save') {
      saveCallback();
    }
    if (callbackCommand === 'saveall') {
      saveAllCallback();
    }
    // removed callback functions from deps array to prevent stream of errors after save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, callbackCommand]);

  const download = () => {
    const data = getEditor()?.getValue();
    downloadYaml(data);
  };

  const getYamlContent_ = (id = 'default', yaml = '', kind = referenceForModel(props.model)) => {
    try {
      const s = generateObjToLoad(templateExtensions, kind, id, yaml, props.obj.metadata.namespace);
      setSampleObj(s);
      return s;
    } catch (error) {
      launchModal(ErrorModal, {
        title: t('public~Failed to parse YAML sample'),
        error: (
          <div className="co-pre-line">
            {error.message || error.name || t('public~An error occurred.')}
          </div>
        ),
      });
    }
  };

  const toggleSidebar = () => {
    setShowSidebar((prevState) => !prevState);
    window.dispatchEvent(new Event('sidebar_toggle'));
  };

  const sanitizeYamlContent = (id, yaml, kind) => {
    const contentObj = getYamlContent_(id, yaml, kind);
    const sanitizedYaml = convertObjToYAMLString(contentObj);
    displayedVersion.current = _.get(contentObj, 'metadata.resourceVersion');
    return sanitizedYaml;
  };

  useEffect(() => {
    editorMounted && getEditor()?.updateOptions({ hover: { enabled: showTooltips } });
    editorMounted && getEditor()?.updateOptions({ stickyScroll: { enabled: stickyScrollEnabled } });
  }, [showTooltips, stickyScrollEnabled, editorMounted]);

  if ((!create && !props.obj) || !resolvedTemplates) {
    return <Loading />;
  }

  if (displayResults) {
    return (
      <ImportYAMLResults
        createResources={createResources}
        displayResults={setDisplayResults}
        importResources={resourceObjects}
        retryFailed={onRetry}
      />
    );
  }

  const readOnly = props.readOnly || notAllowed;
  const options: CodeEditorProps['options'] = { fontSize, readOnly, scrollBeyondLastLine: false };
  const definition = model ? definitionFor(model) : { properties: [] };
  const showSchema = definition && !_.isEmpty(definition.properties);
  const hasSidebarContent = showSchema || (create && !_.isEmpty(samples)) || !_.isEmpty(snippets);
  const sidebarSwitch = hasSidebarContent && (
    <ToggleSidebarButton
      key="edit-yaml-sidebar-toggle"
      isSidebarOpen={showSidebar}
      toggleSidebar={toggleSidebar}
      alignToEnd
      className="pf-v6-u-mr-xs"
    />
  );

  const settingsModal = (
    <EditYamlSettingsModal
      key="edit-yaml-settings-modal"
      appendTo={() => {
        return isFullscreen ? fullscreenRef.current : document.body;
      }}
    />
  );

  const fullscreenButton = (
    <CodeEditorControl
      key="edit-yaml-fullscreen-button"
      onClick={toggleFullscreen}
      isDisabled={!canUseFullScreen}
      aria-label={t('public~Toggle fullscreen mode')}
      tooltipProps={{ content: t('public~Toggle fullscreen mode') }}
      icon={isFullscreen ? <CompressIcon /> : <ExpandIcon />}
    />
  );

  return (
    <>
      {(header || create) && !props.hideHeader && (
        <PageHeading
          title={header}
          badge={getBadgeFromType(model && model.badge)}
          helpText={
            create &&
            (allowMultiple ? (
              <Trans ns="public">
                Drag and drop YAML or JSON files into the editor, or manually enter files and use{' '}
                <kbd className="co-kbd">---</kbd> to separate each definition.
              </Trans>
            ) : (
              t(
                'public~Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.',
              )
            ))
          }
        />
      )}

      <PageBody className="pf-v6-c-form">
        <div
          className={css('co-p-has-sidebar', { 'co-fullscreen': isFullscreen })}
          ref={fullscreenRef}
        >
          <div
            className={css('co-p-has-sidebar__body', {
              'co-p-has-sidebar__body--sidebar-open': showSidebar && hasSidebarContent,
            })}
          >
            <div className={css('yaml-editor', customClass)} ref={editor}>
              {showReplaceCodeModal && <ReplaceCodeModal handleCodeReplace={handleCodeReplace} />}
              <CodeEditor
                {...(theme !== 'default' && { isDarkTheme: theme === 'dark' })}
                options={options}
                isCopyEnabled={canDownload}
                ref={monacoRef}
                showShortcuts={!genericYAML && !isFullscreen}
                toolbarLinks={
                  sidebarSwitch
                    ? [settingsModal, fullscreenButton, sidebarSwitch]
                    : [settingsModal, fullscreenButton]
                }
                onChange={onChange}
                onSave={() => (allowMultiple ? saveAll() : save())}
                onEditorDidMount={() => setEditorMounted(true)}
              />
              <div className="yaml-editor__buttons" ref={buttons}>
                {customAlerts}
                {(errors?.length > 0 || props.error) && (
                  <Alert
                    isInline
                    className="co-alert co-alert--scrollable"
                    variant="danger"
                    title={t('public~An error occurred')}
                    data-test="yaml-error"
                  >
                    <div className="co-pre-line">
                      {[...(errors ? errors : []), props.error].join('\n')}
                    </div>
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
                    title={t('public~This object has been updated.')}
                  >
                    {t('public~Click reload to see the new version.')}
                  </Alert>
                )}
                <ActionGroup className="pf-v6-c-form__group--no-top-margin">
                  {create && (
                    <Button
                      type="submit"
                      variant="primary"
                      id="save-changes"
                      data-test="save-changes"
                      onClick={() => {
                        allowMultiple ? saveAll() : save();
                        dispatch(closeOLS());
                      }}
                    >
                      {t('public~Create')}
                    </Button>
                  )}
                  {!create && !readOnly && (
                    <Button
                      type="submit"
                      variant="primary"
                      id="save-changes"
                      data-test="save-changes"
                      onClick={() => save()}
                    >
                      {t('public~Save')}
                    </Button>
                  )}
                  {!create && !genericYAML && (
                    <Button
                      type="submit"
                      variant="secondary"
                      id="reload-object"
                      data-test="reload-object"
                      onClick={() => reload()}
                    >
                      {t('public~Reload')}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    id="cancel"
                    data-test="cancel"
                    onClick={() => {
                      onCancel();
                      dispatch(closeOLS());
                    }}
                  >
                    {t('public~Cancel')}
                  </Button>
                  {canDownload && (
                    <Button
                      icon={<DownloadIcon />}
                      type="submit"
                      variant="secondary"
                      className="pf-v6-c-button--align-right pf-v6-u-display-none pf-v6-u-display-flex-on-sm"
                      onClick={() => download()}
                    >
                      {t('public~Download')}
                    </Button>
                  )}
                </ActionGroup>
              </div>
            </div>
          </div>
          {hasSidebarContent && showSidebar && (
            <CodeEditorSidebar
              editorRef={monacoRef}
              model={model}
              samples={create ? samples : []}
              snippets={snippets}
              sanitizeYamlContent={sanitizeYamlContent}
              toggleSidebar={toggleSidebar}
            />
          )}
        </div>
      </PageBody>
    </>
  );
};

/**
 * This component loads the entire Monaco editor library with it.
 * Consider using `AsyncComponent` to dynamically load this component when needed.
 */
export const EditYAML_ = connect(stateToProps)(EditYAMLInner);

export const EditYAML = connectToFlags<WithFlagsProps & EditYAMLProps>(FLAGS.CONSOLE_YAML_SAMPLE)(
  ({ flags, ...props }) => {
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
  },
);

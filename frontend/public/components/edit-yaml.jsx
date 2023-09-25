/* eslint-disable tsdoc/syntax */
import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { safeLoad, safeLoadAll, safeDump } from 'js-yaml';
import { connect } from 'react-redux';
import { ActionGroup, Alert, Button, Checkbox } from '@patternfly/react-core';
import { DownloadIcon, InfoCircleIcon } from '@patternfly/react-icons';
import { Trans, useTranslation } from 'react-i18next';

import {
  FLAGS,
  ALL_NAMESPACES_KEY,
  getBadgeFromType,
  withPostFormSubmissionCallback,
  getResourceSidebarSamples,
  SHOW_YAML_EDITOR_TOOLTIPS_USER_SETTING_KEY,
  SHOW_YAML_EDITOR_TOOLTIPS_LOCAL_STORAGE_KEY,
  useUserSettingsCompatibility,
} from '@console/shared';
import CodeEditor from '@console/shared/src/components/editor/CodeEditor';
import CodeEditorSidebar from '@console/shared/src/components/editor/CodeEditorSidebar';
import '@console/shared/src/components/editor/theme';
import { fold } from '@console/shared/src/components/editor/yaml-editor-utils';
import { downloadYaml } from '@console/shared/src/components/editor/yaml-download-utils';
import { isYAMLTemplate, getImpersonate } from '@console/dynamic-plugin-sdk';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { connectToFlags } from '../reducers/connectToFlags';
import { errorModal, managedResourceSaveModal } from './modals';
import {
  checkAccess,
  Firehose,
  history,
  Loading,
  LoadingBox,
  PageHeading,
  resourceObjPath,
} from './utils';
import {
  referenceForModel,
  k8sCreate,
  k8sUpdate,
  k8sList,
  referenceFor,
  groupVersionFor,
} from '../module/k8s';
import { ConsoleYAMLSampleModel } from '../models';
import { getYAMLTemplates } from '../models/yaml-templates';
import { findOwner } from '../module/k8s/managed-by';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { definitionFor } from '../module/k8s/swagger';
import { ImportYAMLResults } from './import-yaml-results';

const generateObjToLoad = (templateExtensions, kind, id, yaml, namespace = 'default') => {
  const sampleObj = safeLoad(yaml ? yaml : getYAMLTemplates(templateExtensions).getIn([kind, id]));
  if (_.has(sampleObj.metadata, 'namespace')) {
    sampleObj.metadata.namespace = namespace;
  }
  return sampleObj;
};

const stateToProps = (state) => ({
  activeNamespace: state.UI.get('activeNamespace'),
  impersonate: getImpersonate(state),
  models: state.k8s.getIn(['RESOURCES', 'models']),
});

const WithYamlTemplates = (Component) =>
  function Comp(props) {
    const kind = props?.obj?.kind;
    const [templateExtensions, resolvedTemplates] = useResolvedExtensions(
      React.useCallback((e) => isYAMLTemplate(e) && e.properties.model.kind === kind, [kind]),
    );
    const [showTooltips, setShowTooltips] = useUserSettingsCompatibility(
      SHOW_YAML_EDITOR_TOOLTIPS_USER_SETTING_KEY,
      SHOW_YAML_EDITOR_TOOLTIPS_LOCAL_STORAGE_KEY,
      true,
      true,
    );

    return !resolvedTemplates ? (
      <LoadingBox />
    ) : (
      <Component
        templateExtensions={templateExtensions}
        showTooltips={showTooltips}
        setShowTooltips={setShowTooltips}
        {...props}
      />
    );
  };

const EditYAMLInner = (props) => {
  const {
    allowMultiple,
    connectDropTarget,
    isOver,
    canDrop,
    create,
    yamlSamplesList,
    customClass,
    onChange = () => null,
    models,
    showTooltips,
    download: canDownload = true,
    header,
    genericYAML = false,
    children: customAlerts,
    postFormSubmissionCallback,
    redirectURL,
    clearFileUpload,
    onSave,
  } = props;

  const [errors, setErrors] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [initialized, setInitialized] = React.useState(false);
  const [stale, setStale] = React.useState(false);
  const [sampleObj, setSampleObj] = React.useState(props.sampleObj);
  const [showSidebar, setShowSidebar] = React.useState(!!create);
  const [owner, setOwner] = React.useState(null);
  const [notAllowed, setNotAllowed] = React.useState();
  const [displayResults, setDisplayResults] = React.useState();
  const [resourceObjects, setResourceObjects] = React.useState();

  const [callbackCommand, setCallbackCommand] = React.useState('');

  const monacoRef = React.useRef();
  const editor = React.useRef();
  const buttons = React.useRef();

  const { t } = useTranslation();

  const displayedVersion = React.useRef('0');
  const onCancel = 'onCancel' in props ? props.onCancel : history.goBack;

  const getEditor = () => {
    return monacoRef.current.editor;
  };

  const getModel = React.useCallback(
    (obj) => {
      if (_.isEmpty(obj) || !models) {
        return null;
      }
      return models.get(referenceFor(obj)) || models.get(obj.kind);
    },
    [models],
  );

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

  const checkEditAccess = React.useCallback(
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

      const model = getModel(obj);
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
      checkAccess(resourceAttributes, props.impersonate)
        .then((resp) => {
          const notAll = !resp.status.allowed;
          setNotAllowed(notAll);
          if (monacoRef.current) {
            monacoRef.current.editor?.updateOptions({ readOnly: notAll });
          }
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('Error while check edit access', e);
        });
    },
    [props.readOnly, props.impersonate, create, getModel],
  );

  const appendYAMLString = React.useCallback((yaml) => {
    const currentYAML = getEditor().getValue();
    return _.isEmpty(currentYAML)
      ? yaml
      : `${currentYAML}${currentYAML.trim().endsWith('---') ? '\n' : '\n---\n'}${yaml}`;
  }, []);

  const convertObjToYAMLString = React.useCallback(
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

  const loadYaml = React.useCallback(
    (reloaded = false, obj = props.obj) => {
      if (initialized && !reloaded) {
        return;
      }

      const yaml = convertObjToYAMLString(obj);
      displayedVersion.current = _.get(obj, 'metadata.resourceVersion');
      getEditor().setValue(yaml);
      setInitialized(true);
      setStale(false);
    },
    [convertObjToYAMLString, initialized, props.obj],
  );

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

  const loadCSVs = React.useCallback(() => {
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

  React.useEffect(() => {
    if (props.error) {
      handleError(props.error);
    }
    loadYaml();
    loadCSVs();
  }, [loadCSVs, loadYaml, props.error]);

  const prevProps = React.useRef(props);

  // unsafecomponentwillreceiveprops
  React.useEffect(() => {
    if (isOver) {
      return;
    }

    const newVersion = _.get(props.obj, 'metadata.resourceVersion');
    const s = displayedVersion.current !== newVersion;
    setStale(s);
    handleError(props.error, success);
    if (props.sampleObj) {
      loadYaml(!_.isEqual(sampleObj, props.sampleObj), props.sampleObj);
    } else if (props.fileUpload) {
      loadYaml(!_.isEqual(prevProps.current.fileUpload, props.fileUpload), props.fileUpload);
    } else {
      loadYaml();
    }
  }, [props, isOver, loadYaml, sampleObj, success]);

  const reload = () => {
    loadYaml(true);
    const currentEditor = getEditor();
    fold(currentEditor, currentEditor.getModel(), false);
    setSampleObj(null);
    setErrors(null);
    setSuccess(null);
  };

  const updateYAML = React.useCallback(
    (obj, model, newNamespace, newName) => {
      setSuccess(null);
      setErrors(null);
      let action = k8sUpdate;
      let redirect = false;
      if (create) {
        action = k8sCreate;
        delete obj.metadata.resourceVersion;
        redirect = true;
      }
      action(model, obj, newNamespace, newName)
        .then((o) => postFormSubmissionCallback(o))
        .then((o) => {
          if (redirect) {
            let url = redirectURL;
            if (!url) {
              const path = _.isFunction(props.resourceObjPath)
                ? props.resourceObjPath
                : resourceObjPath;
              url = path(o, referenceFor(o));
            }
            history.push(url);
            // TODO: (ggreer). show message on new page. maybe delete old obj?
            return;
          }
          const s = t('public~{{newName}} has been updated to version {{version}}', {
            newName,
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
    [create, loadYaml, t, postFormSubmissionCallback, redirectURL, props.resourceObjPath],
  );

  const setDisplay = React.useCallback(
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
      getEditor().setValue(yamlDocuments.join('---\n'));
    }
  };

  const validate = React.useCallback(
    (obj) => {
      if (!obj.apiVersion) {
        return t('public~No "apiVersion" field found in YAML.');
      }

      if (!obj.kind) {
        return t('public~No "kind" field found in YAML.');
      }

      const model = getModel(obj);
      if (!model) {
        return t(
          'public~The server doesn\'t have a resource type "kind: {{kind}}, apiVersion: {{apiVersion}}".',
          { kind: obj.kind, apiVersion: obj.apiVersion },
        );
      }

      if (!obj.metadata) {
        return t('public~No "metadata" field found in YAML.');
      }

      if (obj.metadata.namespace && !model.namespaced) {
        delete obj.metadata.namespace;
      }

      // If this is a namespaced resource, default to the active namespace when none is specified in the YAML.
      if (!obj.metadata.namespace && model.namespaced) {
        if (props.activeNamespace === ALL_NAMESPACES_KEY) {
          return t('public~No "metadata.namespace" field found in YAML.');
        }
        obj.metadata.namespace = props.activeNamespace;
      }
    },
    [getModel, props.activeNamespace, t],
  );

  const [saving, setSaving] = React.useState(false);

  const saveCallback = React.useCallback(() => {
    let obj;

    if (onSave) {
      onSave(getEditor().getValue());
      return;
    }

    try {
      obj = safeLoad(getEditor().getValue());
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
        managedResourceSaveModal({
          kind: obj.kind,
          resource: obj,
          onSubmit: () => updateYAML(obj, getModel(obj), newNamespace, newName),
          owner,
        });
        return;
      }
    }
    updateYAML(obj, getModel(obj), newNamespace, newName);
  }, [create, getModel, owner, t, updateYAML, validate, onSave, props.obj]);

  const save = () => {
    setErrors([]);
    setCallbackCommand('save');
    setSaving((current) => !current);
  };

  const saveAllCallback = React.useCallback(() => {
    let objs;
    let hasErrors = false;

    try {
      objs = safeLoadAll(getEditor().getValue()).filter((obj) => obj);
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
  }, [t, setDisplay, validate]);

  const saveAll = () => {
    setErrors([]);
    setCallbackCommand('saveall');
    setSaving((current) => !current);
  };

  React.useEffect(() => {
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
    const data = getEditor().getValue();
    downloadYaml(data);
  };

  const getYamlContent_ = (id = 'default', yaml = '', kind = referenceForModel(props.model)) => {
    try {
      const s = generateObjToLoad(
        props.templateExtensions,
        kind,
        id,
        yaml,
        props.obj.metadata.namespace,
      );
      setSampleObj(s);
      return s;
    } catch (error) {
      errorModal({
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

  const toggleShowTooltips = (v) => {
    props.setShowTooltips(v);
  };

  const sanitizeYamlContent = (id, yaml, kind) => {
    const contentObj = getYamlContent_(id, yaml, kind);
    const sanitizedYaml = convertObjToYAMLString(contentObj);
    displayedVersion.current = _.get(contentObj, 'metadata.resourceVersion');
    return sanitizedYaml;
  };

  if (!create && !props.obj) {
    return <Loading />;
  }

  const klass = classNames('co-file-dropzone-container', {
    'co-file-dropzone--drop-over': isOver,
  });

  monacoRef.current?.editor?.updateOptions({ hover: showTooltips });

  if (displayResults) {
    return (
      <ImportYAMLResults
        createResources={createResources}
        displayResults={setDisplayResults}
        importResources={resourceObjects}
        models={models}
        retryFailed={onRetry}
      />
    );
  }

  const readOnly = props.readOnly || notAllowed;
  const options = { readOnly, scrollBeyondLastLine: false };
  const model = getModel(props.obj);
  const { samples, snippets } = model
    ? getResourceSidebarSamples(model, yamlSamplesList, t)
    : { samples: [], snippets: [] };
  const definition = model ? definitionFor(model) : { properties: [] };
  const showSchema = definition && !_.isEmpty(definition.properties);
  const hasSidebarContent = showSchema || (create && !_.isEmpty(samples)) || !_.isEmpty(snippets);
  const sidebarLink =
    !showSidebar && hasSidebarContent ? (
      <Button type="button" variant="link" isInline onClick={toggleSidebar}>
        <InfoCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
        {t('public~View sidebar')}
      </Button>
    ) : null;
  const tooltipCheckBox = (
    <Checkbox
      label={t('public~Show tooltips')}
      id="showTooltips"
      isChecked={showTooltips}
      data-checked-state={showTooltips}
      onChange={(checked) => {
        toggleShowTooltips(checked);
      }}
    />
  );

  const editYamlComponent = (
    <div className="co-file-dropzone co-file-dropzone__flex">
      {canDrop && (
        <div className={klass}>
          <p className="co-file-dropzone__drop-text">{t('public~Drop file here')}</p>
        </div>
      )}

      {create && !props.hideHeader && (
        <PageHeading
          title={header}
          badge={getBadgeFromType(model && model.badge)}
          helpText={
            allowMultiple ? (
              <Trans ns="public">
                Drag and drop YAML or JSON files into the editor, or manually enter files and use{' '}
                <kbd className="co-kbd">---</kbd> to separate each definition.
              </Trans>
            ) : (
              t(
                'public~Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.',
              )
            )
          }
          detail
        />
      )}

      <div className="pf-c-form co-m-page__body">
        <div className="co-p-has-sidebar">
          <div className="co-p-has-sidebar__body">
            <div className={classNames('yaml-editor', customClass)} ref={editor}>
              <CodeEditor
                ref={monacoRef}
                options={options}
                showShortcuts={!genericYAML}
                minHeight="100px"
                toolbarLinks={sidebarLink ? [tooltipCheckBox, sidebarLink] : [tooltipCheckBox]}
                onChange={onChange}
                onSave={() => (allowMultiple ? saveAll() : save())}
              />
              <div className="yaml-editor__buttons" ref={buttons}>
                {customAlerts}
                {errors?.length > 0 && (
                  <Alert
                    isInline
                    className="co-alert co-alert--scrollable"
                    variant="danger"
                    title={t('public~An error occurred')}
                  >
                    <div className="co-pre-line">{errors.join('\n')}</div>
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
                <ActionGroup className="pf-c-form__group--no-top-margin">
                  {create && (
                    <Button
                      type="submit"
                      variant="primary"
                      id="save-changes"
                      data-test="save-changes"
                      onClick={() => (allowMultiple ? saveAll() : save())}
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
                    onClick={() => onCancel()}
                  >
                    {t('public~Cancel')}
                  </Button>
                  {canDownload && (
                    <Button
                      type="submit"
                      variant="secondary"
                      className="pf-c-button--align-right hidden-sm hidden-xs"
                      onClick={() => download()}
                    >
                      <DownloadIcon /> {t('public~Download')}
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
      </div>
    </div>
  );

  return _.isFunction(connectDropTarget) ? connectDropTarget(editYamlComponent) : editYamlComponent;
};

/**
 * This component loads the entire Monaco editor library with it.
 * Consider using `AsyncComponent` to dynamically load this component when needed.
 */
/** @augments {React.Component<{allowMultiple?: boolean, obj?: any, create: boolean, kind: string, redirectURL?: string, resourceObjPath?: (obj: K8sResourceKind, objRef: string) => string}, onChange?: (yaml: string) => void, clearFileUpload?: () => void>} */
export const EditYAML_ = connect(stateToProps)(
  WithYamlTemplates(withPostFormSubmissionCallback(EditYAMLInner)),
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

import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Alert, Button, ActionGroup, AlertActionCloseButton } from '@patternfly/react-core';
import * as classNames from 'classnames';

import { k8sPatch, k8sGet, referenceFor, referenceForOwnerRef } from '../module/k8s';
import {
  AsyncComponent,
  checkAccess,
  ContainerDropdown,
  EnvFromPair,
  EnvType,
  FieldLevelHelp,
  LoadingBox,
  LoadingInline,
  NameValueEditorPair,
  PromiseComponent,
  ResourceLink,
} from './utils';
import { ConfigMapModel, SecretModel } from '../models';

/**
 * Set up an AsyncComponent to wrap the name-value-editor to allow on demand loading to reduce the
 * vendor footprint size.
 */
const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() => import('./utils/name-value-editor').then((c) => c.NameValueEditor)}
    {...props}
  />
);
const EnvFromEditorComponent = (props) => (
  <AsyncComponent
    loader={() => import('./utils/name-value-editor').then((c) => c.EnvFromEditor)}
    {...props}
  />
);

/**
 * Set up initial value for the environment vars state. Use this in constructor or cancelChanges.
 *
 * Our return value here is an object in the form of:
 * {
 *   env: [[envname, value, id],[...]]
 *   envFrom: [[envFromprefix, resourceObject, id], [...]]
 * }
 *
 *
 * @param initialPairObjects
 * @returns {*}
 * @private
 */
const getPairsFromObject = (element = {}) => {
  const returnedPairs = {};
  if (_.isEmpty(element.env)) {
    returnedPairs.env = [['', '', 0]];
  } else {
    returnedPairs.env = _.map(element.env, (leafNode, i) => {
      if (!_.has(leafNode, 'value') && !_.has(leafNode, 'valueFrom')) {
        leafNode.value = '';
      }
      leafNode.ID = i;
      return Object.values(leafNode);
    });
  }
  if (_.isEmpty(element.envFrom)) {
    const configMapSecretRef = { name: '', key: '' };
    returnedPairs.envFrom = [['', { configMapSecretRef }, 0]];
  } else {
    returnedPairs.envFrom = _.map(element.envFrom, (leafNode, i) => {
      if (!_.has(leafNode, 'prefix')) {
        leafNode.prefix = '';
      }
      leafNode.ID = i;
      return [leafNode.prefix, _.pick(leafNode, ['configMapRef', 'secretRef']), leafNode.ID];
    });
  }
  return returnedPairs;
};

/**
 * Get name/value pairs from an array or object source
 *
 * @param initialPairObjects
 * @returns {Array}
 */
const envVarsToArray = (initialPairObjects) => {
  const cpOfInitialPairs = _.cloneDeep(initialPairObjects);
  if (_.isArray(cpOfInitialPairs)) {
    return _.map(cpOfInitialPairs, (element) => {
      const { env, envFrom } = getPairsFromObject(element);
      return [env, envFrom];
    });
  }
  const { env, envFrom } = getPairsFromObject(cpOfInitialPairs);
  return [[env, envFrom]];
};

const getContainersObjectForDropdown = (containerArray) => {
  return _.reduce(
    containerArray,
    (result, elem, order) => {
      result[elem.name] = { ...elem, order };
      return result;
    },
    {},
  );
};

class CurrentEnvVars {
  constructor(data, isContainerArray, path) {
    this.currentEnvVars = {};
    this.state = { allowed: true };
    if (!_.isEmpty(data) && arguments.length > 1) {
      this.setResultObject(data, isContainerArray, path);
    } else {
      this.setRawData(data);
    }
  }

  setRawData(rawEnvData) {
    this.rawEnvData = rawEnvData;
    this.isContainerArray = _.isArray(rawEnvData.containers);
    this.isCreate = _.isEmpty(rawEnvData);
    this.hasInitContainers = !_.isUndefined(rawEnvData.initContainers);

    if (this.isContainerArray || this.isCreate) {
      this.currentEnvVars.containers = envVarsToArray(rawEnvData.containers);
      this.currentEnvVars.initContainers = envVarsToArray(rawEnvData.initContainers);
    } else {
      this.currentEnvVars.buildObject = envVarsToArray(rawEnvData);
    }
    return this;
  }

  /**
   * Initialize CurrentEnvVars with result object after patch operation.
   *
   * If this is a containerArray its possible to have initContainers at a level above
   * the current envPath, so when we setRawData, we want to drop right such that
   * not only the containers can be initialized, but also initContainers. A build object
   * only has env data in the base path.
   *
   * @param resultObject
   * @param isContainerArray
   * @param path
   * @returns CurrentEnvVars
   */
  setResultObject(resultObject, isContainerArray, path) {
    if (isContainerArray) {
      return this.setRawData(_.get(resultObject, _.dropRight(path)));
    }
    return this.setRawData(_.get(resultObject, path));
  }

  getEnvVarByTypeAndIndex(type, index) {
    return this.currentEnvVars[type][index];
  }

  setFormattedVars(containerType, index, environmentType, formattedPairs) {
    this.currentEnvVars[containerType][index][environmentType] = formattedPairs;
    return this;
  }

  /**
   * Return array of patches for the save operation.
   *
   *
   * @param envPath
   * @returns {Array}
   * @public
   */
  getPatches(envPath) {
    if (this.isContainerArray) {
      const envPathForIC = _.dropRight(envPath).concat('initContainers');
      const op = 'add';

      const containerEnvPatch = this.currentEnvVars.containers.map((finalPairsForContainer, i) => {
        const path = `/${envPath.join('/')}/${i}/env`;
        const value = this._envVarsToNameVal(finalPairsForContainer[EnvType.ENV]);
        return { path, op, value };
      });

      const containerEnvFromPatch = this.currentEnvVars.containers.map(
        (finalPairsForContainer, i) => {
          const path = `/${envPath.join('/')}/${i}/envFrom`;
          const value = this._envFromVarsToResourcePrefix(finalPairsForContainer[EnvType.ENV_FROM]);
          return { path, op, value };
        },
      );

      let patches = _.concat(containerEnvPatch, containerEnvFromPatch);

      if (this.hasInitContainers) {
        const envPatchForIC = this.currentEnvVars.initContainers.map(
          (finalPairsForContainer, i) => {
            const path = `/${envPathForIC.join('/')}/${i}/env`;
            const value = this._envVarsToNameVal(finalPairsForContainer[EnvType.ENV]);
            return { path, op, value };
          },
        );

        const envFromPatchForIC = this.currentEnvVars.initContainers.map(
          (finalPairsForContainer, i) => {
            const path = `/${envPathForIC.join('/')}/${i}/envFrom`;
            const value = this._envFromVarsToResourcePrefix(
              finalPairsForContainer[EnvType.ENV_FROM],
            );
            return { path, op, value };
          },
        );

        patches = _.concat(patches, envPatchForIC, envFromPatchForIC);
      }
      return patches;
    }
    return this.currentEnvVars.buildObject.map((finalPairsForContainer) => {
      const op = 'add';
      const path = `/${envPath.join('/')}/env`;
      const value = this._envVarsToNameVal(finalPairsForContainer[EnvType.ENV]);
      return { path, op, value };
    });
  }

  /**
   * Return array of variables for the create operation.
   *
   * @returns {Array}
   * @public
   */
  dispatchNewEnvironmentVariables() {
    return this.isCreate
      ? this._envVarsToNameVal(this.currentEnvVars.containers[0][EnvType.ENV])
      : null;
  }

  /**
   * Return env var pairs in name value notation, and strip out any pairs that have empty NAME values.
   *
   *
   * @param finalEnvPairs
   * @returns {Array}
   * @private
   */
  _envVarsToNameVal(finalEnvPairs) {
    return _.filter(finalEnvPairs, (finalEnvPair) => finalEnvPair[NameValueEditorPair.Name]).map(
      (finalPairForContainer) => {
        const name = finalPairForContainer[NameValueEditorPair.Name];
        const value = finalPairForContainer[NameValueEditorPair.Value];
        return _.isObject(value) ? { name, valueFrom: value } : { name, value };
      },
    );
  }

  /**
   * Return env var pairs in envFrom (resource/prefix) notation, and strip out any pairs that have empty resource values.
   *
   *
   * @param finalEnvPairs
   * @returns {Array}
   * @private
   */
  _envFromVarsToResourcePrefix(finalEnvPairs) {
    return _.filter(
      finalEnvPairs,
      (finalEnvPair) =>
        !_.isEmpty(finalEnvPair[EnvFromPair.Resource]) &&
        !finalEnvPair[EnvFromPair.Resource].configMapSecretRef,
    ).map((finalPairForContainer) => {
      return _.assign(
        { prefix: finalPairForContainer[EnvFromPair.Prefix] },
        finalPairForContainer[EnvFromPair.Resource],
      );
    });
  }
}

/** @type {(state: any, props: {obj?: object, rawEnvData?: any, readOnly: boolean, envPath: any, onChange?: (env: any) => void, addConfigMapSecret?: boolean, useLoadingInline?: boolean}) => {model: K8sKind}} */
const stateToProps = ({ k8s, UI }, { obj }) => ({
  model:
    k8s.getIn(['RESOURCES', 'models', referenceFor(obj)]) ||
    k8s.getIn(['RESOURCES', 'models', obj.kind]),
  impersonate: UI.get('impersonate'),
});

export const EnvironmentPage = connect(stateToProps)(
  class EnvironmentPage extends PromiseComponent {
    /**
     * Set initial state and decide which kind of env we are setting up
     *
     * @param props
     */
    constructor(props) {
      super(props);

      this.reload = this._reload.bind(this);
      this.saveChanges = this._saveChanges.bind(this);
      this.updateEnvVars = this._updateEnvVars.bind(this);
      this.selectContainer = this._selectContainer.bind(this);
      const currentEnvVars = new CurrentEnvVars(this.props.rawEnvData);
      this.state = {
        currentEnvVars,
        success: null,
        containerIndex: 0,
        containerType:
          currentEnvVars.isContainerArray || currentEnvVars.isCreate ? 'containers' : 'buildObject',
      };
    }

    componentDidMount() {
      this._checkEditAccess();
      const { addConfigMapSecret, readOnly } = this.props;
      if (!addConfigMapSecret || readOnly) {
        const configMaps = {},
          secrets = {};
        this.setState({ configMaps, secrets });
        return;
      }
      const envNamespace = _.get(this.props, 'obj.metadata.namespace');

      Promise.all([
        k8sGet(ConfigMapModel, null, envNamespace).catch((err) => {
          if (err.response.status !== 403) {
            const errorMessage = err.message || 'Could not load config maps.';
            this.setState({ errorMessage });
          }
          return {
            configMaps: {},
          };
        }),
        k8sGet(SecretModel, null, envNamespace).catch((err) => {
          if (err.response.status !== 403) {
            const errorMessage = err.message || 'Could not load secrets.';
            this.setState({ errorMessage });
          }
          return {
            secrets: {},
          };
        }),
      ]).then(([configMaps, secrets]) => this.setState({ configMaps, secrets }));
    }

    componentDidUpdate(prevProps) {
      const { obj, model, impersonate, readOnly, rawEnvData } = this.props;
      const { dirty } = this.state;

      if (!_.isEqual(rawEnvData, prevProps.rawEnvData)) {
        this.setState({
          ...(!dirty && { currentEnvVars: new CurrentEnvVars(rawEnvData) }),
          stale: dirty,
        });
      }

      if (
        _.get(prevProps.obj, 'metadata.uid') !== _.get(obj, 'metadata.uid') ||
        _.get(prevProps.model, 'apiGroup') !== _.get(model, 'apiGroup') ||
        _.get(prevProps.model, 'path') !== _.get(model, 'path') ||
        prevProps.impersonate !== impersonate ||
        prevProps.readOnly !== readOnly
      ) {
        this._checkEditAccess();
      }
    }

    _checkEditAccess() {
      const { obj, model, impersonate, readOnly } = this.props;
      if (readOnly) {
        return;
      }

      // Only check RBAC if editing an existing resource. The form will always
      // be enabled when creating a new application (git import / deploy image).
      if (_.isEmpty(obj) || !model) {
        this.setState({ allowed: true });
        return;
      }

      const { name, namespace } = obj.metadata;
      const resourceAttributes = {
        group: model.apiGroup,
        resource: model.plural,
        verb: 'patch',
        name,
        namespace,
      };
      checkAccess(resourceAttributes, impersonate).then((resp) =>
        this.setState({ allowed: resp.status.allowed }),
      );
    }

    /**
     * Callback for NVEditor update our state with new values
     * @param env
     * @param i
     */
    _updateEnvVars(env, i = 0, type = EnvType.ENV) {
      const { onChange } = this.props;
      const { currentEnvVars, containerType } = this.state;
      const currentEnv = _.cloneDeep(currentEnvVars);
      currentEnv.setFormattedVars(containerType, i, type, env.nameValuePairs);
      this.setState({
        currentEnvVars: currentEnv,
        dirty: true,
        success: null,
      });
      _.isFunction(onChange) && onChange(currentEnv.dispatchNewEnvironmentVariables());
    }

    /**
     * Reset the page to initial state
     * @private
     */
    _reload() {
      const { rawEnvData } = this.props;
      this.setState({
        currentEnvVars: new CurrentEnvVars(rawEnvData),
        dirty: false,
        errorMessage: null,
        stale: false,
        success: null,
      });
    }

    _selectContainer(containerName) {
      const { rawEnvData } = this.props;
      let containerIndex = _.findIndex(rawEnvData.containers, { name: containerName });
      if (containerIndex !== -1) {
        return this.setState({
          containerIndex,
          containerType: 'containers',
        });
      }
      containerIndex = _.findIndex(rawEnvData.initContainers, { name: containerName });
      if (containerIndex !== -1) {
        return this.setState({
          containerIndex,
          containerType: 'initContainers',
        });
      }
    }

    /**
     * Make it so. Patch the values for the env var changes made on the page.
     * 1. Validate for dup keys
     * 2. Throw out empty rows
     * 3. Use add command if we are adding new env vars, and replace if we are modifying
     * 4. Send the patch command down to REST, and update with response
     *
     * @param e
     */
    _saveChanges(e) {
      const { envPath, obj, model } = this.props;
      const { currentEnvVars } = this.state;

      e.preventDefault();

      const patches = currentEnvVars.getPatches(envPath);
      const promise = k8sPatch(model, obj, patches);
      this.handlePromise(promise).then((res) => {
        this.setState({
          currentEnvVars: new CurrentEnvVars(res, currentEnvVars.isContainerArray, envPath),
          dirty: false,
          errorMessage: null,
          stale: false,
          success: 'Successfully updated the environment variables.',
        });
      });
    }

    dismissSuccess = () => {
      this.setState({ success: null });
    };

    render() {
      const {
        errorMessage,
        success,
        inProgress,
        currentEnvVars,
        stale,
        configMaps,
        secrets,
        containerIndex,
        containerType,
        allowed,
      } = this.state;
      const { rawEnvData, obj, addConfigMapSecret, useLoadingInline } = this.props;
      const readOnly = this.props.readOnly || !allowed;

      if (!configMaps || !currentEnvVars || !secrets) {
        if (useLoadingInline) {
          return <LoadingInline />;
        }
        return <LoadingBox />;
      }

      const envVar = currentEnvVars.getEnvVarByTypeAndIndex(containerType, containerIndex);

      const containerDropdown = currentEnvVars.isContainerArray ? (
        <ContainerDropdown
          currentKey={rawEnvData[containerType][containerIndex].name}
          containers={getContainersObjectForDropdown(rawEnvData.containers)}
          initContainers={getContainersObjectForDropdown(rawEnvData.initContainers)}
          onChange={this.selectContainer}
        />
      ) : null;

      const owners = _.get(obj.metadata, 'ownerReferences', []).map((o, i) => (
        <ResourceLink
          key={i}
          kind={referenceForOwnerRef(o)}
          name={o.name}
          namespace={obj.metadata.namespace}
          title={o.uid}
          inline
        />
      ));
      const containerVars = (
        <>
          {readOnly && !_.isEmpty(owners) && (
            <div className="co-toolbar__group co-toolbar__group--left">
              <Alert
                isInline
                className="co-alert col-md-11 col-xs-10"
                variant="info"
                title="Environment variables set from parent"
              >
                View environment for resource {owners.length > 1 ? <>owners: {owners}</> : owners}
              </Alert>
            </div>
          )}
          {currentEnvVars.isContainerArray && (
            <div className="co-toolbar__group co-toolbar__group--left">
              <div className="co-toolbar__item">
                {containerType === 'containers' ? 'Container:' : 'Init Container:'}
              </div>
              <div className="co-toolbar__item">{containerDropdown}</div>
            </div>
          )}
          <div className={classNames({ 'co-m-pane__body-group': !currentEnvVars.isCreate })}>
            {!currentEnvVars.isCreate && (
              <h3 className="co-section-heading-tertiary">
                Single values (env)
                {!readOnly && (
                  <FieldLevelHelp>
                    Define environment variables as key-value pairs to store configuration settings.
                    You can enter text or add values from a ConfigMap or Secret. Drag and drop
                    environment variables to change the order in which they are run. A variable can
                    reference any other variables that come before it in the list, for example{' '}
                    <code>FULLDOMAIN = $(SUBDOMAIN).example.com</code>.
                  </FieldLevelHelp>
                )}
              </h3>
            )}
            <NameValueEditorComponent
              nameValueId={containerIndex}
              nameValuePairs={envVar[EnvType.ENV]}
              updateParentData={this.updateEnvVars}
              addString="Add Value"
              nameString="Name"
              readOnly={readOnly}
              allowSorting={true}
              configMaps={configMaps}
              secrets={secrets}
              addConfigMapSecret={addConfigMapSecret}
            />
          </div>
          {currentEnvVars.isContainerArray && (
            <div className="co-m-pane__body-group environment-buttons">
              <h3 className="co-section-heading-tertiary">
                All values from existing config maps or secrets (envFrom)
                {!readOnly && (
                  <FieldLevelHelp>
                    Add new values by referencing an existing config map or secret. Drag and drop
                    environment variables within this section to change the order in which they are
                    run.
                    <br />
                    <strong>Note: </strong>If identical values exist in both lists, the single value
                    in the list above will take precedence.
                  </FieldLevelHelp>
                )}
              </h3>
              <EnvFromEditorComponent
                nameValueId={containerIndex}
                nameValuePairs={envVar[EnvType.ENV_FROM]}
                updateParentData={this.updateEnvVars}
                readOnly={readOnly}
                configMaps={configMaps}
                secrets={secrets}
              />
            </div>
          )}
        </>
      );

      return (
        <div className={classNames({ 'co-m-pane__body': !currentEnvVars.isCreate })}>
          {containerVars}
          {!currentEnvVars.isCreate && (
            <div className="co-m-pane__body-group">
              <div className="pf-c-form environment-buttons">
                {errorMessage && (
                  <Alert isInline className="co-alert" variant="danger" title={errorMessage} />
                )}
                {stale && (
                  <Alert
                    isInline
                    className="co-alert"
                    variant="info"
                    title="The information on this page is no longer current."
                  >
                    Click Reload to update and lose edits, or Save Changes to overwrite.
                  </Alert>
                )}
                {success && (
                  <Alert
                    isInline
                    className="co-alert"
                    variant="success"
                    title={success}
                    actionClose={<AlertActionCloseButton onClose={this.dismissSuccess} />}
                  />
                )}
                {!readOnly && (
                  <ActionGroup>
                    <Button
                      isDisabled={inProgress}
                      type="submit"
                      variant="primary"
                      onClick={this.saveChanges}
                    >
                      Save
                    </Button>
                    <Button
                      isDisabled={inProgress}
                      type="button"
                      variant="secondary"
                      onClick={this.reload}
                    >
                      Reload
                    </Button>
                  </ActionGroup>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
  },
);
EnvironmentPage.propTypes = {
  obj: PropTypes.object,
  rawEnvData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  envPath: PropTypes.array.isRequired,
  readOnly: PropTypes.bool.isRequired,
  onChange: PropTypes.func,
  addConfigMapSecret: PropTypes.bool,
  useLoadingInline: PropTypes.bool,
};
EnvironmentPage.defaultProps = {
  obj: {},
  rawEnvData: {},
  addConfigMapSecret: true,
};

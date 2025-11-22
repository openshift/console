/* eslint-disable tsdoc/syntax */
import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { css } from '@patternfly/react-styles';
import {
  Alert,
  Button,
  ActionGroup,
  AlertActionCloseButton,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { Trans, withTranslation } from 'react-i18next';
import { getImpersonate } from '@console/dynamic-plugin-sdk';

import TertiaryHeading from '@console/shared/src/components/heading/TertiaryHeading';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { k8sPatch, k8sGet, referenceFor, referenceForOwnerRef } from '../module/k8s';
import { AsyncComponent } from './utils/async';
import { checkAccess } from './utils/rbac';
import { ContainerSelect } from './utils/container-select';
import { EnvFromPair, EnvType, NameValueEditorPair } from './utils/types';
import { FieldLevelHelp } from './utils/field-level-help';
import { LoadingBox, LoadingInline } from './utils/status-box';
import { ResourceLink } from './utils/resource-link';
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
      if (_.isEmpty(leafNode.value) && _.isEmpty(leafNode.valueFrom)) {
        leafNode.value = '';
        delete leafNode.valueFrom;
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
   * Return env var pairs in name value notation, and strip out pairs that have empty name and values.
   *
   *
   * @param finalEnvPairs
   * @returns {Array}
   * @private
   */
  _envVarsToNameVal(finalEnvPairs) {
    const isEmpty = (value) => {
      return _.isObject(value) ? _.values(value).every(isEmpty) : !value;
    };
    return _.filter(finalEnvPairs, (finalEnvPair) => {
      const name = finalEnvPair[NameValueEditorPair.Name];
      const value = finalEnvPair[NameValueEditorPair.Value];
      return !isEmpty(name) || !isEmpty(value);
    }).map((finalEnvPair) => {
      const name = finalEnvPair[NameValueEditorPair.Name];
      const value = finalEnvPair[NameValueEditorPair.Value];
      return _.isObject(value) ? { name, valueFrom: value } : { name, value };
    });
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
const stateToProps = (state, { obj }) => ({
  model:
    state.k8s.getIn(['RESOURCES', 'models', referenceFor(obj)]) ||
    state.k8s.getIn(['RESOURCES', 'models', obj.kind]),
  impersonate: getImpersonate(state),
});

export const UnconnectedEnvironmentPage = (props) => {
  const {
    rawEnvData,
    obj,
    model,
    impersonate,
    readOnly,
    addConfigMapSecret,
    onChange,
    t,
    envPath,
    useLoadingInline,
  } = props;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const initialCurrentEnvVars = React.useMemo(() => new CurrentEnvVars(rawEnvData), [rawEnvData]);

  const [currentEnvVars, setCurrentEnvVars] = React.useState(initialCurrentEnvVars);
  const [success, setSuccess] = React.useState(null);
  const [containerIndex, setContainerIndex] = React.useState(0);
  const [containerType, setContainerType] = React.useState(
    initialCurrentEnvVars.isContainerArray || initialCurrentEnvVars.isCreate
      ? 'containers'
      : 'buildObject',
  );
  const [configMaps, setConfigMaps] = React.useState(null);
  const [secrets, setSecrets] = React.useState(null);
  const [allowed, setAllowed] = React.useState(!obj || _.isEmpty(obj) || !model);
  const [localErrorMessage, setLocalErrorMessage] = React.useState(null);

  const checkEditAccess = React.useCallback(() => {
    if (readOnly) {
      return;
    }

    // Only check RBAC if editing an existing resource. The form will always
    // be enabled when creating a new application (git import / deploy image).
    if (_.isEmpty(obj) || !model) {
      setAllowed(true);
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
    checkAccess(resourceAttributes, impersonate)
      .then((resp) => setAllowed(resp.status.allowed))
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('Error while check edit access for environment variables', e);
      });
  }, [obj, model, impersonate, readOnly]);

  React.useEffect(() => {
    checkEditAccess();
    if (!addConfigMapSecret || readOnly) {
      setConfigMaps({});
      setSecrets({});
      return;
    }
    const envNamespace = _.get(obj, 'metadata.namespace');

    Promise.all([
      k8sGet(ConfigMapModel, null, envNamespace).catch((err) => {
        if (err.response.status !== 403) {
          const errorMsg = err.message || t('public~Could not load ConfigMaps.');
          setLocalErrorMessage(errorMsg);
        }
        return {
          configMaps: {},
        };
      }),
      k8sGet(SecretModel, null, envNamespace).catch((err) => {
        if (err.response.status !== 403) {
          const errorMsg = err.message || t('public~Could not load Secrets.');
          setLocalErrorMessage(errorMsg);
        }
        return {
          secrets: {},
        };
      }),
    ]).then(([cmaps, secs]) => {
      setConfigMaps(cmaps);
      setSecrets(secs);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Callback for NVEditor update our state with new values
   * @param env
   * @param i
   */
  const updateEnvVars = React.useCallback(
    (env, i = 0, type = EnvType.ENV) => {
      const currentEnv = _.cloneDeep(currentEnvVars);
      currentEnv.setFormattedVars(containerType, i, type, env.nameValuePairs);
      setCurrentEnvVars(currentEnv);
      setSuccess(null);
      _.isFunction(onChange) && onChange(currentEnv.dispatchNewEnvironmentVariables());
    },
    [currentEnvVars, containerType, onChange],
  );

  /**
   * Reset the page to initial state
   */
  const reload = React.useCallback(() => {
    setCurrentEnvVars(new CurrentEnvVars(rawEnvData));
    setLocalErrorMessage(null);
    setSuccess(null);
  }, [rawEnvData]);

  const selectContainer = React.useCallback(
    (containerName) => {
      let index = _.findIndex(rawEnvData.containers, { name: containerName });
      if (index !== -1) {
        setContainerIndex(index);
        setContainerType('containers');
        return;
      }
      index = _.findIndex(rawEnvData.initContainers, { name: containerName });
      if (index !== -1) {
        setContainerIndex(index);
        setContainerType('initContainers');
      }
    },
    [rawEnvData],
  );

  /**
   * Make it so. Patch the values for the env var changes made on the page.
   * 1. Validate for dup keys
   * 2. Throw out empty rows
   * 3. Use add command if we are adding new env vars, and replace if we are modifying
   * 4. Send the patch command down to REST, and update with response
   *
   * @param e
   */
  const saveChanges = React.useCallback(
    (e) => {
      e.preventDefault();

      const patches = currentEnvVars.getPatches(envPath);
      const promise = k8sPatch(model, obj, patches);
      handlePromise(promise).then((res) => {
        setCurrentEnvVars(new CurrentEnvVars(res, currentEnvVars.isContainerArray, envPath));
        setLocalErrorMessage(null);
        setSuccess(t('public~Successfully updated the environment variables.'));
      });
    },
    [currentEnvVars, envPath, model, obj, handlePromise, t],
  );

  const dismissSuccess = React.useCallback(() => {
    setSuccess(null);
  }, []);

  const isReadOnly = readOnly || !allowed;
  const displayErrorMessage = errorMessage || localErrorMessage;

  if (!configMaps || !currentEnvVars || !secrets) {
    if (useLoadingInline) {
      return <LoadingInline />;
    }
    return <LoadingBox />;
  }

  const envVar = currentEnvVars.getEnvVarByTypeAndIndex(containerType, containerIndex);

  const containerDropdown = currentEnvVars.isContainerArray ? (
    <ContainerSelect
      currentKey={rawEnvData[containerType][containerIndex].name}
      containers={getContainersObjectForDropdown(rawEnvData.containers)}
      initContainers={getContainersObjectForDropdown(rawEnvData.initContainers)}
      onChange={selectContainer}
    />
  ) : null;

  const owners = _.get(obj, 'metadata.ownerReferences', []).map((o, i) => (
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
      {isReadOnly && !_.isEmpty(owners) && (
        <Alert isInline variant="info" title={t('public~Environment variables set from parent')}>
          {t('public~View environment for resource')}{' '}
          {owners.length > 1 ? (
            <>
              {t('public~owners:')} {owners}
            </>
          ) : (
            owners
          )}
        </Alert>
      )}
      {currentEnvVars.isContainerArray && (
        <Flex>
          <FlexItem>
            {containerType === 'containers' ? t('public~Container:') : t('public~Init container:')}
          </FlexItem>
          <FlexItem>{containerDropdown}</FlexItem>
        </Flex>
      )}
      {!currentEnvVars.isCreate && (
        <TertiaryHeading>
          {t('public~Single values (env)')}
          {!isReadOnly && (
            <FieldLevelHelp>
              <Trans t={t} ns="public">
                Define environment variables as key-value pairs to store configuration settings. You
                can enter text or add values from a ConfigMap or Secret. Drag and drop environment
                variables to change the order in which they are run. A variable can reference any
                other variables that come before it in the list, for example{' '}
                <code className="co-code">FULLDOMAIN = $(SUBDOMAIN).example.com</code>.
              </Trans>
            </FieldLevelHelp>
          )}
        </TertiaryHeading>
      )}
      <NameValueEditorComponent
        nameValueId={containerIndex}
        nameValuePairs={envVar[EnvType.ENV]}
        updateParentData={updateEnvVars}
        nameString={t('public~Name')}
        readOnly={isReadOnly}
        allowSorting={true}
        configMaps={configMaps}
        secrets={secrets}
        addConfigMapSecret={addConfigMapSecret}
      />
      {currentEnvVars.isContainerArray && (
        <div className="environment-buttons">
          <TertiaryHeading>
            {t('public~All values from existing ConfigMaps or Secrets (envFrom)')}
            {!isReadOnly && (
              <FieldLevelHelp>
                <>
                  {t(
                    'public~Add new values by referencing an existing ConfigMap or Secret. Drag and drop environment variables within this section to change the order in which they are run.',
                  )}
                  <br />
                  <strong>{t('public~Note:')}</strong>{' '}
                  {t(
                    'public~If identical values exist in both lists, the single value in the list above will take precedence.',
                  )}
                </>
              </FieldLevelHelp>
            )}
          </TertiaryHeading>
          <EnvFromEditorComponent
            nameValueId={containerIndex}
            nameValuePairs={envVar[EnvType.ENV_FROM]}
            updateParentData={updateEnvVars}
            readOnly={isReadOnly}
            configMaps={configMaps}
            secrets={secrets}
          />
        </div>
      )}
    </>
  );

  return (
    <div className={css({ 'pf-v6-c-page__main-section': !currentEnvVars.isCreate })}>
      {containerVars}
      {!currentEnvVars.isCreate && (
        <div className="pf-v6-c-form environment-buttons">
          {displayErrorMessage && (
            <Alert isInline className="co-alert" variant="danger" title={displayErrorMessage} />
          )}
          {success && (
            <Alert
              isInline
              className="co-alert"
              variant="success"
              title={success}
              actionClose={<AlertActionCloseButton onClose={dismissSuccess} />}
            />
          )}
          {!isReadOnly && (
            <ActionGroup>
              <Button
                isDisabled={inProgress}
                type="submit"
                variant="primary"
                onClick={saveChanges}
                data-test="environment-save"
              >
                {t('public~Save')}
              </Button>
              <Button isDisabled={inProgress} type="button" variant="secondary" onClick={reload}>
                {t('public~Reload')}
              </Button>
            </ActionGroup>
          )}
        </div>
      )}
    </div>
  );
};

const EnvironmentPage_ = connect(stateToProps)(UnconnectedEnvironmentPage);
export const EnvironmentPage = withTranslation()(EnvironmentPage_);

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

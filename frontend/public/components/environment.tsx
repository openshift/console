import * as _ from 'lodash';
import { useSelector } from 'react-redux';
import { css } from '@patternfly/react-styles';
import {
  Alert,
  Button,
  ActionGroup,
  AlertActionCloseButton,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { AccessReviewResourceAttributes, getImpersonate } from '@console/dynamic-plugin-sdk';
import { useMemo, useState, useCallback, useEffect } from 'react';
import TertiaryHeading from '@console/shared/src/components/heading/TertiaryHeading';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import {
  k8sPatch,
  k8sGet,
  referenceFor,
  referenceForOwnerRef,
  K8sResourceKind,
  EnvVar,
} from '../module/k8s';
import { AsyncComponent } from './utils/async';
import { checkAccess } from './utils/rbac';
import { ContainerSelect } from './utils/container-select';
import { EnvFromPair, EnvType, NameValueEditorPair } from './utils/types';
import { FieldLevelHelp } from './utils/field-level-help';
import { LoadingBox, LoadingInline } from './utils/status-box';
import { ResourceLink } from './utils/resource-link';
import { ConfigMapModel, SecretModel } from '../models';
import { RootState } from '../redux';

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

interface EnvFromSource {
  prefix?: string;
  configMapRef?: {
    name: string;
    optional?: boolean;
  };
  secretRef?: {
    name: string;
    optional?: boolean;
  };
}

// Extended EnvVar type with ID field used by the editor
interface EnvVarWithID extends EnvVar {
  ID?: number;
}

// Extended EnvFromSource type with ID field used by the editor
interface EnvFromSourceWithID extends EnvFromSource {
  ID?: number;
}

interface Container {
  name: string;
  env?: EnvVarWithID[];
  envFrom?: EnvFromSourceWithID[];
  order?: number;
}

interface RawEnvData {
  containers?: Container[];
  initContainers?: Container[];
  env?: EnvVarWithID[];
  envFrom?: EnvFromSourceWithID[];
}

// Types for the transformed editor data structure
// env: Array of [envPairs, envFromPairs] tuples for each container
type EnvPairs = unknown[];
type EnvFromPairs = unknown[];
type ContainerEnvData = [EnvPairs, EnvFromPairs];

// Patch type for Kubernetes operations
interface K8sPatch {
  path: string;
  op: string;
  value: EnvVar[] | EnvFromSource[];
}

interface EnvVarsState {
  containers?: ContainerEnvData[];
  initContainers?: ContainerEnvData[];
  buildObject?: ContainerEnvData[];
}

/**
 * Set up initial value for the environment vars state. Use this in constructor or cancelChanges.
 *
 * Our return value here is an object in the form of:
 * \{
 *   env: [[envname, value, id],[...]]
 *   envFrom: [[envFromprefix, resourceObject, id], [...]]
 * \}
 */
const getPairsFromObject = (
  element: Partial<Container> = {},
): { env?: EnvPairs; envFrom?: EnvFromPairs } => {
  const returnedPairs: { env?: EnvPairs; envFrom?: EnvFromPairs } = {};
  if (_.isEmpty(element?.env)) {
    returnedPairs.env = [['', '', 0]];
  } else {
    returnedPairs.env = _.map(element.env, (leafNode: EnvVarWithID, i) => {
      if (_.isEmpty(leafNode.value) && _.isEmpty(leafNode.valueFrom)) {
        leafNode.value = '';
        delete leafNode.valueFrom;
      }
      leafNode.ID = i;
      return Object.values(leafNode);
    });
  }
  if (_.isEmpty(element?.envFrom)) {
    const configMapSecretRef = { name: '', key: '' };
    returnedPairs.envFrom = [['', { configMapSecretRef }, 0]];
  } else {
    returnedPairs.envFrom = _.map(element.envFrom, (leafNode: EnvFromSourceWithID, i) => {
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
 */
const envVarsToArray = (
  initialPairObjects?: Container[] | Partial<Container>,
): ContainerEnvData[] => {
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

const getContainersObjectForDropdown = (containerArray?: Container[]) => {
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
  currentEnvVars: EnvVarsState;
  rawEnvData: RawEnvData;
  isContainerArray: boolean;
  isCreate: boolean;
  hasInitContainers: boolean;
  state: { allowed: boolean };

  constructor(data?: RawEnvData, isContainerArray?: boolean, path?: string[]) {
    this.currentEnvVars = {};
    this.state = { allowed: true };
    if (!_.isEmpty(data) && arguments.length > 1) {
      this.setResultObject(data, isContainerArray, path);
    } else {
      this.setRawData(data);
    }
  }

  setRawData(rawEnvData: RawEnvData = {}): this {
    this.rawEnvData = rawEnvData;
    this.isContainerArray = _.isArray(rawEnvData?.containers);
    this.isCreate = _.isEmpty(rawEnvData);
    this.hasInitContainers = !_.isUndefined(rawEnvData?.initContainers);

    if (this.isContainerArray || this.isCreate) {
      this.currentEnvVars.containers = envVarsToArray(rawEnvData?.containers);
      this.currentEnvVars.initContainers = envVarsToArray(rawEnvData?.initContainers);
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
   */
  setResultObject(
    resultObject: K8sResourceKind | RawEnvData,
    isContainerArray: boolean,
    path: string[],
  ): this {
    const getNestedValue = (obj: K8sResourceKind | RawEnvData, pathArray: string[]): unknown => {
      return pathArray.reduce((acc, key) => acc?.[key], obj);
    };

    if (isContainerArray) {
      const parentPath = path.slice(0, -1);
      return this.setRawData(getNestedValue(resultObject, parentPath));
    }
    return this.setRawData(getNestedValue(resultObject, path));
  }

  getEnvVarByTypeAndIndex(type: string, index: number): ContainerEnvData {
    return this.currentEnvVars[type][index];
  }

  setFormattedVars(
    containerType: string,
    index: number,
    environmentType: number,
    formattedPairs: unknown[],
  ): this {
    this.currentEnvVars[containerType][index][environmentType] = formattedPairs;
    return this;
  }

  /**
   * Return array of patches for the save operation.
   */
  getPatches(envPath: string[]): K8sPatch[] {
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

      let patches: K8sPatch[] = _.concat<K8sPatch>(containerEnvPatch, containerEnvFromPatch);

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

        patches = _.concat<K8sPatch>(patches, envPatchForIC, envFromPatchForIC);
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
   */
  dispatchNewEnvironmentVariables(): EnvVar[] | null {
    return this.isCreate
      ? this._envVarsToNameVal(this.currentEnvVars.containers[0][EnvType.ENV])
      : null;
  }

  /**
   * Return env var pairs in name value notation, and strip out pairs that have empty name and values.
   */
  _envVarsToNameVal(finalEnvPairs: unknown[]): EnvVar[] {
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
   */
  _envFromVarsToResourcePrefix(finalEnvPairs: unknown[]): EnvFromSource[] {
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

interface EnvironmentPageProps {
  obj?: K8sResourceKind;
  rawEnvData?: RawEnvData;
  readOnly: boolean;
  envPath: string[];
  onChange?: (env: EnvVar[] | null) => void;
  addConfigMapSecret?: boolean;
  useLoadingInline?: boolean;
}

export const EnvironmentPage: React.FC<EnvironmentPageProps> = (props) => {
  const {
    rawEnvData = {},
    obj = {},
    readOnly,
    addConfigMapSecret = true,
    onChange,
    envPath,
    useLoadingInline,
  } = props;

  const { t } = useTranslation();

  const model = useSelector(
    (state: RootState) =>
      state.k8s.getIn(['RESOURCES', 'models', referenceFor(obj)]) ||
      state.k8s.getIn(['RESOURCES', 'models', obj?.kind]),
  );

  const impersonate = useSelector((state: RootState) => getImpersonate(state));
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const initialCurrentEnvVars = useMemo(() => new CurrentEnvVars(rawEnvData), [rawEnvData]);

  const [currentEnvVars, setCurrentEnvVars] = useState(initialCurrentEnvVars);
  const [success, setSuccess] = useState(null);
  const [containerIndex, setContainerIndex] = useState(0);
  const [containerType, setContainerType] = useState(
    initialCurrentEnvVars.isContainerArray || initialCurrentEnvVars.isCreate
      ? 'containers'
      : 'buildObject',
  );
  const [configMaps, setConfigMaps] = useState(null);
  const [secrets, setSecrets] = useState(null);
  const [allowed, setAllowed] = useState(!obj || _.isEmpty(obj) || !model);
  const [localErrorMessage, setLocalErrorMessage] = useState(null);

  const checkEditAccess = useCallback(() => {
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
    const resourceAttributes: AccessReviewResourceAttributes = {
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

  useEffect(() => {
    checkEditAccess();
    if (!addConfigMapSecret || readOnly) {
      setConfigMaps({});
      setSecrets({});
      return;
    }
    const envNamespace = obj?.metadata?.namespace;

    Promise.all([
      k8sGet(ConfigMapModel, null, envNamespace).catch((err) => {
        if (err.response?.status !== 403) {
          const errorMsg = err.message || t('public~Could not load ConfigMaps.');
          setLocalErrorMessage(errorMsg);
        }
        return {
          configMaps: {},
        };
      }),
      k8sGet(SecretModel, null, envNamespace).catch((err) => {
        if (err.response?.status !== 403) {
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
   */
  const updateEnvVars = useCallback(
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
  const reload = useCallback(() => {
    setCurrentEnvVars(new CurrentEnvVars(rawEnvData));
    setLocalErrorMessage(null);
    setSuccess(null);
  }, [rawEnvData]);

  const selectContainer = useCallback(
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
   */
  const saveChanges = useCallback(
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

  const dismissSuccess = useCallback(() => {
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

  const owners = (obj?.metadata?.ownerReferences || []).map((o, i) => (
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

import type { FC, FormEvent } from 'react';
import { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { css } from '@patternfly/react-styles';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { ActionGroup, Button, Checkbox } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getName } from '@console/shared/src/selectors/common';
import {
  isStorageClassProvisioner,
  StorageClassProvisioner,
  useResolvedExtensions,
  ProvisionerDetails as UnResolvedProvisionerDetails,
  ProvisionerType,
  ResolvedExtension,
  K8sResourceCommon,
} from '@console/dynamic-plugin-sdk';
import { ResolvedCodeRefProperties } from '@console/dynamic-plugin-sdk/src/types';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { AsyncComponent } from './utils/async';
import { ButtonBar } from './utils/button-bar';
import type { FirehoseResult } from './utils/types';
import { NameValueEditorPair } from './utils/types';
import { useK8sWatchResources } from './utils/k8s-watch-hook';
import { resourceObjPath } from './utils/resource-link';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { k8sCreate, K8sResourceKind, referenceForModel, referenceFor } from './../module/k8s';
import * as k8sActions from '../actions/k8s';
import { CSIDriverModel, StorageClassModel } from './../models';

const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() => import('./utils/name-value-editor').then((c) => c.NameValueEditor)}
    {...props}
  />
);

type Parameters = ProvisionerDetails['parameters'];

type ProvisionerDetails = ResolvedCodeRefProperties<UnResolvedProvisionerDetails>;
type ResolvedStorageClassProvisioner = ResolvedCodeRefProperties<StorageClassProvisioner>;

const isCSIProvisionerExtension = (extension: ResolvedStorageClassProvisioner) =>
  extension.properties.hasOwnProperty(ProvisionerType.CSI);

type StorageProvisionerMap = {
  [provisioner: string]: ProvisionerDetails;
};

const StorageClassFormInner: FC<StorageClassFormProps> = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [newStorageClass, setNewStorageClass] = useState<{
    name: string;
    description: string;
    type: any;
    parameters: {
      [k: string]: any;
    };
    reclaim: any;
    volumeBindingMode: string;
    expansion: boolean;
  }>({
    name: '',
    description: '',
    type: null,
    parameters: {},
    reclaim: null,
    volumeBindingMode: 'WaitForFirstConsumer',
    expansion: true,
  });
  const [customParams, setCustomParams] = useState([['', '']]);
  const [validationSuccessful, setValidationSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: any }>({ parameters: {} });

  const [needValidate, setNeedValidate] = useState(false);

  const resources = useRef<{ [k: string]: any }>();
  const previousName = useRef('');

  const defaultProvisionerObj: ProvisionerDetails = {
    title: '',
    provisioner: '',
    parameters: {},
    allowVolumeExpansion: () => true,
  };

  const storageTypes = useRef<{ [driverName: string]: ProvisionerDetails }>({});

  const CSIStorageTypes = useRef<StorageProvisionerMap>({});
  const defaultStorageTypes = useRef<StorageProvisionerMap>({});

  const getExtensions = (extensions) => {
    extensions.forEach((ext: ResolvedStorageClassProvisioner) => {
      if (isCSIProvisionerExtension(ext)) {
        CSIStorageTypes.current[ext.properties.CSI.provisioner] = { ...ext.properties.CSI };
      } else {
        defaultStorageTypes.current[ext.properties.OTHERS.provisioner] = {
          ...ext.properties.OTHERS,
        };
      }
    });
  };

  const reclaimPolicies = {
    Retain: t('public~Retain'),
    Delete: t('public~Delete'),
  };

  const volumeBindingModes = {
    Immediate: t('public~Immediate'),
    WaitForFirstConsumer: t('public~WaitForFirstConsumer'),
  };

  // Accepts a list of CSI provisioners and it checks if the
  // provisioner is listed in CSIStorageTypes object
  // if yes then return the provisioner with parameters that
  // needs to be filled by user.
  const csiProvisionerMap = (csiDrivers: K8sResourceKind[]) => {
    const csiListedProvisioner: string[] = Object.keys(CSIStorageTypes.current);
    csiDrivers.forEach((csiDriver: K8sResourceKind) => {
      for (const provisioner of csiListedProvisioner) {
        const csiDriverName = getName(csiDriver);
        const hasProvisioner = csiDriverName.includes(provisioner);
        if (hasProvisioner) {
          const provisionerData = _.cloneDeep(CSIStorageTypes.current[provisioner]);
          provisionerData.provisioner = csiDriverName;
          storageTypes.current[csiDriverName] = provisionerData;
          break;
        }
        const provisionerData = _.cloneDeep(defaultProvisionerObj);
        provisionerData.title = csiDriverName;
        provisionerData.provisioner = csiDriverName;
        storageTypes.current[csiDriverName] = provisionerData;
      }
    });
  };

  const validateName = () => {
    const updatedName = newStorageClass.name;
    const nameUpdated = updatedName !== previousName.current;
    const returnVal = {
      error: null,
      nameIsValid: true,
    };

    if (nameUpdated) {
      if (updatedName.trim().length === 0) {
        returnVal.error = t('public~Storage name is required');
        returnVal.nameIsValid = false;
      } else if (resources.current) {
        _.each(resources.current.data, function (storageClass) {
          if (storageClass.metadata.name === updatedName.toLowerCase()) {
            returnVal.error = t('public~Storage name must be unique');
            returnVal.nameIsValid = false;
          }
        });
      }
      previousName.current = updatedName;
    }

    return returnVal;
  };

  const validateParameters = () => {
    const params = newStorageClass.parameters;
    const allParamsValid = !_.some(params, ({ validationMsg }) => validationMsg !== null);
    return allParamsValid;
  };

  const paramIsRequired = (paramKey, params = newStorageClass.parameters) => {
    const requiredParam = _.get(
      storageTypes.current[newStorageClass.type],
      ['parameters', paramKey, 'required'],
      null,
    );
    let isRequired = false;
    if (requiredParam) {
      isRequired = _.isFunction(requiredParam) ? requiredParam(params) : requiredParam;
    }

    return isRequired;
  };

  const allRequiredFieldsFilled = () => {
    if (newStorageClass.name.trim().length === 0) {
      return false;
    }

    const { type: storageType, parameters: userEnteredParams } = newStorageClass;

    if (storageType === null) {
      return false;
    }

    const allParamsForType = storageTypes.current[storageType]?.parameters;

    const requiredKeys = _.keys(allParamsForType).filter((key) => paramIsRequired(key));
    const allReqdFieldsEntered = _.every(requiredKeys, (key) => {
      const value = _.get(userEnteredParams, [key, 'value']);
      return !_.isEmpty(value);
    });

    return allReqdFieldsEntered;
  };

  const validateForm = () => {
    // Clear error messages from previous validation attempts first
    setError(null);
    setFieldErrors({});

    const errs: { [k: string]: any } = {};
    let successful = true;

    const nameValidation = validateName();
    if (!nameValidation.nameIsValid) {
      errs.nameValidationMsg = nameValidation.error;
      successful = false;
    }

    if (newStorageClass.type === null) {
      successful = false;
    } else if (!validateParameters()) {
      successful = false;
    }

    if (!allRequiredFieldsFilled()) {
      successful = false;
    }

    setFieldErrors(errs);
    setValidationSuccessful(successful);
  };

  const prevProps = useRef(props);

  useEffect(() => {
    const [extensions, extensionsLoaded] = props.extensions;
    if (extensionsLoaded && !_.isEqual(props.extensions, prevProps.current.extensions)) {
      getExtensions(extensions);
    }
    if (props !== prevProps.current && extensionsLoaded) {
      storageTypes.current = _.cloneDeep(defaultStorageTypes.current);
      const loaded = props.resources?.sc?.loaded;
      const csiLoaded = props.resources?.csi?.loaded;
      const scData = (props.resources?.sc?.data || []) as K8sResourceKind[];
      const csiData = (props.resources?.csi?.data || []) as K8sResourceKind[];
      // making sure csi provisioners are added to "storageTypes" (if loaded) before running "validateForm"
      if (csiLoaded) {
        csiProvisionerMap(csiData);
      }
      if (loaded) {
        resources.current = {
          data: scData,
          loadError: props.resources?.sc?.loadError,
          loaded,
        };
        validateForm();
      }
    }

    prevProps.current = props;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  const updateNewStorage = (param: keyof Parameters, value, runValidation) => {
    const newParams = {
      ...newStorageClass,
      [param]: value,
    };

    setNewStorageClass(newParams);
    setNeedValidate(runValidation);
  };

  useEffect(() => {
    if (needValidate) {
      validateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newStorageClass]);

  const setParameterHandler = (param: keyof Parameters, event, checkbox) => {
    const newParams = { ...newStorageClass.parameters };
    if (checkbox) {
      newParams[param] = { value: event.target.checked } as Parameters[keyof Parameters];
    } else {
      if (event.target) {
        newParams[param] = { value: event.target.value } as Parameters[keyof Parameters];
      } else {
        newParams[param] = { value: event } as Parameters[keyof Parameters];
      }
    }

    _.forOwn(newParams, (value, key) => {
      if (newParams.hasOwnProperty(key)) {
        const validation = _.get(
          storageTypes.current[newStorageClass.type],
          ['parameters', key, 'validation'],
          null,
        );
        newParams[key].validationMsg = validation ? validation(newParams) : null;
      }
    });

    updateNewStorage('parameters', newParams, true);
  };

  const setStorageHandler = (param, value) => {
    updateNewStorage(param, value, true);
  };

  const addDefaultParams = () => {
    const defaultParams = storageTypes.current?.[newStorageClass?.type]?.parameters ?? {};
    const hiddenParmas = {};
    _.each(defaultParams, (values, param) => {
      const isVisible = _.isFunction(values?.visible)
        ? values.visible(defaultParams)
        : values?.visible ?? true;
      if (!isVisible && values.value) {
        hiddenParmas[param] = values;
      }
    });
    const value = { ...newStorageClass.parameters, ...hiddenParmas };
    const newParams = {
      ...newStorageClass,
      parameters: value,
    };

    return newParams;
  };

  const getCustomParams = () => {
    // Discard any row whose key is blank
    const c = _.reject(customParams, (v) => _.isEmpty(v[NameValueEditorPair.Name]));

    // Display error if duplicate keys are found
    const keys = c.map((v) => v[NameValueEditorPair.Name]);
    if (_.uniq(keys).length !== keys.length) {
      setError(t('public~Duplicate keys found.'));
      return;
    }

    // Convert any blank values to null
    _.each(
      c,
      (v) =>
        (v[NameValueEditorPair.Value] = _.isEmpty(v[NameValueEditorPair.Value])
          ? null
          : v[NameValueEditorPair.Value]),
    );

    return _.fromPairs(c);
  };

  const getFormParams = (newStorageClassBeforeCreation) => {
    const type = newStorageClassBeforeCreation.type;
    const dataParameters = _.pickBy(
      _.mapValues(newStorageClassBeforeCreation.parameters, (value, key) => {
        let finalValue = value.value;
        if (storageTypes.current[type]?.parameters[key]?.format) {
          finalValue = storageTypes.current[type].parameters[key].format(value.value);
        }
        return finalValue;
      }),
      (value) => value !== '',
    );

    return _.merge(dataParameters, getCustomParams());
  };

  const createStorageClass = (e: FormEvent<EventTarget>) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    const newStorage = addDefaultParams();

    const { name, description, type, reclaim, expansion, volumeBindingMode } = newStorage;
    const dataParameters = getFormParams(newStorage);
    const annotations = description ? { description } : {};
    let data: StorageClass = {
      metadata: {
        name,
        annotations,
      },
      provisioner: storageTypes.current[type].provisioner,
      parameters: dataParameters,
    };

    if (reclaim) {
      data.reclaimPolicy = reclaim;
    }

    if (volumeBindingMode) {
      data.volumeBindingMode = volumeBindingMode;
    }

    const allowVolumeExpansion = storageTypes.current?.[type]?.allowVolumeExpansion;
    const shouldAllowVolumeExpansion = _.isFunction(allowVolumeExpansion)
      ? allowVolumeExpansion(newStorageClass.parameters)
      : allowVolumeExpansion;
    if (shouldAllowVolumeExpansion) {
      data.allowVolumeExpansion = expansion;
    }
    const { mutator } = storageTypes.current[type];
    if (_.isFunction(mutator)) {
      data = mutator(data);
    }

    k8sCreate(StorageClassModel, data)
      .then((resource) => {
        setLoading(false);
        navigate(resourceObjPath(resource, referenceFor(resource)));
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
      });
  };

  const getProvisionerElements = () => {
    const parameters = storageTypes.current[newStorageClass.type]?.parameters;

    const dynamicContent = _.map(parameters, (parameter, key) => {
      const paramId = `storage-class-provisioner-${_.kebabCase(_.get(parameter, 'name', key))}`;
      const validationMsg = _.get(parameter, 'validationMsg', null);
      const isCheckbox = parameter.type === 'checkbox';
      const selectedKey = ['parameters', key, 'value'];
      const visibilityProperty = parameter?.visible ?? true;
      const isVisible = _.isFunction(visibilityProperty)
        ? visibilityProperty(newStorageClass.parameters)
        : visibilityProperty;
      if (!isVisible) {
        return null;
      }

      if (parameter.Component) {
        const { Component } = parameter;
        return (
          <Component
            key={key}
            parameterKey={key}
            parameterValue={newStorageClass.parameters[key]?.value || ''}
            onParamChange={setParameterHandler}
          />
        );
      }

      const children = parameter.values ? (
        <>
          <label className={css({ 'co-required': paramIsRequired(key) })} htmlFor={paramId}>
            {_.get(parameter, 'name', key)}
          </label>
          <ConsoleSelect
            title={parameter.hintText}
            items={parameter.values}
            isFullWidth
            selectedKey={_.get(newStorageClass, selectedKey)}
            onChange={(event) => setParameterHandler(key, event, false)}
            id={paramId}
            dataTest={paramId}
          />
          <span className="help-block">{validationMsg ? validationMsg : null}</span>
        </>
      ) : (
        <>
          {isCheckbox ? (
            <Checkbox
              label={_.get(parameter, 'name', key)}
              onChange={(event) => setParameterHandler(key, event, isCheckbox)}
              isChecked={_.get(newStorageClass, selectedKey, false)}
              name={`provisioner-settings-${key}-checkbox`}
              id={`provisioner-settings-${key}-checkbox`}
              data-test={paramId}
            />
          ) : (
            <>
              <label
                className={css({
                  'co-required': paramIsRequired(key),
                })}
                htmlFor={paramId}
              >
                {_.get(parameter, 'name', key)}
              </label>
              <span className="pf-v6-c-form-control">
                <input
                  type="text"
                  value={_.get(newStorageClass, selectedKey, '')}
                  onChange={(event) => setParameterHandler(key, event, isCheckbox)}
                  id={paramId}
                  data-test={paramId}
                />
              </span>
            </>
          )}
          <span className="help-block">{validationMsg ? validationMsg : parameter.hintText}</span>
        </>
      );

      return (
        <div
          key={key}
          className={css('form-group', {
            'has-error': _.get(newStorageClass.parameters, `${key}.validationMsg`, null),
          })}
        >
          {children}
        </div>
      );
    });
    const documentationLink = storageTypes.current[newStorageClass.type]?.documentationLink;
    return (
      <>
        {!_.isEmpty(parameters) && dynamicContent}

        <div className="form-group">
          <label>{t('public~Additional parameters')}</label>
          <p>
            {t('public~Specific fields for the selected provisioner.')}
            &nbsp;
            {documentationLink && (
              <ExternalLink
                href={documentationLink()}
                text={t('public~What should I enter here?')}
              />
            )}
          </p>
          <NameValueEditorComponent
            nameValuePairs={customParams}
            nameString={t('public~Parameter')}
            nameParameter={t('public~parameter')}
            valueString={t('public~Value')}
            addString={t('public~Add Parameter')}
            updateParentData={(c) => setCustomParams(c.nameValuePairs)}
          />
        </div>
      </>
    );
  };

  const autocompleteFilter = (text, item) => fuzzy(text, item);

  const reclaimPolicyKey =
    newStorageClass.reclaim === null ? reclaimPolicies.Delete : newStorageClass.reclaim;
  const volumeBindingModeKey =
    newStorageClass.volumeBindingMode || volumeBindingModes.WaitForFirstConsumer;
  const allowVolumeExpansion = storageTypes.current?.[newStorageClass.type]?.allowVolumeExpansion;
  const expansionFlag =
    newStorageClass.type &&
    (_.isFunction(allowVolumeExpansion)
      ? allowVolumeExpansion(newStorageClass.parameters)
      : allowVolumeExpansion);
  const allowExpansion = expansionFlag ? newStorageClass.expansion : false;

  return (
    <div className="co-m-pane__form">
      <PageHeading
        title={t('public~StorageClass')}
        linkProps={{
          component: LinkTo(`/k8s/cluster/storageclasses/~new`, { replace: true }),
          id: 'yaml-link',
          'data-test': 'yaml-link',
          label: t('public~Edit YAML'),
        }}
      />
      <PaneBody>
        <form data-test-id="storage-class-form">
          <div className={css('form-group', { 'has-error': fieldErrors.nameValidationMsg })}>
            <label className="co-required" htmlFor="storage-class-name">
              {t('public~Name')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="text"
                placeholder={newStorageClass.name}
                id="storage-class-name"
                data-test="storage-class-name"
                onChange={(event) => setStorageHandler('name', event.target.value.trim())}
                value={_.get(newStorageClass, 'name', '')}
              />
            </span>
            <span className="help-block">
              {fieldErrors.nameValidationMsg ? fieldErrors.nameValidationMsg : null}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="storage-class-description">{t('public~Description')}</label>
            <span className="pf-v6-c-form-control">
              <input
                type="text"
                id="storage-class-description"
                data-test="storage-class-description"
                onChange={(event) => setStorageHandler('description', event.target.value)}
                value={_.get(newStorageClass, 'description', '')}
              />
            </span>
          </div>

          <div className="form-group">
            <label className="co-required" htmlFor="storage-class-reclaim-policy">
              {t('public~Reclaim policy')}
            </label>
            <ConsoleSelect
              title={t('public~Select reclaim policy')}
              items={reclaimPolicies}
              isFullWidth
              selectedKey={reclaimPolicyKey}
              onChange={(event) => setStorageHandler('reclaim', event)}
              id="storage-class-reclaim-policy"
            />
            <span className="help-block">
              {t(
                'public~Determines what happens to persistent volumes when the associated persistent volume claim is deleted. Defaults to "Delete"',
              )}
            </span>
          </div>

          <div className="form-group">
            <label className="co-required" htmlFor="storage-class-volume-binding-mode">
              {t('public~Volume binding mode')}
            </label>
            <ConsoleSelect
              title={t('public~Select volume binding mode')}
              items={volumeBindingModes}
              isFullWidth
              selectedKey={volumeBindingModeKey}
              onChange={(event) => setStorageHandler('volumeBindingMode', event)}
              id="storage-class-volume-binding-mode"
              dataTest="storage-class-volume-binding-mode"
            />
            <span className="help-block">
              {t(
                'public~Determines when persistent volume claims will be provisioned and bound. Defaults to "WaitForFirstConsumer"',
              )}
            </span>
          </div>

          <div className="form-group">
            <label className="co-required" htmlFor="storage-class-provisioner">
              {t('public~Provisioner')}
            </label>
            <ConsoleSelect
              title={t('public~Select Provisioner')}
              autocompleteFilter={autocompleteFilter}
              autocompletePlaceholder={t('public~Select Provisioner')}
              items={_.mapValues(storageTypes.current, 'provisioner')}
              isFullWidth
              menuClassName="dropdown-menu--text-wrap"
              selectedKey={newStorageClass.type}
              onChange={(event) => setStorageHandler('type', event)}
              id="storage-class-provisioner"
              dataTest="storage-class-provisioner-dropdown"
            />
            <span className="help-block">
              {t(
                'public~Determines what volume plugin is used for provisioning PersistentVolumes.',
              )}
            </span>
          </div>

          <div className="co-form-subsection">
            {newStorageClass.type !== null ? getProvisionerElements() : null}
          </div>

          {expansionFlag && (
            <Checkbox
              label={t('public~Allow PersistentVolumeClaims to be expanded')}
              onChange={(_event, checked) => setStorageHandler('expansion', checked)}
              isChecked={allowExpansion}
              name="expansion"
              id="expansion"
            />
          )}

          <ButtonBar errorMessage={error ? error.message : ''} inProgress={loading}>
            <ActionGroup className="pf-v6-c-form">
              <Button
                id="save-changes"
                isDisabled={!validationSuccessful}
                onClick={createStorageClass}
                type="submit"
                variant="primary"
              >
                {t('public~Create')}
              </Button>
              <Button
                id="cancel"
                onClick={() => navigate('/k8s/cluster/storageclasses')}
                type="button"
                variant="secondary"
              >
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </PaneBody>
    </div>
  );
};

type StateProps = {
  k8s: any;
  onClose: () => void;
};

type DispatchProps = {
  watchK8sList: (id: string, query: object, kind: object) => void;
  stopK8sWatch: (id: string) => void;
};

const mapStateToProps = ({ k8s }, { onClose }): StateProps => ({
  k8s,
  onClose,
});

const mapDispatchToProps = (): DispatchProps => ({
  stopK8sWatch: k8sActions.stopK8sWatch,
  watchK8sList: k8sActions.watchK8sList,
});

export type StorageClassFormProps = StateProps &
  DispatchProps & {
    resources?: {
      [key: string]: FirehoseResult;
    };
  } & {
    extensions?: [ResolvedExtension<StorageClassProvisioner>[], boolean, any[]];
  };

export type StorageClassData = {
  name: string;
  type: string;
  description: string;
  parameters: Parameters;
  reclaim: string;
  volumeBindingMode: string;
  expansion: boolean;
};

export type StorageClass = K8sResourceCommon & {
  provisioner: string;
  parameters: object;
  reclaimPolicy?: string;
  volumeBindingMode?: string;
  allowVolumeExpansion?: boolean;
};

export type StorageClassFormState = {
  newStorageClass: StorageClassData;
  customParams: string[][];
  validationSuccessful: boolean;
  loading: boolean;
  error: any;
  fieldErrors: { [k: string]: any };
};

export type Resources = {
  loaded: boolean;
  data: any[];
  loadError: string;
};

export const ConnectedStorageClassForm = connect(
  mapStateToProps,
  mapDispatchToProps,
)((props: StateProps & DispatchProps) => {
  const extensions = useResolvedExtensions<StorageClassProvisioner>(isStorageClassProvisioner);
  return <StorageClassFormInner extensions={extensions} {...props} />;
});

export const StorageClassForm = (props) => {
  const resources = useK8sWatchResources({
    sc: { kind: StorageClassModel.kind, isList: true },
    csi: { kind: referenceForModel(CSIDriverModel), isList: true },
  });

  return (
    <ConnectedStorageClassForm
      {...props}
      sc={{ data: resources.sc.data, loaded: resources.sc.loaded, loadError: resources.sc.loadError }}
      csi={{ data: resources.csi.data, loaded: resources.csi.loaded, loadError: resources.csi.loadError }}
    />
  );
};

ConnectedStorageClassForm.displayName = 'StorageClassForm';

import type { FC, FormEvent } from 'react';
import { useState, useMemo } from 'react';
import { ActionGroup, Button, Checkbox } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router';
import type {
  StorageClassProvisioner,
  ProvisionerDetails as UnResolvedProvisionerDetails,
  ResolvedExtension,
  K8sResourceCommon,
} from '@console/dynamic-plugin-sdk';
import {
  isStorageClassProvisioner,
  useResolvedExtensions,
  ProvisionerType,
} from '@console/dynamic-plugin-sdk';
import type { WatchK8sResultsObject } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { ResolvedCodeRefProperties } from '@console/dynamic-plugin-sdk/src/types';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';
import { getName } from '@console/shared/src/selectors/common';
import * as k8sActions from '../actions/k8s';
import { CSIDriverModel, StorageClassModel } from '../models';
import { k8sCreate, referenceForModel, referenceFor } from '../module/k8s';
import type { K8sResourceKind } from '../module/k8s';
import { AsyncComponent } from './utils/async';
import { ButtonBar } from './utils/button-bar';
import { useK8sWatchResources } from './utils/k8s-watch-hook';
import { resourceObjPath } from './utils/resource-link';
import { NameValueEditorPair } from './utils/types';

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

const EMPTY_EXTENSIONS: [ResolvedExtension<StorageClassProvisioner>[], boolean, any[]] = [
  [],
  false,
  [],
];

const defaultProvisionerObj: ProvisionerDetails = {
  title: '',
  provisioner: '',
  parameters: {},
  allowVolumeExpansion: () => true,
};

// Accepts a list of CSIDrivers and checks whether each driver matches a
// provisioner listed in the given CSI provisioner map. If yes, returns the
// provisioner with parameters that need to be filled by the user; otherwise
// the driver gets a default provisioner entry.
const csiProvisionerMap = (
  csiDrivers: K8sResourceKind[],
  csiTypes: StorageProvisionerMap,
): StorageProvisionerMap => {
  const csiEntries: StorageProvisionerMap = {};
  const csiListedProvisioner: string[] = Object.keys(csiTypes);
  csiDrivers.forEach((csiDriver: K8sResourceKind) => {
    for (const provisioner of csiListedProvisioner) {
      const csiDriverName = getName(csiDriver);
      const hasProvisioner = csiDriverName.includes(provisioner);
      if (hasProvisioner) {
        const provisionerData = _.cloneDeep(csiTypes[provisioner]);
        provisionerData.provisioner = csiDriverName;
        csiEntries[csiDriverName] = provisionerData;
        break;
      }
      const provisionerData = _.cloneDeep(defaultProvisionerObj);
      provisionerData.title = csiDriverName;
      provisionerData.provisioner = csiDriverName;
      csiEntries[csiDriverName] = provisionerData;
    }
  });
  return csiEntries;
};

const StorageClassFormInner: FC<StorageClassFormProps> = (props) => {
  const { t } = useTranslation('public');
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
  const [previousName, setPreviousName] = useState('');

  const [extensions, extensionsLoaded] = props.extensions ?? EMPTY_EXTENSIONS;

  const { defaultStorageTypes, csiStorageTypes } = useMemo(() => {
    const defaults: StorageProvisionerMap = {};
    const csi: StorageProvisionerMap = {};
    extensions.forEach((ext: ResolvedStorageClassProvisioner) => {
      if (isCSIProvisionerExtension(ext)) {
        csi[ext.properties.CSI.provisioner] = { ...ext.properties.CSI };
      } else {
        defaults[ext.properties.OTHERS.provisioner] = { ...ext.properties.OTHERS };
      }
    });
    return { defaultStorageTypes: defaults, csiStorageTypes: csi };
  }, [extensions]);

  // Provisioners offered by the form: plugin-provided defaults plus one entry
  // per installed CSIDriver.
  const storageTypes: StorageProvisionerMap = useMemo(() => {
    if (!extensionsLoaded) {
      return {};
    }
    const types = _.cloneDeep(defaultStorageTypes);
    const csiLoaded = props.resources?.csi?.loaded;
    // making sure csi provisioners are added to "storageTypes" (if loaded) before running "validateForm"
    if (csiLoaded) {
      const csiData = (props.resources?.csi?.data || []) as K8sResourceKind[];
      // CSI entries replace any same-keyed plugin-provided entries wholesale,
      // matching the original ref-cache behavior.
      Object.assign(types, csiProvisionerMap(csiData, csiStorageTypes));
    }
    return types;
  }, [
    extensionsLoaded,
    defaultStorageTypes,
    csiStorageTypes,
    props.resources?.csi?.loaded,
    props.resources?.csi?.data,
  ]);

  const reclaimPolicies = {
    Retain: t('Retain'),
    Delete: t('Delete'),
  };

  const volumeBindingModes = {
    Immediate: t('Immediate'),
    WaitForFirstConsumer: t('WaitForFirstConsumer'),
  };

  const validateName = (formState = newStorageClass) => {
    const updatedName = formState.name;
    const nameUpdated = updatedName !== previousName;
    const returnVal = {
      error: null,
      nameIsValid: true,
    };

    if (updatedName.trim().length === 0) {
      // The message only shows once the field has been edited, not for a pristine form.
      returnVal.nameIsValid = false;
      if (nameUpdated) {
        returnVal.error = t('Storage name is required');
      }
    } else if (props.resources?.sc?.loaded) {
      // Always re-check uniqueness against the current watch data: a watch
      // tick can land between keystrokes, and skipping the check when the
      // name is unchanged would clear a shown duplicate-name error.
      const scData = (props.resources?.sc?.data || []) as K8sResourceKind[];
      _.each(scData, (storageClass) => {
        if (storageClass.metadata.name === updatedName.toLowerCase()) {
          returnVal.error = t('Storage name must be unique');
          returnVal.nameIsValid = false;
        }
      });
    }
    if (nameUpdated) {
      setPreviousName(updatedName);
    }

    return returnVal;
  };

  const validateParameters = (formState = newStorageClass) => {
    const params = formState.parameters;
    const allParamsValid = !_.some(params, ({ validationMsg }) => validationMsg !== null);
    return allParamsValid;
  };

  const paramIsRequired = (paramKey, formState = newStorageClass) => {
    const requiredParam = _.get(
      storageTypes[formState.type],
      ['parameters', paramKey, 'required'],
      null,
    );
    let isRequired = false;
    if (requiredParam) {
      isRequired = _.isFunction(requiredParam)
        ? requiredParam(formState.parameters)
        : requiredParam;
    }

    return isRequired;
  };

  const allRequiredFieldsFilled = (formState = newStorageClass) => {
    if (formState.name.trim().length === 0) {
      return false;
    }

    const { type: storageType, parameters: userEnteredParams } = formState;

    if (storageType === null) {
      return false;
    }

    const allParamsForType = storageTypes[storageType]?.parameters;

    const requiredKeys = _.keys(allParamsForType).filter((key) => paramIsRequired(key, formState));
    const allReqdFieldsEntered = _.every(requiredKeys, (key) => {
      const value = _.get(userEnteredParams, [key, 'value']);
      return !_.isEmpty(value);
    });

    return allReqdFieldsEntered;
  };

  const validateForm = (formState = newStorageClass) => {
    // Clear error messages from previous validation attempts first
    setError(null);
    setFieldErrors({});

    const errs: { [k: string]: any } = {};
    let successful = true;

    const nameValidation = validateName(formState);
    if (!nameValidation.nameIsValid) {
      errs.nameValidationMsg = nameValidation.error;
      successful = false;
    }

    if (formState.type === null) {
      successful = false;
    } else if (!validateParameters(formState)) {
      successful = false;
    }

    if (!allRequiredFieldsFilled(formState)) {
      successful = false;
    }

    setFieldErrors(errs);
    setValidationSuccessful(successful);
  };

  const updateNewStorage = (param: keyof Parameters, value, runValidation) => {
    const newParams = {
      ...newStorageClass,
      [param]: value,
    };

    setNewStorageClass(newParams);
    if (runValidation) {
      validateForm(newParams);
    }
  };

  const setParameterHandler = (param: keyof Parameters, event, checkbox) => {
    const newParams = { ...newStorageClass.parameters };
    if (checkbox) {
      newParams[param] = { value: event.target.checked } as Parameters[keyof Parameters];
    } else if (event.target) {
      newParams[param] = { value: event.target.value } as Parameters[keyof Parameters];
    } else {
      newParams[param] = { value: event } as Parameters[keyof Parameters];
    }

    _.forOwn(newParams, (value, key) => {
      if (newParams.hasOwnProperty(key)) {
        const validation = _.get(
          storageTypes[newStorageClass.type],
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
    const defaultParams = storageTypes[newStorageClass?.type]?.parameters ?? {};
    const hiddenParmas = {};
    _.each(defaultParams, (values, param) => {
      const isVisible = _.isFunction(values?.visible)
        ? values.visible(defaultParams)
        : (values?.visible ?? true);
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
      setError(t('Duplicate keys found.'));
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
    const { type } = newStorageClassBeforeCreation;
    const dataParameters = _.pickBy(
      _.mapValues(newStorageClassBeforeCreation.parameters, (value, key) => {
        let finalValue = value.value;
        if (storageTypes[type]?.parameters[key]?.format) {
          finalValue = storageTypes[type].parameters[key].format(value.value);
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
      provisioner: storageTypes[type].provisioner,
      parameters: dataParameters,
    };

    if (reclaim) {
      data.reclaimPolicy = reclaim;
    }

    if (volumeBindingMode) {
      data.volumeBindingMode = volumeBindingMode;
    }

    const allowVolumeExpansion = storageTypes[type]?.allowVolumeExpansion;
    const shouldAllowVolumeExpansion = _.isFunction(allowVolumeExpansion)
      ? allowVolumeExpansion(newStorageClass.parameters)
      : allowVolumeExpansion;
    if (shouldAllowVolumeExpansion) {
      data.allowVolumeExpansion = expansion;
    }
    const { mutator } = storageTypes[type];
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
    const parameters = storageTypes[newStorageClass.type]?.parameters;

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
          <span className="help-block">{validationMsg || null}</span>
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
          <span className="help-block">{validationMsg || parameter.hintText}</span>
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
    const documentationLink = storageTypes[newStorageClass.type]?.documentationLink;
    return (
      <>
        {!_.isEmpty(parameters) && dynamicContent}

        <div className="form-group">
          <label>{t('Additional parameters')}</label>
          <p>
            {t('Specific fields for the selected provisioner.')}
            &nbsp;
            {documentationLink && (
              <ExternalLink href={documentationLink()} text={t('What should I enter here?')} />
            )}
          </p>
          <NameValueEditorComponent
            nameValuePairs={customParams}
            nameString={t('Parameter')}
            nameParameter={t('parameter')}
            valueString={t('Value')}
            addString={t('Add Parameter')}
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
  const allowVolumeExpansion = storageTypes[newStorageClass.type]?.allowVolumeExpansion;
  const expansionFlag =
    newStorageClass.type &&
    (_.isFunction(allowVolumeExpansion)
      ? allowVolumeExpansion(newStorageClass.parameters)
      : allowVolumeExpansion);
  const allowExpansion = expansionFlag ? newStorageClass.expansion : false;

  const scLoaded = !!props.resources?.sc?.loaded;
  const scData = props.resources?.sc?.data;
  const [lastValidated, setLastValidated] = useState<{
    scLoaded: boolean;
    scData: typeof scData;
    storageTypes: typeof storageTypes;
  } | null>(null);
  if (
    !lastValidated ||
    scLoaded !== lastValidated.scLoaded ||
    scData !== lastValidated.scData ||
    storageTypes !== lastValidated.storageTypes
  ) {
    setLastValidated({ scLoaded, scData, storageTypes });
    if (scLoaded && extensionsLoaded) {
      validateForm();
    }
  }

  return (
    <div className="co-m-pane__form">
      <PageHeading
        title={t('StorageClass')}
        linkProps={{
          component: LinkTo(`/k8s/cluster/storageclasses/~new`, { replace: true }),
          id: 'yaml-link',
          'data-test': 'yaml-link',
          label: t('Edit YAML'),
        }}
      />
      <PaneBody>
        <form data-test-id="storage-class-form">
          <div className={css('form-group', { 'has-error': fieldErrors.nameValidationMsg })}>
            <label className="co-required" htmlFor="storage-class-name">
              {t('Name')}
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
            <label htmlFor="storage-class-description">{t('Description')}</label>
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
              {t('Reclaim policy')}
            </label>
            <ConsoleSelect
              title={t('Select reclaim policy')}
              items={reclaimPolicies}
              isFullWidth
              selectedKey={reclaimPolicyKey}
              onChange={(event) => setStorageHandler('reclaim', event)}
              id="storage-class-reclaim-policy"
            />
            <span className="help-block">
              {t(
                'Determines what happens to persistent volumes when the associated persistent volume claim is deleted. Defaults to "Delete"',
              )}
            </span>
          </div>

          <div className="form-group">
            <label className="co-required" htmlFor="storage-class-volume-binding-mode">
              {t('Volume binding mode')}
            </label>
            <ConsoleSelect
              title={t('Select volume binding mode')}
              items={volumeBindingModes}
              isFullWidth
              selectedKey={volumeBindingModeKey}
              onChange={(event) => setStorageHandler('volumeBindingMode', event)}
              id="storage-class-volume-binding-mode"
              dataTest="storage-class-volume-binding-mode"
            />
            <span className="help-block">
              {t(
                'Determines when persistent volume claims will be provisioned and bound. Defaults to "WaitForFirstConsumer"',
              )}
            </span>
          </div>

          <div className="form-group">
            <label className="co-required" htmlFor="storage-class-provisioner">
              {t('Provisioner')}
            </label>
            <ConsoleSelect
              title={t('Select Provisioner')}
              autocompleteFilter={autocompleteFilter}
              autocompletePlaceholder={t('Select Provisioner')}
              items={_.mapValues(storageTypes, 'provisioner')}
              isFullWidth
              menuClassName="dropdown-menu--text-wrap"
              selectedKey={newStorageClass.type}
              onChange={(event) => setStorageHandler('type', event)}
              id="storage-class-provisioner"
              dataTest="storage-class-provisioner-dropdown"
            />
            <span className="help-block">
              {t('Determines what volume plugin is used for provisioning PersistentVolumes.')}
            </span>
          </div>

          <div className="co-form-subsection">
            {newStorageClass.type !== null ? getProvisionerElements() : null}
          </div>

          {expansionFlag && (
            <Checkbox
              label={t('Allow PersistentVolumeClaims to be expanded')}
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
                {t('Create')}
              </Button>
              <Button
                id="cancel"
                onClick={() => navigate('/k8s/cluster/storageclasses')}
                type="button"
                variant="secondary"
              >
                {t('Cancel')}
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

type StorageClassFormProps = StateProps &
  DispatchProps & {
    resources?: {
      [key: string]: WatchK8sResultsObject<K8sResourceCommon | K8sResourceCommon[]>;
    };
  } & {
    extensions?: [ResolvedExtension<StorageClassProvisioner>[], boolean, any[]];
  };

type StorageClass = K8sResourceCommon & {
  provisioner: string;
  parameters: object;
  reclaimPolicy?: string;
  volumeBindingMode?: string;
  allowVolumeExpansion?: boolean;
};

const ConnectedStorageClassForm = connect(
  mapStateToProps,
  mapDispatchToProps,
)((props: StateProps & DispatchProps) => {
  const extensions = useResolvedExtensions<StorageClassProvisioner>(isStorageClassProvisioner);
  return <StorageClassFormInner extensions={extensions} {...props} />;
});

export const StorageClassForm = (props) => {
  const watchedResources = useK8sWatchResources({
    sc: { kind: StorageClassModel.kind, isList: true },
    csi: { kind: referenceForModel(CSIDriverModel), isList: true },
  });

  return (
    <ConnectedStorageClassForm
      {...props}
      resources={{
        sc: {
          data: watchedResources.sc.data,
          loaded: watchedResources.sc.loaded,
          loadError: watchedResources.sc.loadError,
        },
        csi: {
          data: watchedResources.csi.data,
          loaded: watchedResources.csi.loaded,
          loadError: watchedResources.csi.loadError,
        },
      }}
    />
  );
};

ConnectedStorageClassForm.displayName = 'StorageClassForm';

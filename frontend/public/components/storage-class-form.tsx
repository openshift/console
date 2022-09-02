import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash-es';
import { i18n, TFunction } from 'i18next';
import { ActionGroup, Button } from '@patternfly/react-core';
import { withTranslation } from 'react-i18next';
import { getName } from '@console/shared';
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
import {
  AsyncComponent,
  ButtonBar,
  Dropdown,
  ExternalLink,
  Firehose,
  FirehoseResult,
  history,
  NameValueEditorPair,
  PageHeading,
  resourceObjPath,
} from './utils';

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

const defaultState = {
  newStorageClass: {
    name: '',
    description: '',
    type: null,
    parameters: {},
    reclaim: null,
    volumeBindingMode: 'WaitForFirstConsumer',
    expansion: true,
  },
  customParams: [['', '']],
  validationSuccessful: false,
  loading: false,
  error: null,
  fieldErrors: { parameters: {} },
};

type ProvisionerDetails = ResolvedCodeRefProperties<UnResolvedProvisionerDetails>;
type ResolvedStorageClassProvisioner = ResolvedCodeRefProperties<StorageClassProvisioner>;

const isCSIProvisionerExtension = (extension: ResolvedStorageClassProvisioner) =>
  extension.properties.hasOwnProperty(ProvisionerType.CSI);

type StorageProvisionerMap = {
  [provisioner: string]: ProvisionerDetails;
};
class StorageClassFormWithTranslation extends React.Component<
  StorageClassFormProps,
  StorageClassFormState
> {
  resources: Resources;
  reduxId: string;
  previousName: string;

  constructor(props) {
    super(props);
    this.state = defaultState;
    this.previousName = '';
  }

  defaultProvisionerObj: ProvisionerDetails = {
    title: '',
    provisioner: '',
    parameters: {},
    allowVolumeExpansion: () => true,
  };

  storageTypes: { [driverName: string]: ProvisionerDetails } = {};

  CSIStorageTypes: StorageProvisionerMap = {};
  defaultStorageTypes: StorageProvisionerMap = {};

  getExtensions = (extensions) => {
    extensions.forEach((ext: ResolvedStorageClassProvisioner) => {
      if (isCSIProvisionerExtension(ext)) {
        this.CSIStorageTypes[ext.properties.CSI.provisioner] = { ...ext.properties.CSI };
      } else {
        this.defaultStorageTypes[ext.properties.OTHERS.provisioner] = { ...ext.properties.OTHERS };
      }
    });
  };

  reclaimPolicies = {
    Retain: this.props.t('public~Retain'),
    Delete: this.props.t('public~Delete'),
  };

  volumeBindingModes = {
    Immediate: this.props.t('public~Immediate'),
    WaitForFirstConsumer: this.props.t('public~WaitForFirstConsumer'),
  };

  // Accepts a list of CSI provisioners and it checks if the
  // provisioner is listed in CSIStorageTypes object
  // if yes then return the provisioner with parameters that
  // needs to be filled by user.
  csiProvisionerMap = (csiDrivers: K8sResourceKind[]) => {
    const csiListedProvisioner: string[] = Object.keys(this.CSIStorageTypes);
    csiDrivers.forEach((csiDriver: K8sResourceKind) => {
      for (const provisioner of csiListedProvisioner) {
        const csiDriverName = getName(csiDriver);
        const hasProvisioner = csiDriverName.includes(provisioner);
        if (hasProvisioner) {
          const provisionerData = _.cloneDeep(this.CSIStorageTypes[provisioner]);
          provisionerData.provisioner = csiDriverName;
          this.storageTypes[csiDriverName] = provisionerData;
          break;
        }
        const provisionerData = _.cloneDeep(this.defaultProvisionerObj);
        provisionerData.title = csiDriverName;
        provisionerData.provisioner = csiDriverName;
        this.storageTypes[csiDriverName] = provisionerData;
      }
    });
  };

  componentDidUpdate(prevProps) {
    const [extensions, extensionsLoaded] = this.props.extensions;
    if (extensionsLoaded && !_.isEqual(this.props.extensions, prevProps.extensions)) {
      this.getExtensions(extensions);
    }
    if (this.props !== prevProps && extensionsLoaded) {
      this.storageTypes = _.cloneDeep(this.defaultStorageTypes);
      const { resources } = this.props;
      const loaded = resources?.sc?.loaded;
      const csiLoaded = resources?.csi?.loaded;
      const scData = (resources?.sc?.data || []) as K8sResourceKind[];
      const csiData = (resources?.csi?.data || []) as K8sResourceKind[];
      if (loaded) {
        this.resources = {
          data: scData,
          loadError: resources?.sc?.loadError,
          loaded,
        };
        this.validateForm();
      }
      if (csiLoaded) {
        this.csiProvisionerMap(csiData);
      }
    }
  }

  setParameterHandler = (param: keyof Parameters, event, checkbox) => {
    const newParams = { ...this.state.newStorageClass.parameters };
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
          this.storageTypes[this.state.newStorageClass.type],
          ['parameters', key, 'validation'],
          null,
        );
        newParams[key].validationMsg = validation ? validation(newParams) : null;
      }
    });

    this.updateNewStorage('parameters', newParams, true);
  };

  setStorageHandler(param, value) {
    this.updateNewStorage(param, value, true);
  }

  updateNewStorage = (param: keyof Parameters, value, runValidation) => {
    const newParams = {
      ...this.state.newStorageClass,
      [param]: value,
    };

    runValidation
      ? this.setState({ newStorageClass: newParams }, this.validateForm)
      : this.setState({ newStorageClass: newParams });
  };

  addDefaultParams = () => {
    const defaultParams = this.storageTypes?.[this.state?.newStorageClass?.type]?.parameters ?? {};
    const hiddenParmas = {};
    _.each(defaultParams, (values, param) => {
      const isVisible = _.isFunction(values?.visible)
        ? values.visible(defaultParams)
        : values?.visible ?? true;
      if (!isVisible && values.value) {
        hiddenParmas[param] = values;
      }
    });
    const value = { ...this.state.newStorageClass.parameters, ...hiddenParmas };
    const newParams = {
      ...this.state.newStorageClass,
      parameters: value,
    };

    return newParams;
  };

  createStorageClass = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();

    this.setState({
      loading: true,
      error: null,
    });
    this.setState({ newStorageClass: this.addDefaultParams() }, () => {
      const {
        description,
        type,
        reclaim,
        expansion,
        volumeBindingMode,
      } = this.state.newStorageClass;
      const dataParameters = this.getFormParams();
      const annotations = description ? { description } : {};
      const data: StorageClass = {
        metadata: {
          name: this.state.newStorageClass.name,
          annotations,
        },
        provisioner: this.storageTypes[type].provisioner,
        parameters: dataParameters,
      };

      if (reclaim) {
        data.reclaimPolicy = reclaim;
      }

      if (volumeBindingMode) {
        data.volumeBindingMode = volumeBindingMode;
      }

      const allowVolumeExpansion = this?.storageTypes?.[type]?.allowVolumeExpansion;
      const shouldAllowVolumeExpansion = _.isFunction(allowVolumeExpansion)
        ? allowVolumeExpansion(this.state.newStorageClass.parameters)
        : allowVolumeExpansion;
      if (shouldAllowVolumeExpansion) {
        data.allowVolumeExpansion = expansion;
      }

      k8sCreate(StorageClassModel, data)
        .then((resource) => {
          this.setState({ loading: false });
          history.push(resourceObjPath(resource, referenceFor(resource)));
        })
        .catch((error) => this.setState({ loading: false, error }));
    });
  };

  getFormParams = () => {
    const type = this.state.newStorageClass.type;
    const dataParameters = _.pickBy(
      _.mapValues(this.state.newStorageClass.parameters, (value, key) => {
        let finalValue = value.value;
        if (this.storageTypes[type].parameters[key]?.format) {
          finalValue = this.storageTypes[type].parameters[key].format(value.value);
        }
        return finalValue;
      }),
      (value) => value !== '',
    );

    return _.merge(dataParameters, this.getCustomParams());
  };

  getCustomParams = () => {
    // Discard any row whose key is blank
    const customParams = _.reject(this.state.customParams, (t) =>
      _.isEmpty(t[NameValueEditorPair.Name]),
    );

    // Display error if duplicate keys are found
    const keys = customParams.map((t) => t[NameValueEditorPair.Name]);
    if (_.uniq(keys).length !== keys.length) {
      this.setState({ error: this.props.t('public~Duplicate keys found.') });
      return;
    }

    // Convert any blank values to null
    _.each(
      customParams,
      (t) =>
        (t[NameValueEditorPair.Value] = _.isEmpty(t[NameValueEditorPair.Value])
          ? null
          : t[NameValueEditorPair.Value]),
    );

    return _.fromPairs(customParams);
  };

  updateCustomParams = (customParams) => {
    this.setState({
      customParams: customParams.nameValuePairs,
    });
  };

  validateForm = () => {
    // Clear error messages from previous validation attempts first
    this.setState({ error: null, fieldErrors: {} }, () => {
      const fieldErrors = this.state.fieldErrors;
      let validationSuccessful = true;

      const nameValidation = this.validateName();
      if (!nameValidation.nameIsValid) {
        fieldErrors.nameValidationMsg = nameValidation.error;
        validationSuccessful = false;
      }

      if (this.state.newStorageClass.type === null) {
        validationSuccessful = false;
      } else if (!this.validateParameters()) {
        validationSuccessful = false;
      }

      if (!this.allRequiredFieldsFilled()) {
        validationSuccessful = false;
      }

      this.setState({ fieldErrors, validationSuccessful });
    });
  };

  validateName = () => {
    const updatedName = this.state.newStorageClass.name;
    const nameUpdated = updatedName !== this.previousName;
    const returnVal = {
      error: null,
      nameIsValid: true,
    };
    const { t } = this.props;

    if (nameUpdated) {
      if (updatedName.trim().length === 0) {
        returnVal.error = t('public~Storage name is required');
        returnVal.nameIsValid = false;
      } else if (this.resources) {
        _.each(this.resources.data, function(storageClass) {
          if (storageClass.metadata.name === updatedName.toLowerCase()) {
            returnVal.error = t('public~Storage name must be unique');
            returnVal.nameIsValid = false;
          }
        });
      }
      this.previousName = updatedName;
    }

    return returnVal;
  };

  validateParameters = () => {
    const params = this.state.newStorageClass.parameters;
    const allParamsValid = !_.some(params, ({ validationMsg }) => validationMsg !== null);
    return allParamsValid;
  };

  allRequiredFieldsFilled = () => {
    if (this.state.newStorageClass.name.trim().length === 0) {
      return false;
    }

    const { type: storageType, parameters: userEnteredParams } = this.state.newStorageClass;

    if (storageType === null) {
      return false;
    }

    const allParamsForType = this.storageTypes[storageType].parameters;

    const requiredKeys = _.keys(allParamsForType).filter((key) => this.paramIsRequired(key));
    const allReqdFieldsEntered = _.every(requiredKeys, (key) => {
      const value = _.get(userEnteredParams, [key, 'value']);
      return !_.isEmpty(value);
    });

    return allReqdFieldsEntered;
  };

  paramIsRequired = (paramKey, params = this.state.newStorageClass.parameters) => {
    const requiredParam = _.get(
      this.storageTypes[this.state.newStorageClass.type],
      ['parameters', paramKey, 'required'],
      null,
    );
    let isRequired = false;
    if (requiredParam) {
      isRequired = _.isFunction(requiredParam) ? requiredParam(params) : requiredParam;
    }

    return isRequired;
  };

  getProvisionerElements = () => {
    const parameters = this.storageTypes[this.state.newStorageClass.type]?.parameters;

    const dynamicContent = _.map(parameters, (parameter, key) => {
      const paramId = `storage-class-provisioner-${_.kebabCase(_.get(parameter, 'name', key))}`;
      const validationMsg = _.get(parameter, 'validationMsg', null);
      const isCheckbox = parameter.type === 'checkbox';
      const selectedKey = ['newStorageClass', 'parameters', key, 'value'];
      const visibilityProperty = parameter?.visible ?? true;
      const isVisible = _.isFunction(visibilityProperty)
        ? visibilityProperty(this.state.newStorageClass.parameters)
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
            parameterValue={this.state.newStorageClass.parameters[key]?.value || ''}
            onParamChange={this.setParameterHandler}
          />
        );
      }

      const children = parameter.values ? (
        <>
          <label
            className={classNames('control-label', { 'co-required': this.paramIsRequired(key) })}
            htmlFor={paramId}
          >
            {_.get(parameter, 'name', key)}
          </label>
          <Dropdown
            title={parameter.hintText}
            items={parameter.values}
            dropDownClassName="dropdown--full-width"
            selectedKey={_.get(this.state, selectedKey)}
            onChange={(event) => this.setParameterHandler(key, event, false)}
            id={paramId}
            dataTest={paramId}
          />
          <span className="help-block">{validationMsg ? validationMsg : null}</span>
        </>
      ) : (
        <>
          {isCheckbox ? (
            <>
              <div className="checkbox">
                <label>
                  <input
                    type="checkbox"
                    className="create-storage-class-form__checkbox"
                    onChange={(event) => this.setParameterHandler(key, event, isCheckbox)}
                    checked={_.get(this.state, selectedKey, false)}
                    id={`provisioner-settings-${key}-checkbox`}
                    data-test={paramId}
                  />
                  {_.get(parameter, 'name', key)}
                </label>
              </div>
            </>
          ) : (
            <>
              <label
                className={classNames('control-label', {
                  'co-required': this.paramIsRequired(key),
                })}
                htmlFor={paramId}
              >
                {_.get(parameter, 'name', key)}
              </label>
              <input
                type="text"
                className="pf-c-form-control"
                value={_.get(this.state, selectedKey, '')}
                onChange={(event) => this.setParameterHandler(key, event, isCheckbox)}
                id={paramId}
                data-test={paramId}
              />
            </>
          )}
          <span className="help-block">{validationMsg ? validationMsg : parameter.hintText}</span>
        </>
      );

      return (
        <div
          key={key}
          className={classNames('form-group', {
            'has-error': _.get(this.state.newStorageClass.parameters, `${key}.validationMsg`, null),
          })}
        >
          {children}
        </div>
      );
    });
    const { t } = this.props;
    const documentationLink = this.storageTypes[this.state.newStorageClass.type]?.documentationLink;
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
            nameValuePairs={this.state.customParams}
            nameString={t('public~Parameter')}
            nameParameter={t('public~parameter')}
            valueString={t('public~Value')}
            addString={t('public~Add Parameter')}
            updateParentData={this.updateCustomParams}
          />
        </div>
      </>
    );
  };

  autocompleteFilter = (text, item) => fuzzy(text, item);

  render() {
    const { t } = this.props;
    const { newStorageClass, fieldErrors } = this.state;
    const reclaimPolicyKey =
      newStorageClass.reclaim === null ? this.reclaimPolicies.Delete : newStorageClass.reclaim;
    const volumeBindingModeKey =
      newStorageClass.volumeBindingMode || this.volumeBindingModes.WaitForFirstConsumer;
    const allowVolumeExpansion = this?.storageTypes?.[newStorageClass.type]?.allowVolumeExpansion;
    const expansionFlag =
      newStorageClass.type &&
      (_.isFunction(allowVolumeExpansion)
        ? allowVolumeExpansion(this.state.newStorageClass.parameters)
        : allowVolumeExpansion);
    const allowExpansion = expansionFlag ? newStorageClass.expansion : false;

    return (
      <div className="co-m-pane__form">
        <PageHeading
          title={t('public~StorageClass')}
          link={
            <Link
              to="/k8s/cluster/storageclasses/~new"
              id="yaml-link"
              data-test="yaml-link"
              replace
            >
              {t('public~Edit YAML')}
            </Link>
          }
        />
        <div className="co-m-pane__body co-m-pane__body--no-top-margin">
          <form data-test-id="storage-class-form">
            <div
              className={classNames('form-group', { 'has-error': fieldErrors.nameValidationMsg })}
            >
              <label className="control-label co-required" htmlFor="storage-class-name">
                {t('public~Name')}
              </label>
              <input
                type="text"
                className="pf-c-form-control"
                placeholder={newStorageClass.name}
                id="storage-class-name"
                data-test="storage-class-name"
                onChange={(event) => this.setStorageHandler('name', event.target.value.trim())}
                value={_.get(newStorageClass, 'name', '')}
              />
              <span className="help-block">
                {fieldErrors.nameValidationMsg ? fieldErrors.nameValidationMsg : null}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="storage-class-description">{t('public~Description')}</label>
              <input
                type="text"
                className="pf-c-form-control"
                id="storage-class-description"
                data-test="storage-class-description"
                onChange={(event) => this.setStorageHandler('description', event.target.value)}
                value={_.get(newStorageClass, 'description', '')}
              />
            </div>

            <div className="form-group">
              <label className="co-required" htmlFor="storage-class-reclaim-policy">
                {t('public~Reclaim policy')}
              </label>
              <Dropdown
                title={t('public~Select reclaim policy')}
                items={this.reclaimPolicies}
                dropDownClassName="dropdown--full-width"
                selectedKey={reclaimPolicyKey}
                onChange={(event) => this.setStorageHandler('reclaim', event)}
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
              <Dropdown
                title={t('public~Select volume binding mode')}
                items={this.volumeBindingModes}
                dropDownClassName="dropdown--full-width"
                selectedKey={volumeBindingModeKey}
                onChange={(event) => this.setStorageHandler('volumeBindingMode', event)}
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
              <Dropdown
                title={t('public~Select Provisioner')}
                autocompleteFilter={this.autocompleteFilter}
                autocompletePlaceholder={'Select Provisioner'}
                items={_.mapValues(this.storageTypes, 'provisioner')}
                dropDownClassName="dropdown--full-width"
                menuClassName="dropdown-menu--text-wrap"
                selectedKey={_.get(this.state, 'newStorageClass.type')}
                onChange={(event) => this.setStorageHandler('type', event)}
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
              {newStorageClass.type !== null ? this.getProvisionerElements() : null}
            </div>

            {expansionFlag && (
              <div className="checkbox">
                <label>
                  <input
                    type="checkbox"
                    className="create-storage-class-form__checkbox"
                    onChange={(event) => this.setStorageHandler('expansion', event.target.checked)}
                    checked={allowExpansion}
                  />
                  {t('public~Allow PersistentVolumeClaims to be expanded')}
                </label>
              </div>
            )}

            <ButtonBar
              errorMessage={this.state.error ? this.state.error.message : ''}
              inProgress={this.state.loading}
            >
              <ActionGroup className="pf-c-form">
                <Button
                  id="save-changes"
                  isDisabled={!this.state.validationSuccessful}
                  onClick={this.createStorageClass}
                  type="submit"
                  variant="primary"
                >
                  {t('public~Create')}
                </Button>
                <Button
                  id="cancel"
                  onClick={() => history.push('/k8s/cluster/storageclasses')}
                  type="button"
                  variant="secondary"
                >
                  {t('public~Cancel')}
                </Button>
              </ActionGroup>
            </ButtonBar>
          </form>
        </div>
      </div>
    );
  }
}

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

type WithTranslation = {
  t: TFunction;
  i18n: i18n;
  tReady: boolean;
};

export type StorageClassFormProps = WithTranslation &
  StateProps &
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
)(
  withTranslation()<StateProps & DispatchProps & WithTranslation>((props) => {
    const extensions = useResolvedExtensions<StorageClassProvisioner>(isStorageClassProvisioner);
    return <StorageClassFormWithTranslation extensions={extensions} {...props} />;
  }),
);

export const StorageClassForm = (props) => {
  const resources = [
    { kind: StorageClassModel.kind, isList: true, prop: 'sc' },
    { kind: referenceForModel(CSIDriverModel), isList: true, prop: 'csi' },
  ];
  return (
    <Firehose resources={resources}>
      <ConnectedStorageClassForm {...props} />
    </Firehose>
  );
};

ConnectedStorageClassForm.displayName = 'StorageClassForm';

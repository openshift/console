import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash-es';
import { ActionGroup, Button } from '@patternfly/react-core';
import { getName } from '@console/shared';
import {
  StorageClassProvisioner,
  isStorageClassProvisioner,
  ExtensionSCProvisionerProp,
} from '@console/plugin-sdk/src/typings/storage-class-params';

import {
  AsyncComponent,
  ButtonBar,
  Dropdown,
  ExternalLink,
  Firehose,
  FirehoseResult,
  NameValueEditorPair,
  history,
  resourceObjPath,
} from './utils';
import { k8sCreate, K8sResourceKind, referenceForModel, referenceFor } from './../module/k8s';
import * as k8sActions from '../actions/k8s';
import { CSIDriverModel, StorageClassModel } from './../models';
import { withExtensions } from '../plugins';

enum Provisioner {
  CSI = 'csi',
  OTHERS = 'others',
}

const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() => import('./utils/name-value-editor').then((c) => c.NameValueEditor)}
    {...props}
  />
);

const defaultState = {
  newStorageClass: {
    name: '',
    description: '',
    type: null,
    parameters: {},
    reclaim: null,
    expansion: false,
  },
  customParams: [['', '']],
  validationSuccessful: false,
  loading: false,
  error: null,
  fieldErrors: { parameters: {} },
};

export class StorageClassForm_ extends React.Component<
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

  defaultProvisionerObj = {
    title: '',
    provisioner: '',
    parameters: {},
    allowVolumeExpansion: false,
  };

  storageTypes = {};

  // Fetch Storage type provisioners from different operators
  // For CSI - provisionerType: 'csi'
  // For Defaults - provisionerType: 'others'
  getExtensionsStorageClassProvisioners = (provisionerType = Provisioner.OTHERS) => {
    const extensionCSIProvisioners: ExtensionSCProvisionerProp = _.reduce(
      this.props.params,
      (res, value) => {
        const obj = value.properties.getStorageClassProvisioner || {};
        if (obj) {
          const key = provisionerType;
          const keyValue = obj[provisionerType];
          res[key] = keyValue;
        }
        return res;
      },
      {},
    );

    return extensionCSIProvisioners[provisionerType];
  };

  // For 'csi' storage type
  CSIStorageTypes = Object.freeze({
    ...this.getExtensionsStorageClassProvisioners(Provisioner.CSI),
  });

  // For 'other' storage type
  defaultStorageTypes = Object.freeze({
    ...this.getExtensionsStorageClassProvisioners(Provisioner.OTHERS), // Plugin provisoners
    local: {
      title: 'Local',
      provisioner: 'kubernetes.io/no-provisioner',
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#local',
      parameters: {},
      volumeBindingMode: 'WaitForFirstConsumer',
    },
    aws: {
      title: 'AWS Elastic Block Storage',
      provisioner: 'kubernetes.io/aws-ebs',
      allowVolumeExpansion: true,
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#aws-ebs',
      parameters: {
        type: {
          name: 'Type',
          values: { io1: 'io1', gp2: 'gp2', sc1: 'sc1', st1: 'st1' },
          hintText: 'Select AWS Type',
        },
        iopsPerGB: {
          name: 'IOPS Per GiB',
          hintText: 'I/O operations per second per GiB',
          validation: (params) => {
            if (params.iopsPerGB.value !== '' && !params.iopsPerGB.value.match(/^[1-9]\d*$/)) {
              return 'IOPS per GiB must be a number';
            }
            return null;
          },
          visible: (params) => _.get(params, 'type.value') === 'io1',
        },
        fsType: {
          name: 'Filesystem Type',
          hintText: 'Filesystem to Be Laid Out',
        },
        encrypted: {
          name: 'Encrypted',
          type: 'checkbox',
          format: (value) => value.toString(),
        },
        kmsKeyId: {
          name: 'KMS Key ID',
          hintText: 'The full Amazon Resource Name of the key to use when encrypting the volume',
          visible: (params) => _.get(params, 'encrypted.value', false),
        },
      },
    },
    'gce-pd': {
      title: 'GCE PD',
      provisioner: 'kubernetes.io/gce-pd',
      allowVolumeExpansion: true,
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#gce',
      parameters: {
        type: {
          name: 'Type',
          values: { 'pd-standard': 'pd-standard', 'pd-ssd': 'pd-ssd' },
          hintText: 'Select GCE type',
        },
        zone: {
          name: 'Zone',
          validation: (params) => {
            if (params.zone.value !== '' && _.get(params, 'zones.value', '') !== '') {
              return 'Zone and zones parameters must not be used at the same time';
            }
            return null;
          },
        },
        zones: {
          name: 'Zones',
          validation: (params) => {
            if (params.zones.value !== '' && _.get(params, 'zone.value', '') !== '') {
              return 'Zone and zones parameters must not be used at the same time';
            }
            return null;
          },
        },
        'replication-type': {
          name: 'Replication Type',
          values: { none: 'none', 'regional-pd': 'regional-pd' },
          hintText: 'Select Replication Type',
          validation: (params) => {
            if (
              params['replication-type'].value === 'regional-pd' &&
              _.get(params, 'zone.value', '') !== ''
            ) {
              return 'Zone cannot be specified when Replication Type regional-pd is chosen, use zones instead';
            }
            return null;
          },
        },
      },
    },
    glusterfs: {
      title: 'Glusterfs',
      provisioner: 'kubernetes.io/glusterfs',
      allowVolumeExpansion: true,
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#glusterfs',
      parameters: {
        resturl: {
          name: 'Gluster REST/Heketi URL',
          required: true,
        },
        restuser: {
          name: 'Gluster REST/Heketi user',
        },
        secretNamespace: {
          name: 'Secret Namespace',
        },
        secretName: {
          name: 'Secret Name',
        },
        clusterid: {
          name: 'Cluster ID',
        },
        gidMin: {
          name: 'GID Min',
          validation: (params) => {
            if (params.gidMin.value !== '' && !params.gidMin.value.match(/^[1-9]\d*$/)) {
              return 'GID Min must be number';
            }
            return null;
          },
        },
        gidMax: {
          name: 'GID Max',
          validation: (params) => {
            if (params.gidMax.value !== '' && !params.gidMax.value.match(/^[1-9]\d*$/)) {
              return 'GID Max must be number';
            }
            return null;
          },
        },
        volumetype: {
          name: 'Volume Type',
        },
      },
    },
    openstackCinder: {
      title: 'OpenStack Cinder',
      provisioner: 'kubernetes.io/cinder',
      allowVolumeExpansion: true,
      documentationLink:
        'https://kubernetes.io/docs/concepts/storage/storage-classes/#openstack-cinder',
      parameters: {
        type: {
          name: 'Volume Type',
        },
        availability: {
          name: 'Availability Zone',
        },
      },
    },
    azureFile: {
      title: 'Azure File',
      provisioner: 'kubernetes.io/azure-file',
      allowVolumeExpansion: true,
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#azure-file',
      parameters: {
        skuName: {
          name: 'SKU Name',
          hintText: 'Azure storage account SKU tier',
        },
        location: {
          name: 'Location',
          hintText: 'Azure storage account location',
        },
        storageAccount: {
          name: 'Azure Storage Account Name',
          hintText: 'Azure Storage Account Name',
        },
      },
    },
    azureDisk: {
      title: 'Azure Disk',
      provisioner: 'kubernetes.io/azure-disk',
      allowVolumeExpansion: true,
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#azure-disk',
      parameters: {
        storageaccounttype: {
          name: 'Storage Account Type',
          hintText: 'Storage Account Type',
        },
        kind: {
          name: 'Account Kind',
          values: { shared: 'shared', dedicated: 'dedicated', managed: 'managed' },
          hintText: 'Select Account Kind',
        },
      },
    },
    quobyte: {
      title: 'Quobyte',
      provisioner: 'kubernetes.io/quobyte',
      allowVolumeExpansion: false,
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#quobyte',
      parameters: {
        quobyteAPIServer: {
          name: 'Quobyte API Server',
          hintText: 'Quobyte API Server',
        },
        registry: {
          name: 'Registry Address(es)',
          hintText: 'Registry Address(es)',
        },
        adminSecretName: {
          name: 'Admin Secret Name',
          hintText: 'Admin Secret Name',
        },
        adminSecretNamespace: {
          name: 'Admin Secret Namespace',
          hintText: 'Admin Secret Namespace',
        },
        user: {
          name: 'User',
          hintText: 'User',
        },
        group: {
          name: 'Group',
          hintText: 'Group',
        },
        quobyteConfig: {
          name: 'Quobyte Configuration',
          hintText: 'Quobyte Configuration',
        },
        quobyteTenant: {
          name: 'Quobyte Tenant',
          hintText: 'Quobyte tenant ID used to create/delete the volume',
        },
      },
    },
    vSphereVolume: {
      title: 'vSphere Volume',
      provisioner: 'kubernetes.io/vsphere-volume',
      allowVolumeExpansion: false,
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#vsphere',
      parameters: {
        diskformat: {
          name: 'Disk Format',
          values: {
            thin: 'thin',
            zeroedthick: 'zeroed thick',
            eagerzeroedthick: 'eager zeroed thick',
          },
          hintText: 'Select Disk Format',
        },
        datastore: {
          name: 'Datastore',
          hintText: 'Datastore',
        },
      },
    },
    portworxVolume: {
      title: 'Portworx Volume',
      provisioner: 'kubernetes.io/portworx-volume',
      allowVolumeExpansion: true,
      documentationLink:
        'https://kubernetes.io/docs/concepts/storage/storage-classes/#portworx-volume',
      parameters: {
        fs: {
          name: 'Filesystem',
          values: { none: 'none', xfs: 'xfs', ext4: 'ext4' },
          hintText: 'Select Filesystem',
        },
        // eslint-disable-next-line camelcase
        block_size: {
          name: 'Block Size',
          hintText: 'Block size in Kb',
          validation: (params) => {
            if (params.block_size.value !== '' && !params.block_size.value.match(/^[1-9]\d*$/)) {
              return 'Snapshot interval must be a number';
            }
            return null;
          },
        },
        repl: {
          name: 'Number of synchronous replicas to be provided in the form of replication factor',
          hintText: 'Number of Replicas',
          validation: (params) => {
            if (params.repl.value !== '' && !params.repl.value.match(/^[1-9]\d*$/)) {
              return 'Number of replicas must be a number';
            }
            return null;
          },
        },
        // eslint-disable-next-line camelcase
        io_priority: {
          name: 'I/O Priority',
          values: { high: 'high', medium: 'medium', low: 'low' },
          hintText: 'I/O Priority',
        },
        // eslint-disable-next-line camelcase
        snap_interval: {
          name: 'Snapshot Interval',
          hintText: 'Clock/time interval in minutes for when to trigger snapshots',
          validation: (params) => {
            if (params.repl.value !== '' && !params.repl.value.match(/^[1-9]\d*$/)) {
              return 'Snapshot interval must be a number';
            }
            return null;
          },
          format: (value) => value.toString(),
        },
        // eslint-disable-next-line camelcase
        aggregation_level: {
          name: 'Aggregation Level',
          hintText: 'The number of chunks the volume would be distributed into',
          validation: (params) => {
            if (
              params.aggregation_level.value !== '' &&
              !params.aggregation_level.value.match(/^[1-9]\d*$/)
            ) {
              return 'Aggregation level must be a number';
            }
            return null;
          },
          format: (value) => value.toString(),
        },
        ephemeral: {
          name: 'Ephemeral',
          type: 'checkbox',
          format: (value) => value.toString(),
        },
      },
    },
    scaleIo: {
      title: 'ScaleIO',
      provisioner: 'kubernetes.io/scaleio',
      allowVolumeExpansion: false,
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#scaleio',
      parameters: {
        gateway: {
          name: 'API Gateway',
          required: true,
          hintText: 'ScaleIO API gateway address',
        },
        system: {
          name: 'System Name',
          required: true,
          hintText: 'Name of the ScaleIO system',
        },
        protectionDomain: {
          name: 'Protection Domain',
          required: true,
          hintText: 'Name of the ScaleIO protection domain',
        },
        storagePool: {
          name: 'Storage Pool',
          required: true,
          hintText: 'Name of the volume storage pool',
        },
        storageMode: {
          name: 'Storage Mode',
          values: { thinProvisioned: 'ThinProvisioned', thickProvisioned: 'ThickProvisioned' },
          hintText: 'Select Storage Provision Mode',
        },
        secretRef: {
          name: 'Secret Reference',
          required: true,
          hintText: 'Reference to a configured Secret object',
        },
        readOnly: {
          name: 'Read Only',
          type: 'checkbox',
        },
        fsType: {
          name: 'Filesystem Type',
          hintText: 'Filesystem to use for the volume',
        },
      },
    },
    storageOs: {
      title: 'StorageOS',
      provisioner: 'kubernetes.io/storageos',
      allowVolumeExpansion: false,
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#storageos',
      parameters: {
        pool: {
          name: 'Pool',
          hintText:
            'Name of the StorageOS distributed capacity pool from which to provision the volume',
        },
        description: {
          name: 'Description',
          hintText: 'Description to assign to volumes that were created dynamically',
        },
        fsType: {
          name: 'Filesystem Type',
          hintText: 'Default filesystem type to request',
        },
        adminSecretName: {
          name: 'Admin Secret Name',
          hintText: 'Name of the secret to use for obtaining the StorageOS API credentials',
        },
        adminSecretNamespace: {
          name: 'Admin Secret Namespace',
          hintText: 'Namespace where the API configuration secret is located',
          required: (params) => {
            const adminSecretName = _.get(params, 'adminSecretName.value', null);
            return adminSecretName !== null && adminSecretName !== '';
          },
        },
      },
    },
  });

  reclaimPolicies = {
    Retain: 'Retain',
    Delete: 'Delete',
  };

  // Accepts a list of CSI provisioners and it checks if the
  // provisioner is listed in CSIStorageTypes object
  // if yes then return the provisioner with parameters that
  // needs to be filled by user.
  csiProvisionerMap = (csiData) => {
    const csiListedProvisioner: string[] = _.keys(this.CSIStorageTypes);
    csiData.map((csi) => {
      _.each(csiListedProvisioner, (provisioner) => {
        const hasProvisioner = getName(csi).includes(provisioner);
        if (hasProvisioner) {
          const provisionerData = _.cloneDeep(this.CSIStorageTypes[provisioner]);
          provisionerData.provisioner = getName(csi);
          this.storageTypes[getName(csi)] = provisionerData;
          return false;
        }
        const provisionerData = _.cloneDeep(this.defaultProvisionerObj);
        provisionerData.title = getName(csi);
        provisionerData.provisioner = getName(csi);
        this.storageTypes[getName(csi)] = provisionerData;
      });
    });
  };

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      const { resources } = this.props;
      const loaded = _.get(resources.sc, 'loaded');
      const csiLoaded = _.get(resources.csi, 'loaded');
      const scData = _.get(resources.sc, 'data', []) as K8sResourceKind[];
      const csiData = _.get(resources.csi, 'data', []) as K8sResourceKind[];
      if (loaded) {
        this.resources = {
          data: scData,
          loadError: _.get(resources.sc, 'loadError'),
          loaded,
        };
        this.validateForm();
      }
      if (csiLoaded) {
        this.csiProvisionerMap(csiData);
      }
    }
  }

  componentDidMount() {
    this.storageTypes = _.cloneDeep(this.defaultStorageTypes);
  }

  setParameterHandler = (param, event, checkbox) => {
    const newParams = { ...this.state.newStorageClass.parameters };
    if (checkbox) {
      newParams[param] = { value: event.target.checked };
    } else {
      if (event.target) {
        newParams[param] = { value: event.target.value };
      } else {
        newParams[param] = { value: event };
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

  updateNewStorage = (param, value, runValidation) => {
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
      if (values.visible && !values.visible() && values.value) {
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
      const { description, type, reclaim, expansion } = this.state.newStorageClass;
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

      const volumeBindingMode = this.storageTypes[type]?.volumeBindingMode;
      if (volumeBindingMode) {
        data.volumeBindingMode = volumeBindingMode;
      }

      if (this.storageTypes[type].allowVolumeExpansion) {
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
        if (this.storageTypes[type].parameters[key].format) {
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
      this.setState({ error: 'Duplicate keys found.' });
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

    if (nameUpdated) {
      if (updatedName.trim().length === 0) {
        returnVal.error = 'Storage name is required';
        returnVal.nameIsValid = false;
      } else if (this.resources) {
        _.each(this.resources.data, function(storageClass) {
          if (storageClass.metadata.name === updatedName.toLowerCase()) {
            returnVal.error = 'Storage name must be unique';
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
    const parameters = this.storageTypes[this.state.newStorageClass.type].parameters;

    if (_.isEmpty(parameters)) {
      return null;
    }

    const dynamicContent = _.map(parameters, (parameter, key) => {
      const paramId = `storage-class-provisioner-${_.kebabCase(_.get(parameter, 'name', key))}`;
      const validationMsg = _.get(parameter, 'validationMsg', null);
      const isCheckbox = parameter.type === 'checkbox';
      const selectedKey = ['newStorageClass', 'parameters', key, 'value'];

      if (parameter.visible && !parameter.visible(this.state.newStorageClass.parameters)) {
        return null;
      }

      if (parameter.Component) {
        const { Component } = parameter;
        return (
          <Component
            key={key}
            onParamChange={(value: string) => this.setParameterHandler(key, value, false)}
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

    return (
      <>
        {dynamicContent}

        {this.storageTypes[this.state.newStorageClass.type].documentationLink && (
          <div className="form-group">
            <label>Additional Parameters</label>
            <p>
              Specific fields for the selected provisioner. &nbsp;
              <ExternalLink
                href={this.storageTypes[this.state.newStorageClass.type].documentationLink}
                text="What should I enter here?"
              />
            </p>
            <NameValueEditorComponent
              nameValuePairs={this.state.customParams}
              nameString="Parameter"
              valueString="Value"
              addString="Add Parameter"
              updateParentData={this.updateCustomParams}
            />
          </div>
        )}
      </>
    );
  };

  autocompleteFilter = (text, item) => fuzzy(text, item);

  render() {
    const { newStorageClass, fieldErrors } = this.state;
    const reclaimPolicyKey =
      newStorageClass.reclaim === null ? this.reclaimPolicies.Delete : newStorageClass.reclaim;
    const expansionFlag =
      newStorageClass.type && this.storageTypes[newStorageClass.type].allowVolumeExpansion;
    const allowExpansion = expansionFlag ? newStorageClass.expansion : false;

    return (
      <div className="co-m-pane__body co-m-pane__form">
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">Create Storage Class</div>
          <div className="co-m-pane__heading-link">
            <Link
              to="/k8s/cluster/storageclasses/~new"
              id="yaml-link"
              data-test="yaml-link"
              replace
            >
              Edit YAML
            </Link>
          </div>
        </h1>
        <form data-test-id="storage-class-form">
          <div className={classNames('form-group', { 'has-error': fieldErrors.nameValidationMsg })}>
            <label className="control-label co-required" htmlFor="storage-class-name">
              Name
            </label>
            <input
              type="text"
              className="pf-c-form-control"
              placeholder={newStorageClass.name}
              id="storage-class-name"
              onChange={(event) => this.setStorageHandler('name', event.target.value)}
              value={_.get(newStorageClass, 'name', '')}
            />
            <span className="help-block">
              {fieldErrors.nameValidationMsg ? fieldErrors.nameValidationMsg : null}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="storage-class-description">Description</label>
            <input
              type="text"
              className="pf-c-form-control"
              id="storage-class-description"
              onChange={(event) => this.setStorageHandler('description', event.target.value)}
              value={_.get(newStorageClass, 'description', '')}
            />
          </div>

          <div className="form-group">
            <label className="co-required" htmlFor="storage-class-reclaim-policy">
              Reclaim Policy
            </label>
            <Dropdown
              title="Select Reclaim Policy"
              items={this.reclaimPolicies}
              dropDownClassName="dropdown--full-width"
              selectedKey={reclaimPolicyKey}
              onChange={(event) => this.setStorageHandler('reclaim', event)}
              id="storage-class-reclaim-policy"
            />
            <span className="help-block">
              Determines what happens to persistent volumes when the associated persistent volume
              claim is deleted. Defaults to &lsquo;Delete&rsquo;
            </span>
          </div>

          <div className="form-group">
            <label className="co-required" htmlFor="storage-class-provisioner">
              Provisioner
            </label>
            <Dropdown
              title="Select Provisioner"
              autocompleteFilter={this.autocompleteFilter}
              autocompletePlaceholder={'Select Provisioner'}
              items={_.mapValues(this.storageTypes, 'provisioner')}
              dropDownClassName="dropdown--full-width"
              menuClassName="dropdown-menu--text-wrap"
              selectedKey={_.get(this.state, 'newStorageClass.type')}
              onChange={(event) => this.setStorageHandler('type', event)}
              id="storage-class-provisioner"
            />
            <span className="help-block">
              Determines what volume plugin is used for provisioning persistent volumes.
            </span>
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
                Allow persistent volume claims to be expanded
              </label>
            </div>
          )}

          <div className="co-form-subsection">
            {newStorageClass.type !== null ? this.getProvisionerElements() : null}
          </div>

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
                Create
              </Button>
              <Button
                id="cancel"
                onClick={() => history.push('/k8s/cluster/storageclasses')}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    );
  }
}

const mapStateToProps = ({ k8s }, { onClose }) => ({
  k8s,
  onClose,
});

const mapDispatchToProps = () => ({
  stopK8sWatch: k8sActions.stopK8sWatch,
  watchK8sList: k8sActions.watchK8sList,
});

export type StorageClassFormProps = StorageClassFormExtensionProps & {
  onClose: () => void;
  watchK8sList: (id: string, query: object, kind: object) => void;
  stopK8sWatch: (id: string) => void;
  k8s: any;
  resources?: {
    [key: string]: FirehoseResult;
  };
};

export type StorageClassData = {
  name: string;
  type: string;
  description: string;
  parameters: any;
  reclaim: string;
  expansion: boolean;
};

export type StorageClass = {
  metadata: object;
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
  withExtensions<StorageClassFormExtensionProps>({ params: isStorageClassProvisioner })(
    StorageClassForm_,
  ),
);

export type StorageClassFormExtensionProps = {
  params: StorageClassProvisioner[];
};

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

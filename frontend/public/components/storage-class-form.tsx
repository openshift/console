import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash-es';
import { ActionGroup, Button } from '@patternfly/react-core';
import { withTranslation } from 'react-i18next';
import { getName } from '@console/shared';
import { Extension, withExtensions } from '@console/plugin-sdk';
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
import { i18n, TFunction } from 'i18next';

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
    expansion: true,
  },
  customParams: [['', '']],
  validationSuccessful: false,
  loading: false,
  error: null,
  fieldErrors: { parameters: {} },
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

  defaultProvisionerObj = {
    title: '',
    provisioner: '',
    parameters: {},
    allowVolumeExpansion: true,
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
    'ebs.csi.aws.com': {
      title: 'AWS CSI', // t('public~AWS CSI')
      provisioner: 'ebs.csi.aws.com',
      allowVolumeExpansion: true,
      parameters: {
        type: {
          name: 'Type', // t('public~Type')
          values: { gp2: 'gp2', io1: 'io1', sc1: 'sc1', st1: 'st1', standard: 'standard' },
          hintText: 'Select AWS Type. Default is gp2',
        },
        iopsPerGB: {
          name: 'IOPS per GiB', // t('public~IOPS per GiB')
          hintText: 'I/O operations per second per GiB', // t('public~I/O operations per second per GiB')
          validation: (params) => {
            if (params.iopsPerGB.value && !params.iopsPerGB.value.match(/^\d+$/)) {
              return 'IOPS per GiB must be a number'; // t('public~IOPS per GiB must be a number')
            }
            return null;
          },
          visible: (params) => _.get(params, 'type.value') === 'io1',
        },
        fsType: {
          name: 'Filesystem Type', // t('public~Filesystem Type')
          hintText: 'Filesystem type to use during volume creation. Default is ext4.', // t('public~Filesystem type to use during volume creation. Default is ext4.')
          values: { ext4: 'ext4', xfs: 'xfs', ext2: 'ext2', ext3: 'ext3' },
        },
        encrypted: {
          name: 'Encrypted', // t('public~Encrypted')
          type: 'checkbox',
          format: (value) => value.toString(),
        },
        kmsKeyId: {
          name: 'KMS key ID', // t('public~KMS key ID')
          hintText: 'The full Amazon resource name of the key to use when encrypting the volume', // t('public~The full Amazon resource name of the key to use when encrypting the volume')
          visible: (params) => _.get(params, 'encrypted.value', false),
        },
      },
    },
  });

  // For 'other' storage type
  defaultStorageTypes = Object.freeze({
    ...this.getExtensionsStorageClassProvisioners(Provisioner.OTHERS), // Plugin provisoners
    local: {
      title: 'Local', // t('public~Local')
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
          name: 'Type', // t('public~Type')
          values: { io1: 'io1', gp2: 'gp2', sc1: 'sc1', st1: 'st1' },
          hintText: 'Select AWS Type',
        },
        iopsPerGB: {
          name: 'IOPS per GiB', // t('public~IOPS per GiB')
          hintText: 'I/O operations per second per GiB', // t('public~I/O operations per second per GiB')
          validation: (params) => {
            if (params.iopsPerGB.value && !params.iopsPerGB.value.match(/^\d+$/)) {
              return 'IOPS per GiB must be a number'; // t('public~IOPS per GiB must be a number')
            }
            return null;
          },
          visible: (params) => _.get(params, 'type.value') === 'io1',
        },
        fsType: {
          name: 'Filesystem type', // t('public~Filesystem type')
          hintText: 'Filesystem type to use during volume creation. Default is ext4.', // t('public~Filesystem type to use during volume creation. Default is ext4.')
        },
        encrypted: {
          name: 'Encrypted', // t('public~Encrypted')
          type: 'checkbox',
          format: (value) => value.toString(),
        },
        kmsKeyId: {
          name: 'KMS key ID', // t('public~KMS key ID')
          hintText: 'The full Amazon resource name of the key to use when encrypting the volume', // t('public~The full Amazon resource name of the key to use when encrypting the volume')
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
          name: 'Type', // t('public~Type')
          values: { 'pd-standard': 'pd-standard', 'pd-ssd': 'pd-ssd' },
          hintText: 'Select GCE type',
        },
        zone: {
          name: 'Zone', // t('public~Zone')
          validation: (params) => {
            if (params.zone.value !== '' && _.get(params, 'zones.value', '') !== '') {
              return 'Zone and zones parameters must not be used at the same time'; // t('public~Zone and zones parameters must not be used at the same time')
            }
            return null;
          },
        },
        zones: {
          name: 'Zones', // t('public~Zones')
          validation: (params) => {
            if (params.zones.value !== '' && _.get(params, 'zone.value', '') !== '') {
              return 'Zone and zones parameters must not be used at the same time'; // t('public~Zone and zones parameters must not be used at the same time')
            }
            return null;
          },
        },
        'replication-type': {
          name: 'Replication type', // t('public~Replication type')
          values: { none: 'none', 'regional-pd': 'regional-pd' },
          hintText: 'Select Replication type',
          validation: (params) => {
            if (
              params['replication-type'].value === 'regional-pd' &&
              _.get(params, 'zone.value', '') !== ''
            ) {
              return 'Zone cannot be specified when replication type regional-pd is chosen.Use zones instead.'; // t('public~Zone cannot be specified when replication type regional-pd is chosen.Use zones instead.')
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
          name: 'Gluster REST/Heketi URL', // t('public~Gluster REST/Heketi URL')
          required: true,
        },
        restuser: {
          name: 'Gluster REST/Heketi user', // t('public~Gluster REST/Heketi user')
        },
        secretNamespace: {
          name: 'Secret Namespace', // t('public~Secret Namespace')
        },
        secretName: {
          name: 'Secret name', // t('public~Secret name')
        },
        clusterid: {
          name: 'Cluster ID', // t('public~Cluster ID')
        },
        gidMin: {
          name: 'GID min', // t('public~GID min')
          validation: (params) => {
            if (params.gidMin.value !== '' && !params.gidMin.value.match(/^[1-9]\d*$/)) {
              return 'GID min must be number'; // t('public~GID min must be number')
            }
            return null;
          },
        },
        gidMax: {
          name: 'GID max', // t('public~GID max')
          validation: (params) => {
            if (params.gidMax.value !== '' && !params.gidMax.value.match(/^[1-9]\d*$/)) {
              return 'GID max must be number'; // t('public~GID max must be number')
            }
            return null;
          },
        },
        volumetype: {
          name: 'Volume type', // t('public~Volume type')
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
          name: 'Volume type', // t('public~Volume type')
        },
        availability: {
          name: 'Availability zone', // t('public~Availability zone')
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
          name: 'SKU name', // t('public~SKU name')
          hintText: 'Azure storage account SKU tier', // t('public~Azure storage account SKU tier')
        },
        location: {
          name: 'Location', // t('public~Location')
          hintText: 'Azure storage account location', // t('public~Azure storage account location')
        },
        storageAccount: {
          name: 'Azure storage account name', // t('public~Azure storage account name')
          hintText: 'Azure storage account name', // t('public~Azure storage account name')
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
          name: 'Storage account type', // t('public~Storage account type')
          hintText: 'Storage account type', // t('public~Storage account type')
        },
        kind: {
          name: 'Account kind', // t('public~Account kind')
          values: { shared: 'shared', dedicated: 'dedicated', managed: 'managed' },
          hintText: 'Select account kind',
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
          name: 'Quobyte API server', // t('public~Quobyte API server')
          hintText: 'Quobyte API server', // t('public~Quobyte API server')
        },
        registry: {
          name: 'Registry address(es)', // t('public~Registry address(es)')
          hintText: 'Registry address(es)', // t('public~Registry address(es)')
        },
        adminSecretName: {
          name: 'Admin secret name', // t('public~Admin secret name')
          hintText: 'Admin secret name', // t('public~Admin secret name')
        },
        adminSecretNamespace: {
          name: 'Admin secret namespace', // t('public~Admin secret namespace')
          hintText: 'Admin secret namespace', // t('public~Admin secret namespace')
        },
        user: {
          name: 'User', // t('public~User')
          hintText: 'User', // t('public~User')
        },
        group: {
          name: 'Group', // t('public~Group')
          hintText: 'Group', // t('public~Group')
        },
        quobyteConfig: {
          name: 'Quobyte configuration', // t('public~Quobyte configuration')
          hintText: 'Quobyte configuration', // t('public~Quobyte configuration')
        },
        quobyteTenant: {
          name: 'Quobyte tenant', // t('public~Quobyte tenant')
          hintText: 'Quobyte tenant ID used to create/delete the volume', // t('public~Quobyte tenant ID used to create/delete the volume')
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
          name: 'Disk format', // t('public~Disk format')
          values: {
            thin: 'thin',
            zeroedthick: 'zeroed thick',
            eagerzeroedthick: 'eager zeroed thick',
          },
          hintText: 'Select disk format',
        },
        datastore: {
          name: 'Datastore', // t('public~Datastore')
          hintText: 'Datastore', // t('public~Datastore')
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
          name: 'Filesystem', // t('public~Filesystem')
          values: { none: 'none', xfs: 'xfs', ext4: 'ext4' },
          hintText: 'Select Filesystem',
        },
        // eslint-disable-next-line camelcase
        block_size: {
          name: 'Block size', // t('public~Block size')
          hintText: 'Block size in Kb', // t('public~Block Size in Kb')
          validation: (params) => {
            if (params.block_size.value !== '' && !params.block_size.value.match(/^[1-9]\d*$/)) {
              return 'Snapshot interval must be a number'; // t('public~Snapshot interval must be a number')
            }
            return null;
          },
        },
        repl: {
          name: 'Number of synchronous replicas to be provided in the form of replication factor', // t('public~Number of synchronous replicas to be provided in the form of replication factor')
          hintText: 'Number of replicas', // t('public~Number of replicas')
          validation: (params) => {
            if (params.repl.value !== '' && !params.repl.value.match(/^[1-9]\d*$/)) {
              return 'Number of replicas must be a number'; // t('public~Number of replicas must be a number')
            }
            return null;
          },
        },
        // eslint-disable-next-line camelcase
        io_priority: {
          name: 'I/O priority', // t('public~I/O priority')
          values: { high: 'high', medium: 'medium', low: 'low' },
          hintText: 'I/O priority',
        },
        // eslint-disable-next-line camelcase
        snap_interval: {
          name: 'Snapshot interval', // t('public~Snapshot interval')
          hintText: 'Clock/time interval in minutes for when to trigger snapshots', // t('public~Clock/time interval in minutes for when to trigger snapshots')
          validation: (params) => {
            if (params.repl.value !== '' && !params.repl.value.match(/^[1-9]\d*$/)) {
              return 'Snapshot interval must be a number'; // t('public~Snapshot interval must be a number')
            }
            return null;
          },
          format: (value) => value.toString(),
        },
        // eslint-disable-next-line camelcase
        aggregation_level: {
          name: 'Aggregation level', // t('public~Aggregation level')
          hintText: 'The number of chunks the volume would be distributed into', // t('public~The number of chunks the volume would be distributed into')
          validation: (params) => {
            if (
              params.aggregation_level.value !== '' &&
              !params.aggregation_level.value.match(/^[1-9]\d*$/)
            ) {
              return 'Aggregation level must be a number'; // t('public~Aggregation level must be a number')
            }
            return null;
          },
          format: (value) => value.toString(),
        },
        ephemeral: {
          name: 'Ephemeral', // t('public~Ephemeral')
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
          name: 'API gateway', // t('public~API gateway')
          required: true,
          hintText: 'ScaleIO API gateway address', // t('public~ScaleIO API gateway address')
        },
        system: {
          name: 'System name', // t('public~System name')
          required: true,
          hintText: 'Name of the ScaleIO system', // t('public~Name of the ScaleIO system')
        },
        protectionDomain: {
          name: 'Protection domain', // t('public~Protection domain')
          required: true,
          hintText: 'Name of the ScaleIO protection domain', // t('public~Name of the ScaleIO protection domain')
        },
        storagePool: {
          name: 'Storage pool', // t('public~Storage pool')
          required: true,
          hintText: 'Name of the volume storage pool', // t('public~Name of the volume storage pool')
        },
        storageMode: {
          name: 'Storage mode', // t('public~Storage mode')
          values: { thinProvisioned: 'ThinProvisioned', thickProvisioned: 'ThickProvisioned' },
          hintText: 'Select storage provision mode',
        },
        secretRef: {
          name: 'Secret reference', // t('public~Secret reference')
          required: true,
          hintText: 'Reference to a configured Secret object', // t('public~Reference to a configured Secret object')
        },
        readOnly: {
          name: 'Read Only', // t('public~Read Only')
          type: 'checkbox',
        },
        fsType: {
          name: 'Filesystem Type', // t('public~Filesystem Type')
          hintText: 'Filesystem to use for the volume', // t('public~Filesystem to use for the volume')
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
          name: 'Pool', // t('public~Pool')
          hintText:
            'Name of the StorageOS distributed capacity pool from which to provision the volume', // t('public~Name of the StorageOS distributed capacity pool from which to provision the volume')
        },
        description: {
          name: 'Description', // t('public~Description')
          hintText: 'Description to assign to volumes that were created dynamically', // t('public~Description to assign to volumes that were created dynamically')
        },
        fsType: {
          name: 'Filesystem type', // t('public~Filesystem type')
          hintText: 'Default filesystem type to request', // t('public~Default filesystem type to request')
        },
        adminSecretName: {
          name: 'Admin secret name', // t('public~Admin secret name')
          hintText: 'Name of the secret to use for obtaining the StorageOS API credentials', // t('public~Name of the secret to use for obtaining the StorageOS API credentials')
        },
        adminSecretNamespace: {
          name: 'Admin secret namespace', // t('public~Admin secret namespace')
          hintText: 'Namespace where the API configuration secret is located', // t('public~Namespace where the API configuration secret is located')
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
      this.setState({ error: 'Duplicate keys found.' }); // t('public~Duplicate keys found.')
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
        returnVal.error = 'Storage name is required'; // t('public~Storage name is required')
        returnVal.nameIsValid = false;
      } else if (this.resources) {
        _.each(this.resources.data, function(storageClass) {
          if (storageClass.metadata.name === updatedName.toLowerCase()) {
            returnVal.error = 'Storage name must be unique'; // t('public~Storage name must be unique')
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
    const { t } = this.props;
    return (
      <>
        {!_.isEmpty(parameters) && dynamicContent}

        <div className="form-group">
          <label>{t('public~Additional parameters')}</label>
          <p>
            {t('public~Specific fields for the selected provisioner.')}
            &nbsp;
            {this.storageTypes[this.state.newStorageClass.type].documentationLink && (
              <ExternalLink
                href={this.storageTypes[this.state.newStorageClass.type].documentationLink}
                text={t('public~What should I enter here?')}
              />
            )}
          </p>
          <NameValueEditorComponent
            nameValuePairs={this.state.customParams}
            nameString="Parameter"
            nameParameter="parameter"
            valueString="Value"
            addString="Add Parameter"
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
    const expansionFlag =
      newStorageClass.type && this.storageTypes[newStorageClass.type].allowVolumeExpansion;
    const allowExpansion = expansionFlag ? newStorageClass.expansion : false;

    return (
      <div className="co-m-pane__body co-m-pane__form">
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">{t('public~StorageClass')}</div>
          <div className="co-m-pane__heading-link">
            <Link
              to="/k8s/cluster/storageclasses/~new"
              id="yaml-link"
              data-test="yaml-link"
              replace
            >
              {t('public~Edit YAML')}
            </Link>
          </div>
        </h1>
        <form data-test-id="storage-class-form">
          <div className={classNames('form-group', { 'has-error': fieldErrors.nameValidationMsg })}>
            <label className="control-label co-required" htmlFor="storage-class-name">
              {t('public~Name')}
            </label>
            <input
              type="text"
              className="pf-c-form-control"
              placeholder={newStorageClass.name}
              id="storage-class-name"
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
  StorageClassFormExtensionProps &
  StateProps &
  DispatchProps & {
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
  withTranslation()(
    withExtensions<StorageClassFormExtensionProps, Extension, StorageClassFormProps>({
      params: isStorageClassProvisioner,
    })(StorageClassFormWithTranslation),
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

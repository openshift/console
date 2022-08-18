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
import { Extension, withExtensions } from '@console/plugin-sdk';
import {
  StorageClassProvisioner,
  isStorageClassProvisioner,
  ExtensionSCProvisionerProp,
} from '@console/plugin-sdk/src/typings/storage-class-params';

import {
  AsyncComponent,
  ButtonBar,
  DOC_URL_STORAGE_CLASSES_AWS_EBS,
  DOC_URL_STORAGE_CLASSES_AZURE_DISK,
  DOC_URL_STORAGE_CLASSES_AZURE_FILE,
  DOC_URL_STORAGE_CLASSES_GCE,
  DOC_URL_STORAGE_CLASSES_GLUSTERFS,
  DOC_URL_STORAGE_CLASSES_LOCAL,
  DOC_URL_STORAGE_CLASSES_OPENSTACK_CINDER,
  DOC_URL_STORAGE_CLASSES_PORTWORX_VOLUME,
  DOC_URL_STORAGE_CLASSES_QUOBYTE,
  DOC_URL_STORAGE_CLASSES_SCALEIO,
  DOC_URL_STORAGE_CLASSES_STORAGEOS,
  DOC_URL_STORAGE_CLASSES_VSPHERE,
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
    volumeBindingMode: 'WaitForFirstConsumer',
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
      title: this.props.t('public~AWS CSI'),
      provisioner: 'ebs.csi.aws.com',
      allowVolumeExpansion: true,
      parameters: {
        type: {
          name: this.props.t('public~Type'),
          values: {
            gp3: 'gp3',
            gp2: 'gp2',
            io1: 'io1',
            sc1: 'sc1',
            st1: 'st1',
            standard: 'standard',
          },
          hintText: this.props.t('public~Select AWS Type. Default is gp3'),
        },
        iopsPerGB: {
          name: this.props.t('public~IOPS per GiB'),
          hintText: this.props.t('public~I/O operations per second per GiB'),
          validation: (params) => {
            if (params.iopsPerGB.value && !params.iopsPerGB.value.match(/^\d+$/)) {
              return this.props.t('public~IOPS per GiB must be a number');
            }
            return null;
          },
          visible: (params) => _.get(params, 'type.value') === 'io1',
        },
        fsType: {
          name: this.props.t('public~Filesystem Type'),
          hintText: this.props.t(
            'public~Filesystem type to use during volume creation. Default is ext4.',
          ),
          values: { ext4: 'ext4', xfs: 'xfs', ext2: 'ext2', ext3: 'ext3' },
        },
        encrypted: {
          name: this.props.t('public~Encrypted'),
          type: 'checkbox',
          format: (value) => value.toString(),
        },
        kmsKeyId: {
          name: this.props.t('public~KMS key ID'),
          hintText: this.props.t(
            'public~The full Amazon resource name of the key to use when encrypting the volume',
          ),
          visible: (params) => _.get(params, 'encrypted.value', false),
        },
      },
    },
  });

  // For 'other' storage type
  defaultStorageTypes = Object.freeze({
    ...this.getExtensionsStorageClassProvisioners(Provisioner.OTHERS), // Plugin provisioners
    local: {
      title: this.props.t('public~Local'),
      provisioner: 'kubernetes.io/no-provisioner',
      documentationLink: DOC_URL_STORAGE_CLASSES_LOCAL,
      parameters: {},
      volumeBindingMode: 'WaitForFirstConsumer',
    },
    aws: {
      title: 'AWS Elastic Block Storage',
      provisioner: 'kubernetes.io/aws-ebs',
      allowVolumeExpansion: true,
      documentationLink: DOC_URL_STORAGE_CLASSES_AWS_EBS,
      parameters: {
        type: {
          name: this.props.t('public~Type'),
          values: { io1: 'io1', gp2: 'gp2', sc1: 'sc1', st1: 'st1' },
          hintText: this.props.t('public~Select AWS Type'),
        },
        iopsPerGB: {
          name: this.props.t('public~IOPS per GiB'),
          hintText: this.props.t('public~I/O operations per second per GiB'),
          validation: (params) => {
            if (params.iopsPerGB.value && !params.iopsPerGB.value.match(/^\d+$/)) {
              return this.props.t('public~IOPS per GiB must be a number');
            }
            return null;
          },
          visible: (params) => _.get(params, 'type.value') === 'io1',
        },
        fsType: {
          name: this.props.t('public~Filesystem type'),
          hintText: this.props.t(
            'public~Filesystem type to use during volume creation. Default is ext4.',
          ),
        },
        encrypted: {
          name: this.props.t('public~Encrypted'),
          type: 'checkbox',
          format: (value) => value.toString(),
        },
        kmsKeyId: {
          name: this.props.t('public~KMS key ID'),
          hintText: this.props.t(
            'public~The full Amazon resource name of the key to use when encrypting the volume',
          ),
          visible: (params) => _.get(params, 'encrypted.value', false),
        },
      },
    },
    'gce-pd': {
      title: 'GCE PD',
      provisioner: 'kubernetes.io/gce-pd',
      allowVolumeExpansion: true,
      documentationLink: DOC_URL_STORAGE_CLASSES_GCE,
      parameters: {
        type: {
          name: this.props.t('public~Type'),
          values: { 'pd-standard': 'pd-standard', 'pd-ssd': 'pd-ssd' },
          hintText: this.props.t('public~Select GCE type'),
        },
        zone: {
          name: this.props.t('public~Zone'),
          validation: (params) => {
            if (params.zone.value !== '' && _.get(params, 'zones.value', '') !== '') {
              return this.props.t(
                'public~Zone and zones parameters must not be used at the same time',
              );
            }
            return null;
          },
        },
        zones: {
          name: this.props.t('public~Zones'),
          validation: (params) => {
            if (params.zones.value !== '' && _.get(params, 'zone.value', '') !== '') {
              return this.props.t(
                'public~Zone and zones parameters must not be used at the same time',
              );
            }
            return null;
          },
        },
        'replication-type': {
          name: this.props.t('public~Replication type'),
          values: { none: 'none', 'regional-pd': 'regional-pd' },
          hintText: this.props.t('public~Select Replication type'),
          validation: (params) => {
            if (
              params['replication-type'].value === 'regional-pd' &&
              _.get(params, 'zone.value', '') !== ''
            ) {
              return this.props.t(
                'public~Zone cannot be specified when replication type regional-pd is chosen. Use zones instead.',
              );
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
      documentationLink: DOC_URL_STORAGE_CLASSES_GLUSTERFS,
      parameters: {
        resturl: {
          name: this.props.t('public~Gluster REST/Heketi URL'),
          required: true,
        },
        restuser: {
          name: this.props.t('public~Gluster REST/Heketi user'),
        },
        secretNamespace: {
          name: this.props.t('public~Secret Namespace'),
        },
        secretName: {
          name: this.props.t('public~Secret name'),
        },
        clusterid: {
          name: this.props.t('public~Cluster ID'),
        },
        gidMin: {
          name: this.props.t('public~GID min'),
          validation: (params) => {
            if (params.gidMin.value !== '' && !params.gidMin.value.match(/^[1-9]\d*$/)) {
              return this.props.t('public~GID min must be number');
            }
            return null;
          },
        },
        gidMax: {
          name: this.props.t('public~GID max'),
          validation: (params) => {
            if (params.gidMax.value !== '' && !params.gidMax.value.match(/^[1-9]\d*$/)) {
              return this.props.t('public~GID max must be number');
            }
            return null;
          },
        },
        volumetype: {
          name: this.props.t('public~Volume type'),
        },
      },
    },
    openstackCinder: {
      title: 'OpenStack Cinder',
      provisioner: 'kubernetes.io/cinder',
      allowVolumeExpansion: true,
      documentationLink: DOC_URL_STORAGE_CLASSES_OPENSTACK_CINDER,
      parameters: {
        type: {
          name: this.props.t('public~Volume type'),
        },
        availability: {
          name: this.props.t('public~Availability zone'),
        },
      },
    },
    azureFile: {
      title: 'Azure File',
      provisioner: 'kubernetes.io/azure-file',
      allowVolumeExpansion: true,
      documentationLink: DOC_URL_STORAGE_CLASSES_AZURE_FILE,
      parameters: {
        skuName: {
          name: this.props.t('public~SKU name'),
          hintText: this.props.t('public~Azure storage account SKU tier'),
        },
        location: {
          name: this.props.t('public~Location'),
          hintText: this.props.t('public~Azure storage account location'),
        },
        storageAccount: {
          name: this.props.t('public~Azure storage account name'),
          hintText: this.props.t('public~Azure storage account name'),
        },
      },
    },
    azureDisk: {
      title: 'Azure Disk',
      provisioner: 'kubernetes.io/azure-disk',
      allowVolumeExpansion: true,
      documentationLink: DOC_URL_STORAGE_CLASSES_AZURE_DISK,
      parameters: {
        storageaccounttype: {
          name: this.props.t('public~Storage account type'),
          hintText: this.props.t('public~Storage account type'),
        },
        kind: {
          name: this.props.t('public~Account kind'),
          values: { shared: 'shared', dedicated: 'dedicated', managed: 'managed' },
          hintText: this.props.t('public~Select account kind'),
        },
      },
    },
    quobyte: {
      title: 'Quobyte',
      provisioner: 'kubernetes.io/quobyte',
      allowVolumeExpansion: false,
      documentationLink: DOC_URL_STORAGE_CLASSES_QUOBYTE,
      parameters: {
        quobyteAPIServer: {
          name: this.props.t('public~Quobyte API server'),
          hintText: this.props.t('public~Quobyte API server'),
        },
        registry: {
          name: this.props.t('public~Registry address(es)'),
          hintText: this.props.t('public~Registry address(es)'),
        },
        adminSecretName: {
          name: this.props.t('public~Admin secret name'),
          hintText: this.props.t('public~Admin secret name'),
        },
        adminSecretNamespace: {
          name: this.props.t('public~Admin secret namespace'),
          hintText: this.props.t('public~Admin secret namespace'),
        },
        user: {
          name: this.props.t('public~User'),
          hintText: this.props.t('public~User'),
        },
        group: {
          name: this.props.t('public~Group'),
          hintText: this.props.t('public~Group'),
        },
        quobyteConfig: {
          name: this.props.t('public~Quobyte configuration'),
          hintText: this.props.t('public~Quobyte configuration'),
        },
        quobyteTenant: {
          name: this.props.t('public~Quobyte tenant'),
          hintText: this.props.t('public~Quobyte tenant ID used to create/delete the volume'),
        },
      },
    },
    vSphereVolume: {
      title: 'vSphere Volume',
      provisioner: 'kubernetes.io/vsphere-volume',
      allowVolumeExpansion: false,
      documentationLink: DOC_URL_STORAGE_CLASSES_VSPHERE,
      parameters: {
        diskformat: {
          name: this.props.t('public~Disk format'),
          values: {
            thin: 'thin',
            zeroedthick: 'zeroed thick',
            eagerzeroedthick: 'eager zeroed thick',
          },
          hintText: this.props.t('public~Select disk format'),
        },
        datastore: {
          name: this.props.t('public~Datastore'),
          hintText: this.props.t('public~Datastore'),
        },
      },
      volumeBindingMode: 'Immediate',
    },
    portworxVolume: {
      title: 'Portworx Volume',
      provisioner: 'kubernetes.io/portworx-volume',
      allowVolumeExpansion: true,
      documentationLink: DOC_URL_STORAGE_CLASSES_PORTWORX_VOLUME,
      parameters: {
        fs: {
          name: this.props.t('public~Filesystem'),
          values: { none: 'none', xfs: 'xfs', ext4: 'ext4' },
          hintText: this.props.t('public~Select Filesystem'),
        },
        // eslint-disable-next-line camelcase
        block_size: {
          name: this.props.t('public~Block size'),
          hintText: this.props.t('public~Block size in Kb'),
          validation: (params) => {
            if (params.block_size.value !== '' && !params.block_size.value.match(/^[1-9]\d*$/)) {
              return this.props.t('public~Snapshot interval must be a number');
            }
            return null;
          },
        },
        repl: {
          name: this.props.t(
            'public~Number of synchronous replicas to be provided in the form of replication factor',
          ),
          hintText: this.props.t('public~Number of replicas'),
          validation: (params) => {
            if (params.repl.value !== '' && !params.repl.value.match(/^[1-9]\d*$/)) {
              return this.props.t('public~Number of replicas must be a number');
            }
            return null;
          },
        },
        // eslint-disable-next-line camelcase
        io_priority: {
          name: this.props.t('public~I/O priority'),
          values: { high: 'high', medium: 'medium', low: 'low' },
          hintText: this.props.t('public~I/O priority'),
        },
        // eslint-disable-next-line camelcase
        snap_interval: {
          name: this.props.t('public~Snapshot interval'),
          hintText: this.props.t(
            'public~Clock/time interval in minutes for when to trigger snapshots',
          ),
          validation: (params) => {
            if (params.repl.value !== '' && !params.repl.value.match(/^[1-9]\d*$/)) {
              return this.props.t('public~Snapshot interval must be a number');
            }
            return null;
          },
          format: (value) => value.toString(),
        },
        // eslint-disable-next-line camelcase
        aggregation_level: {
          name: this.props.t('public~Aggregation level'),
          hintText: this.props.t(
            'public~The number of chunks the volume would be distributed into',
          ),
          validation: (params) => {
            if (
              params.aggregation_level.value !== '' &&
              !params.aggregation_level.value.match(/^[1-9]\d*$/)
            ) {
              return this.props.t('public~Aggregation level must be a number');
            }
            return null;
          },
          format: (value) => value.toString(),
        },
        ephemeral: {
          name: this.props.t('public~Ephemeral'),
          type: 'checkbox',
          format: (value) => value.toString(),
        },
      },
    },
    scaleIo: {
      title: 'ScaleIO',
      provisioner: 'kubernetes.io/scaleio',
      allowVolumeExpansion: false,
      documentationLink: DOC_URL_STORAGE_CLASSES_SCALEIO,
      parameters: {
        gateway: {
          name: this.props.t('public~API gateway'),
          required: true,
          hintText: this.props.t('public~ScaleIO API gateway address'),
        },
        system: {
          name: this.props.t('public~System name'),
          required: true,
          hintText: this.props.t('public~Name of the ScaleIO system'),
        },
        protectionDomain: {
          name: this.props.t('public~Protection domain'),
          required: true,
          hintText: this.props.t('public~Name of the ScaleIO protection domain'),
        },
        storagePool: {
          name: this.props.t('public~Storage pool'),
          required: true,
          hintText: this.props.t('public~Name of the volume storage pool'),
        },
        storageMode: {
          name: this.props.t('public~Storage mode'),
          values: { thinProvisioned: 'ThinProvisioned', thickProvisioned: 'ThickProvisioned' },
          hintText: this.props.t('public~Select storage provision mode'),
        },
        secretRef: {
          name: this.props.t('public~Secret reference'),
          required: true,
          hintText: this.props.t('public~Reference to a configured Secret object'),
        },
        readOnly: {
          name: this.props.t('public~Read Only'),
          type: 'checkbox',
        },
        fsType: {
          name: this.props.t('public~Filesystem Type'),
          hintText: this.props.t('public~Filesystem to use for the volume'),
        },
      },
    },
    storageOs: {
      title: 'StorageOS',
      provisioner: 'kubernetes.io/storageos',
      allowVolumeExpansion: false,
      documentationLink: DOC_URL_STORAGE_CLASSES_STORAGEOS,
      parameters: {
        pool: {
          name: this.props.t('public~Pool'),
          hintText: this.props.t(
            'public~Name of the StorageOS distributed capacity pool from which to provision the volume',
          ),
        },
        description: {
          name: this.props.t('public~Description'),
          hintText: this.props.t(
            'public~Description to assign to volumes that were created dynamically',
          ),
        },
        fsType: {
          name: this.props.t('public~Filesystem type'),
          hintText: this.props.t('public~Default filesystem type to request'),
        },
        adminSecretName: {
          name: this.props.t('public~Admin secret name'),
          hintText: this.props.t(
            'public~Name of the secret to use for obtaining the StorageOS API credentials',
          ),
        },
        adminSecretNamespace: {
          name: this.props.t('public~Admin secret namespace'),
          hintText: this.props.t('public~Namespace where the API configuration secret is located'),
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

  volumeBindingModes = {
    Immediate: 'Immediate',
    WaitForFirstConsumer: 'WaitForFirstConsumer',
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
    const expansionFlag =
      newStorageClass.type && this.storageTypes[newStorageClass.type].allowVolumeExpansion;
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
  volumeBindingMode: string;
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

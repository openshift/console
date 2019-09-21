import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash-es';
import { Form, FormControl, FormGroup, HelpBlock } from 'patternfly-react';
import { ActionGroup, Button } from '@patternfly/react-core';
import {
  AsyncComponent,
  ButtonBar,
  Dropdown,
  NameValueEditorPair,
  history,
  ExternalLink,
} from './utils';
import { Firehose } from './utils/firehose';
import { k8sCreate } from './../module/k8s';
import * as k8sActions from '../actions/k8s';
import { StorageClassModel } from './../models';

const NameValueEditorComponent = (props) => <AsyncComponent loader={() => import('./utils/name-value-editor').then(c => c.NameValueEditor)} {...props} />;

const defaultState = {
  newStorageClass: {
    name: '',
    description: '',
    type: null,
    parameters: {},
    reclaim: null,
  },
  customParams: [['', '']],
  validationSuccessful: false,
  loading: false,
  error: null,
  fieldErrors: {parameters: {}},
};

export class StorageClassForm_ extends React.Component<StorageClassFormProps, StorageClassFormState> {

  resources: Resources;
  reduxId: string;
  previousName: string;

  constructor(props) {
    super(props);
    this.state = defaultState;
    this.previousName = '';
  }

  storageTypes = Object.freeze({
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
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#aws-ebs',
      parameters: {
        type: {
          name: 'Type',
          values: {io1: 'io1', gp2: 'gp2', sc1: 'sc1', st1: 'st1'},
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
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#gce',
      parameters: {
        type: {
          name: 'Type',
          values: {'pd-standard': 'pd-standard', 'pd-ssd': 'pd-ssd'},
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
          values: {none: 'none', 'regional-pd': 'regional-pd'},
          hintText: 'Select Replication Type',
          validation: (params) => {
            if (params['replication-type'].value === 'regional-pd' && _.get(params, 'zone.value', '') !== '') {
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
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#openstack-cinder',
      parameters: {
        type: {
          name: 'Volume Type',
        },
        availability:{
          name: 'Availability Zone',
        },
      },
    },
    azureFile: {
      title: 'Azure File',
      provisioner: 'kubernetes.io/azure-file',
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
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#azure-disk',
      parameters: {
        storageaccounttype: {
          name: 'Storage Account Type',
          hintText: 'Storage Account Type',
        },
        kind: {
          name: 'Account Kind',
          values: {shared: 'shared', dedicated: 'dedicated', managed: 'managed'},
          hintText: 'Select Account Kind',
        },
      },
    },
    quobyte: {
      title: 'Quobyte',
      provisioner: 'kubernetes.io/quobyte',
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
    cephRbd: {
      title: 'Ceph RBD',
      provisioner: 'kubernetes.io/rbd',
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#ceph-rbd',
      parameters: {
        monitors: {
          name: 'Monitors',
          required: true,
          hintText: 'Monitors',
        },
        adminId: {
          name: 'Admin Client ID',
          hintText: 'Admin Client ID',
        },
        adminSecretName: {
          name: 'Admin Secret Name',
          required: true,
          hintText: 'Admin Secret Name',
        },
        adminSecretNamespace: {
          name: 'Admin Secret Namespace',
          hintText: 'Admin Secret Namespace',
        },
        pool: {
          name: 'Pool',
          hintText: 'Pool',
        },
        userId: {
          name: 'User Client ID',
          hintText: 'Ceph client ID used to map the RBD image',
        },
        userSecretName: {
          name: 'User Secret Name',
          required: true,
          hintText: 'User Secret Name',
        },
        userSecretNamespace: {
          name: 'User Secret Namespace',
          hintText: 'User Secret Namespace',
        },
        fsType: {
          name: 'Filesystem Type',
          hintText: 'Filesystem Type',
        },
        imageFormat: {
          name: 'Image Format',
          values: {1: '1', 2: '2'},
          hintText: 'Select Image Format',
        },
        imageFeatures: {
          name: 'Image Features',
          hintText: 'Image Features',
          visible: (params) => _.get(params, 'imageFormat.value') === '2',
        },
      },
    },
    vSphereVolume: {
      title: 'vSphere Volume',
      provisioner: 'kubernetes.io/vsphere-volume',
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#vsphere',
      parameters: {
        diskformat: {
          name: 'Disk Format',
          values: {thin: 'thin', zeroedthick: 'zeroed thick', eagerzeroedthick: 'eager zeroed thick'},
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
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#portworx-volume',
      parameters: {
        fs: {
          name: 'Filesystem',
          values: {none: 'none', xfs: 'xfs', ext4: 'ext4'},
          hintText: 'Select Filesystem',
        },
        block_size: { // eslint-disable-line camelcase
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
        io_priority: { // eslint-disable-line camelcase
          name: 'I/O Priority',
          values: {high: 'high', medium: 'medium', low: 'low'},
          hintText: 'I/O Priority',
        },
        snap_interval: { // eslint-disable-line camelcase
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
        aggregation_level: { // eslint-disable-line camelcase
          name: 'Aggregation Level',
          hintText: 'The number of chunks the volume would be distributed into',
          validation: (params) => {
            if (params.aggregation_level.value !== '' && !params.aggregation_level.value.match(/^[1-9]\d*$/)) {
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
          values: {thinProvisioned: 'ThinProvisioned', thickProvisioned: 'ThickProvisioned'},
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
      documentationLink: 'https://kubernetes.io/docs/concepts/storage/storage-classes/#storageos',
      parameters: {
        pool: {
          name: 'Pool',
          hintText: 'Name of the StorageOS distributed capacity pool from which to provision the volume',
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

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.props.watchK8sList(this.reduxId, {}, StorageClassModel);
      const loaded = this.props.k8s.getIn([StorageClassModel.plural, 'loaded']);
      if (loaded) {
        const data = this.props.k8s.getIn([StorageClassModel.plural, 'data']);
        this.resources = {
          data: data && data.toArray().map(p => p.toJSON()),
          loadError: this.props.k8s.getIn([StorageClassModel.plural, 'loadError']),
          loaded,
        };

        this.validateForm();
      }
    }
  }

  setParameterHandler = (param, event, checkbox) => {
    const newParams = {...this.state.newStorageClass.parameters};
    if (checkbox) {
      newParams[param] = {value: event.target.checked};
    } else {
      if (event.target) {
        newParams[param] = {value: event.target.value};
      } else {
        newParams[param] = {value: event};
      }
    }

    _.forOwn(newParams, (value, key) => {
      if (newParams.hasOwnProperty(key)) {
        const validation = _.get(this.storageTypes[this.state.newStorageClass.type], ['parameters', key, 'validation'], null);
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

    runValidation ? this.setState({newStorageClass: newParams}, this.validateForm) : this.setState({newStorageClass: newParams});
  };

  createStorageClass = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();

    this.setState({
      loading: true,
    });

    const { description, type, reclaim } = this.state.newStorageClass;
    const dataParameters = this.getFormParams();
    const annotations = description ? { description } : {};
    const data : StorageClass = {
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

    const volumeBindingMode = _.get(this.storageTypes[type], 'volumeBindingMode', null);
    if (volumeBindingMode) {
      data.volumeBindingMode = volumeBindingMode;
    }

    k8sCreate(StorageClassModel, data)
      .then(() => {
        this.setState({loading: false});
        history.push('/k8s/cluster/storageclasses');
      })
      .catch(error => this.setState({loading: false, error}));
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
      }), (value) => value !== ''
    );

    return _.merge(dataParameters, this.getCustomParams());
  };

  getCustomParams = () => {
    // Discard any row whose key is blank
    const customParams = _.reject(this.state.customParams, t => _.isEmpty(t[NameValueEditorPair.Name]));

    // Display error if duplicate keys are found
    const keys = customParams.map(t => t[NameValueEditorPair.Name]);
    if (_.uniq(keys).length !== keys.length) {
      this.setState({error: 'Duplicate keys found.'});
      return;
    }

    // Convert any blank values to null
    _.each(customParams, t => t[NameValueEditorPair.Value] = _.isEmpty(t[NameValueEditorPair.Value])
      ? null : t[NameValueEditorPair.Value]);

    return _.fromPairs(customParams);
  };

  updateCustomParams = (customParams) => {
    this.setState({
      customParams: customParams.nameValuePairs,
    });
  };

  validateForm = () => {
    // Clear error messages from previous validation attempts first
    this.setState({error: null, fieldErrors: {}}, () => {
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

      this.setState({fieldErrors, validationSuccessful});
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
    const allParamsValid = !_.some(params, ({validationMsg}) => validationMsg !== null);
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

    const requiredKeys = _.keys(allParamsForType).filter(key => this.paramIsRequired(key));
    const allReqdFieldsEntered = _.every(requiredKeys, key => {
      const value = _.get(userEnteredParams, [key, 'value']);
      return !_.isEmpty(value);
    });

    return allReqdFieldsEntered;
  };

  paramIsRequired = (paramKey, params = this.state.newStorageClass.parameters) => {
    const requiredParam = _.get(this.storageTypes[this.state.newStorageClass.type], ['parameters', paramKey, 'required'], null);
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
      const validationMsg = _.get(parameter, 'validationMsg', null);
      const isCheckbox = parameter.type === 'checkbox';

      if (parameter.visible && !parameter.visible(this.state.newStorageClass.parameters)) {
        return null;
      }

      const children = parameter.values
        ? <React.Fragment>
          <label className={classNames('control-label', { 'co-required': this.paramIsRequired(key) })}>
            {_.get(parameter, 'name', key)}
          </label>
          <Dropdown
            title={parameter.hintText}
            items={parameter.values}
            dropDownClassName="dropdown--full-width"
            selectedKey={_.get(this.state, `newStorageClass.parameters.${key}.value`)}
            onChange={(event) => this.setParameterHandler(key, event, false)} />
          <HelpBlock>{validationMsg ? validationMsg : null}</HelpBlock>
        </React.Fragment>
        : <React.Fragment>
          {isCheckbox
            ? <React.Fragment>
              <div className="checkbox">
                <label>
                  <input type="checkbox"
                    className="create-storage-class-form__checkbox"
                    onChange={(event) => this.setParameterHandler(key, event, isCheckbox)}
                    checked={_.get(this.state, `newStorageClass.parameters.${key}.value`, false)}
                    id={`provisioner-settings-${key}-checkbox`} />
                  {_.get(parameter, 'name', key)}
                </label>
              </div>
            </React.Fragment>
            : <React.Fragment>
              <label className={classNames('control-label', { 'co-required': this.paramIsRequired(key) })}>
                {_.get(parameter, 'name', key)}
              </label>
              <FormControl
                type="text"
                bsClass="pf-c-form-control"
                value={_.get(this.state, `newStorageClass.parameters.${key}.value`, '')}
                onChange={(event) => this.setParameterHandler(key, event, isCheckbox)} />
            </React.Fragment>
          }
          <HelpBlock>{validationMsg ? validationMsg : parameter.hintText}</HelpBlock>
        </React.Fragment>;

      return (
        <FormGroup
          key={key}
          controlId={`provisioner-settings-${key}`}
          validationState={_.get(this.state.newStorageClass.parameters, `${key}.validationMsg`, null) ? 'error' : null} >
          {children}
        </FormGroup>
      );
    });

    return (
      <React.Fragment>
        {dynamicContent}

        <FormGroup controlId={'provisioner-parameters-custom'}>
          <label className="control-label">Additional Parameters</label>
          <p>
            Specific fields for the selected provisioner. &nbsp;
            <ExternalLink href={this.storageTypes[this.state.newStorageClass.type].documentationLink} text="What should I enter here?" />
          </p>
          <NameValueEditorComponent
            nameValuePairs={this.state.customParams}
            nameString="Parameter"
            valueString="Value"
            addString="Add Parameter"
            updateParentData={this.updateCustomParams} />
        </FormGroup>
      </React.Fragment>
    );
  };

  autocompleteFilter = (text, item) => fuzzy(text, item);

  render() {
    const { newStorageClass, fieldErrors } = this.state;
    const reclaimPolicyKey = newStorageClass.reclaim === null ? this.reclaimPolicies.Delete : newStorageClass.reclaim;

    return (
      <div className="co-m-pane__body co-m-pane__form">
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">
            Create Storage Class
          </div>
          <div className="co-m-pane__heading-link">
            <Link to="/k8s/cluster/storageclasses/~new" id="yaml-link" replace>Edit YAML</Link>
          </div>
        </h1>
        <Form>
          <FormGroup controlId={'basic-settings-name'} validationState={fieldErrors.nameValidationMsg ? 'error': null}>
            <label className="control-label co-required" htmlFor="storage-class-name">Name</label>
            <FormControl
              type="text"
              bsClass="pf-c-form-control"
              placeholder={newStorageClass.name}
              id="storage-class-name"
              onChange={(event) => this.setStorageHandler('name', event.target.value)}
              value={_.get(newStorageClass, 'name', '')} />
            <HelpBlock>{fieldErrors.nameValidationMsg ? fieldErrors.nameValidationMsg : null}</HelpBlock>
          </FormGroup>

          <FormGroup controlId={'basic-settings-description'}>
            <label htmlFor="storage-class-description">Description</label>
            <FormControl
              type="text"
              bsClass="pf-c-form-control"
              id="storage-class-description"
              onChange={(event) => this.setStorageHandler('description', event.target.value)}
              value={_.get(newStorageClass, 'description', '')} />
          </FormGroup>

          <FormGroup controlId={'basic-settings-reclaim-policy'}>
            <label className="control-label co-required">Reclaim Policy</label>
            <Dropdown
              title="Select Reclaim Policy"
              items={this.reclaimPolicies}
              dropDownClassName="dropdown--full-width"
              selectedKey={reclaimPolicyKey}
              onChange={(event) => this.setStorageHandler('reclaim', event)} />
            <HelpBlock>
              Determines what happens to persistent volumes when the associated persistent volume claim is deleted. Defaults to &lsquo;Delete&rsquo;
            </HelpBlock>
          </FormGroup>

          <FormGroup controlId={'basic-settings-storage'}>
            <label className="control-label co-required">Provisioner</label>
            <Dropdown
              title="Select Provisioner"
              autocompleteFilter={this.autocompleteFilter}
              autocompletePlaceholder={'Select Provisioner'}
              items={_.mapValues(this.storageTypes, 'provisioner')}
              dropDownClassName="dropdown--full-width"
              menuClassName="dropdown-menu--text-wrap"
              selectedKey={_.get(this.state, 'newStorageClass.type')}
              onChange={(event) => this.setStorageHandler('type', event)} />
            <HelpBlock>Determines what volume plugin is used for provisioning persistent volumes.</HelpBlock>
          </FormGroup>

          <div className="co-form-subsection">
            {newStorageClass.type !== null ? this.getProvisionerElements() : null}
          </div>

          <ButtonBar errorMessage={this.state.error ? this.state.error.message : ''} inProgress={this.state.loading}>
            <ActionGroup className="pf-c-form">
              <Button
                id="save-changes"
                isDisabled={!this.state.validationSuccessful}
                onClick={this.createStorageClass}
                type="submit"
                variant="primary">
                Create
              </Button>
              <Button
                id="cancel"
                onClick={() => history.push('/k8s/cluster/storageclasses')}
                type="button"
                variant="secondary">
                Cancel
              </Button>
            </ActionGroup>
          </ButtonBar>
        </Form>
      </div>
    );
  }
}

const mapStateToProps = ({k8s}, {onClose}) => ({
  k8s,
  onClose,
});

const mapDispatchToProps = () => ({
  stopK8sWatch: k8sActions.stopK8sWatch,
  watchK8sList: k8sActions.watchK8sList,
});

export type StorageClassFormProps = {
  onClose: () => void;
  watchK8sList: (id: string, query: object, kind: object) => void;
  stopK8sWatch: (id: string) => void;
  k8s: any;
};

export type StorageClassData = {
  name: string;
  type: string;
  description: string;
  parameters: any;
  reclaim: string;
};

export type StorageClass = {
  metadata: object;
  provisioner: string;
  parameters: object;
  reclaimPolicy?: string;
  volumeBindingMode?: string;
};

export type StorageClassFormState = {
  newStorageClass: StorageClassData;
  customParams: string[][];
  validationSuccessful: boolean;
  loading: boolean;
  error: any;
  fieldErrors: {[k: string]: any};
};

export type Resources = {
  loaded: boolean;
  data: any[];
  loadError: string;
};

export const ConnectedStorageClassForm = connect(mapStateToProps, mapDispatchToProps)(StorageClassForm_);

export const StorageClassForm = props => {
  const resources = [{kind: 'StorageClass', isList: true}];
  return (
    <Firehose resources={resources}>
      <ConnectedStorageClassForm {...props} />
    </Firehose>
  );
};

ConnectedStorageClassForm.displayName='StorageClassForm';

import * as React from 'react';
import * as _ from 'lodash';
import { Wizard, Form, Col, FormControl, FormGroup, ControlLabel, HelpBlock, Alert } from 'patternfly-react';
import { Dropdown } from '../utils';
import { makeReduxID } from '../utils/firehose';
import { k8sCreate } from '../../module/k8s';
import actions from '../../module/k8s/k8s-actions';
import { StorageClassModel } from '../../models';
import { connect } from 'react-redux';

const defaultState = {
  showModal: false,
  activeStepIndex: 0,
  newStorage: {
    name:'',
    type: null,
    parameters: {},
    reclaim: null
  },
  nameValid: null,
  nameTouched: false,
  nextStepDisabled: true,
  loading: false,
  error: null
};

/*eslint-disable no-undef*/
class StorageWizard extends React.Component<StorageWizardProps, StorageWizardState> {

  resources: Resources
  reduxId: string

  constructor(props){
    super(props);
    this.state = defaultState;
    this.reduxId = makeReduxID(StorageClassModel, {});
    this.props.watchK8sList(this.reduxId, {}, StorageClassModel);
    this.resources;
  }

  storageTypes = {
    aws: {
      title: 'AWS',
      provisioner: 'kubernetes.io/aws-ebs',
      parameters: {
        type: {
          name: 'Type',
          values: {io1:'io1',gp2:'gp2',sc1:'sc1',st1:'st1'},
          placeholder: 'Choose AWS Type'
        },zone:{
          name: 'Zone',
          placeholder: 'AWS zone',
          validation: (params) => {
            if (params.zone.value !== '' && _.get(params,'zones.value','') !== ''){
              return 'zone and zones parameters must not be used at the same time';
            }
            return null;
          }
        },zones: {
          name: 'Zones',
          placeholder: 'AWS zones',
          validation: (params) => {
            if (params.zones.value !== '' && _.get(params,'zone.value','') !== ''){
              return 'zone and zones parameters must not be used at the same time';
            }
            return null;
          }
        },iopsPerGB:{
          name: 'IOPS Per GB',
          placeholder: 'I/O operations per second per GiB',
          validation: (params) => {
            if (params.iopsPerGB.value !== '' && !params.iopsPerGB.value.match(/^[1-9]\d*$/)){
              return 'iopsPerGB must be number';
            }
            return null;
          },
          visible: (params) => _.get(params, 'type.value') === 'io1'
        },encrypted:{
          name: 'Encrypted',
          type: 'checkbox',
          format: (value) => value.toString()
        },kmsKeyId:{
          placeholder: 'The full Amazon Resource Name of the key to use when encrypting the volume',
          visible: (params) => _.get(params, 'encrypted.value', false)
        }
      }
    },
    gce: {
      title: 'GCE',
      provisioner: 'kubernetes.io/gce-pd',
      parameters: {
        type: {
          name: 'Type',
          values: {'pd-standard':'pd-standard', 'pd-ssd':'pd-ssd'},
          placeholder: 'Choose GCE type'
        },
        zone: {
          name: 'Zone',
          validation: (params) => {
            if (params.zone.value !== '' && _.get(params,'zones.value','') !== ''){
              return 'zone and zones parameters must not be used at the same time';
            }
            return null;
          }
        },
        zones: {
          name: 'Zones',
          validation: (params) => {
            if (params.zones.value !== '' && _.get(params,'zone.value','') !== ''){
              return 'zone and zones parameters must not be used at the same time';
            }
            return null;
          }
        },
        'replication-type':{
          name: 'Replication Type',
          values: {none:'none','regional-pd':'regional-pd'},
          placeholder: 'Choose Replication Type',
          validation: (params) => {
            if (params['replication-type'].value === 'regional-pd' && _.get(params,'zone.value','') !== ''){
              return 'zone cannot be specified when Replication Type regional-pd is chosen, use zones instead';
            }
            return null;
          }
        }
      }
    },
    glusterfs: {
      title: 'Glusterfs',
      provisioner: 'kubernetes.io/glusterfs',
      parameters: {
        resturl: {
          name: 'Gluster REST/Heketi URL'
        },
        restuser: {
          name: 'Gluster REST/Heketi user'
        },
        secretNamespace: {
          name: 'Secret Namespace'
        },
        secretName: {
          name: 'Secret Name'
        },
        clusterid: {
          name: 'Cluster ID'
        },
        gidMin: {
          name: 'GID Min',
          validation: (params) => {
            if (params.gidMin.value !== '' && !params.gidMin.value.match(/^[1-9]\d*$/)){
              return 'GID Min must be number';
            }
            return null;
          },
        },
        gidMax: {
          name: 'GID Max',
          validation: (params) => {
            if (params.gidMax.value !== '' && !params.gidMax.value.match(/^[1-9]\d*$/)){
              return 'GID Max must be number';
            }
            return null;
          }
        },
        volumetype: {
          name: 'Volume Type'
        }
      }
    },
    openstackCider: {
      title: 'OpenStack Cinder',
      provisioner: 'kubernetes.io/cinder',
      parameters: {
        type: {
          name: 'Volume Type'
        },
        availability:{
          name: 'Availability Zone'
        }
      }
    },
  }

  reclaimPolicies = {
    Retain: 'Retain',
    Delete: 'Delete'
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps){
      if (this.props.show !== prevProps.show){
        if (this.props.show) {
          this.props.watchK8sList(this.reduxId, {}, StorageClassModel);
        } else {
          this.props.stopK8sWatch(this.reduxId);
        }
      }
      if (this.props.show){
        const loaded = this.props.k8s.getIn([StorageClassModel.plural, 'loaded']);
        if (loaded){
          const data = this.props.k8s.getIn([StorageClassModel.plural, 'data']);
          this.resources = {
            data: data && data.toArray().map(p => p.toJSON()),
            loadError: this.props.k8s.getIn([StorageClassModel.plural, 'loadError']),
            loaded: loaded,
          };
        }
        this.validateWizard(this.state.activeStepIndex, this.state.newStorage.name, this.state.newStorage.type, this.state.newStorage.parameters, undefined);
      }
    }
  }

  setParameterHandler = (param, event, checkbox) => {
    let newParams = {...this.state.newStorage.parameters};
    if (checkbox){
      newParams[param] = {value: event.target.checked};
    } else {
      if (event.target){
        newParams[param] = {value:event.target.value};
      } else {
        newParams[param] = {value:event};
      }
    }

    for (let key in newParams){
      if (newParams.hasOwnProperty(key)){
        const validation = _.get(this.storageTypes[this.state.newStorage.type],['parameters',key,'validation']);
        let valid = null;
        if (validation){
          valid = validation(newParams);
        }
        newParams[key].valid = valid;
      }
    }

    this.updateNewStorage('parameters',newParams);
    this.validateWizard(this.state.activeStepIndex, this.state.newStorage.name, this.state.newStorage.type, newParams, undefined);
  }

  setNameHandler = (event) => {
    this.setState({nameTouched: true});
    const newName = event.target.value;
    this.updateNewStorage('name',newName);
    this.validateWizard(this.state.activeStepIndex, newName, this.state.newStorage.type, this.state.newStorage.parameters, true);
  }

  setStorageHandler = (param,event) => {
    this.updateNewStorage(param, event);
    this.validateWizard(this.state.activeStepIndex, this.state.newStorage.name, event, this.state.newStorage.parameters, undefined);
  }

  updateNewStorage = (param, value) => {
    this.setState({
      newStorage: {
        ...this.state.newStorage,
        [param]: value
      }
    });
  }

  wizardSteps = [
    {
      title: 'Basic Settings',
      render: () => <Form horizontal className="wizard-form">
        <FormGroup controlId={'basic-settings-name'} validationState={this.state.nameValid ? 'error': null}>
          <Col sm={3} className="text-right"><ControlLabel className="required-pf">Name</ControlLabel></Col>
          <Col sm={4}>
            <FormControl type="text" onChange={(event) => this.setNameHandler(event)} value={_.get(this.state.newStorage, 'name', '')} />
            <HelpBlock>{this.state.nameValid ? this.state.nameValid: null}</HelpBlock>
          </Col>
        </FormGroup>
        <FormGroup controlId={'basic-settings-storage'}>
          <Col sm={3} className="text-right"><ControlLabel className="required-pf">Storage Type</ControlLabel></Col>
          <Col sm={4}>
            <Dropdown title="Choose Storage Type" items={_.mapValues(this.storageTypes, (o) => o.title)} selectedKey={_.get(this.state, 'newStorage.type')} onChange={(event) => this.setStorageHandler('type',event)} />
          </Col>
        </FormGroup>
        <FormGroup controlId={'basic-settings-reclaim-policy'}>
          <Col className="text-right" sm={3}><ControlLabel>Reclaim Policy</ControlLabel></Col>
          <Col sm={4}>
            <Dropdown title="Choose Reclaim Policy" items={this.reclaimPolicies} selectedKey={_.get(this.state, 'newStorage.reclaim')} onChange={(event) => this.updateNewStorage('reclaim',event)} />
          </Col>
        </FormGroup>
      </Form>
    },
    {
      title: 'Provisioner Details',
      render: () => <Form horizontal className="wizard-form">
        {Object.keys(this.storageTypes[this.state.newStorage.type].parameters).map(param => {
          const parameter = this.storageTypes[this.state.newStorage.type].parameters[param];
          const valid = _.get(this.state.newStorage.parameters[param], 'valid', null);
          const isCheckbox = parameter.type === 'checkbox';
          if (parameter.visible && !parameter.visible(this.state.newStorage.parameters)){
            return null;
          }
          let children =
            <Col sm={isCheckbox ? 1: 4}><FormControl type={isCheckbox ? 'checkbox': 'text'} checked={_.get(this.state, `newStorage.parameters.${param}.value`, false)} value={_.get(this.state, `newStorage.parameters.${param}.value`, '')} onChange={(event) => this.setParameterHandler(param,event, isCheckbox)} />
              <HelpBlock>{valid ? valid: parameter.placeholder}</HelpBlock>
            </Col>;
          if (parameter.values) {
            children = <Col sm={4}>
              <Dropdown title={parameter.placeholder} items={parameter.values} selectedKey={_.get(this.state, `newStorage.parameters.${param}.value`)} onChange={(event) => this.setParameterHandler(param,event, false)} />
              <HelpBlock>{valid ? valid : null}</HelpBlock>
            </Col>;
          }
          return <FormGroup key={param} controlId={`provisioner-settings-${param}`} validationState={_.get(this.state.newStorage.parameters, `${param}.valid`, null) ? 'error' : null}>
            <Col className="text-right" sm={3}><ControlLabel>{_.get(parameter, 'name', param)}</ControlLabel></Col>
            {children}
          </FormGroup>;
        })}
      </Form>
    },
    {
      title: 'Result',
      render: () => {
        return this.state.error ?
          <Alert type="error"><span>{this.state.error.message}</span></Alert> :
          <Alert type="success"><span>Storage Class <b>{this.state.newStorage.name}</b> was created</span></Alert>;
      }
    }
  ];

  createStorageClass = () => {
    this.setState({
      loading: true
    });
    const type = this.state.newStorage.type;
    const dataParameters = _.pickBy(_.mapValues(this.state.newStorage.parameters, (value, key) => {
      let finalValue = value.value;
      if (this.storageTypes[type].parameters[key].format) {
        finalValue = this.storageTypes[type].parameters[key].format(value.value);
      }
      return finalValue;
    }), (value) => value !== '');
    let data : StorageClass = {
      metadata: {
        name: this.state.newStorage.name
      },
      provisioner: this.storageTypes[type].provisioner,
      parameters: dataParameters,
    };
    if (this.state.newStorage.reclaim){
      data.reclaimPolicy = this.state.newStorage.reclaim;
    }
    k8sCreate(StorageClassModel,data).then(() => {
      this.setState({loading: false});
    }).catch(error => {
      this.setState({loading: false, error: error});
    });
  }

  close = () => {
    this.props.onClose();
    this.setState(defaultState);
  }

  validateWizard = (index, name, type, params, nameTouched) => {
    if (index === 0) {
      let nameValid = null;
      if (nameTouched || this.state.nameTouched){
        if (name.trim().length === 0) {
          nameValid = 'Storage name is required';
        }
        if (this.resources){
          for (let i = 0; i< this.resources.data.length; i++){
            if (this.resources.data[i].metadata.name === name.toLowerCase()){
              nameValid= 'Storage name must be unique';
            }
          }
        }
      }
      this.setState({
        nameValid: nameValid,
        nextStepDisabled: nameValid !== null || type === null
      });
    }
    if (index === 1 ) {
      let nextStepDisabled = false;
      for (let key in params){
        if (params[key].valid){
          nextStepDisabled = true;
          break;
        }
      }
      this.setState({
        nextStepDisabled: nextStepDisabled
      });
    }
  }

  onStepChanged = (index) => {
    this.setState({ activeStepIndex: index });
    this.validateWizard(index, this.state.newStorage.name, this.state.newStorage.type, this.state.newStorage.parameters, undefined);
    if (index === 2) {
      this.createStorageClass();
    }
  }

  render(){
    return (
      <Wizard.Pattern
        show={this.props.show}
        onHide={this.close}
        onExited={this.close}
        title="Create Storage Class"
        nextStepDisabled={this.state.nextStepDisabled}
        steps={this.wizardSteps}
        onStepChanged={(index) => this.onStepChanged(index)}
        nextText={this.state.activeStepIndex === 1 ? 'Create Storage Class':'Next'}
        activeStepIndex={this.state.activeStepIndex}
        loading={this.state.loading}
        loadingTitle="Creating Storage Class..."
        loadingMessage="" />);
  }

}

const mapStateToProps = ({k8s}, {onClose, show}) => ({
  k8s: k8s,
  onClose: onClose,
  show: show
});

const mapDispatchToProps = () => ({
  stopK8sWatch: actions.stopK8sWatch,
  watchK8sList: actions.watchK8sList
});

export type StorageWizardProps = {
  onClose: () => void,
  watchK8sList: (id: string, query: object, kind: object) => void,
  stopK8sWatch: (id: string) => void,
  k8s: any,
  show: boolean
};

export type Storage = {
  name: string,
  type: string,
  parameters: any,
  reclaim: string
};

export type StorageClass = {
  metadata: object,
  provisioner: string,
  parameters: object,
  reclaimPolicy?: string
};

export type StorageWizardState = {
  showModal: boolean,
  activeStepIndex: number,
  newStorage: Storage,
  nameValid: string,
  nameTouched: boolean,
  nextStepDisabled: boolean,
  loading: boolean,
  error: any
};

export type Resources = {
  loaded: boolean,
  data: any[],
  loadError: string
};

export default connect(mapStateToProps, mapDispatchToProps)(StorageWizard);
/* eslint-enable no-undef */

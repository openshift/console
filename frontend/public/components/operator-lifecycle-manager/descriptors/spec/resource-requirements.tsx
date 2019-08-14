import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';

import { withHandlePromise } from '../../../utils';
import { k8sUpdate, referenceFor, K8sKind, K8sResourceKind } from '../../../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../../../factory/modal';
import { RootState } from '../../../../redux';

export const ResourceRequirements: React.FC<ResourceRequirementsProps> = (props) => {
  const {cpu, memory, onChangeCPU, onChangeMemory, path = ''} = props;

  return <div className="row co-m-form-row">
    <div className="col-xs-5">
      <label style={{fontWeight: 300}} className="text-muted text-uppercase" htmlFor={`${path}.cpu`}>CPU cores</label>
      <input value={cpu} onChange={e => onChangeCPU(e.target.value)} id={`${path}.cpu`} name="cpu" type="text" className="pf-c-form-control" placeholder="500m" />
    </div>
    <div className="col-xs-5">
      <label style={{fontWeight: 300}} className="text-muted text-uppercase" htmlFor={`${path}.memory`}>Memory</label>
      <input value={memory} onChange={e => onChangeMemory(e.target.value)} id={`${path}.memory`} name="memory" type="text" className="pf-c-form-control" placeholder="50Mi" />
    </div>
  </div>;
};

export const ResourceRequirementsModal = withHandlePromise((props: ResourceRequirementsModalProps) => {
  const {obj, path, type, model} = props;
  const [cpu, setCPU] = React.useState<string>(_.get(obj.spec, `${path}.${type}.cpu`, ''));
  const [memory, setMemory] = React.useState<string>(_.get(obj.spec, `${path}.${type}.memory`, ''));

  const submit = (e) => {
    e.preventDefault();

    let newObj = _.cloneDeep(obj);
    if (cpu !== '' || memory !== '') {
      newObj = _.set(newObj, `spec.${path}.${type}`, {cpu, memory});
    }

    return props.handlePromise(k8sUpdate(model, newObj)).then(props.close);
  };

  return <form onSubmit={e => submit(e)} className="modal-content">
    <ModalTitle>{props.title}</ModalTitle>
    <ModalBody>
      <div className="row co-m-form-row">
        <div className="col-sm-12">{props.description}</div>
      </div>
      <ResourceRequirements cpu={cpu} memory={memory} onChangeCPU={setCPU} onChangeMemory={setMemory} path={path} />
    </ModalBody>
    <ModalSubmitFooter errorMessage={props.errorMessage} inProgress={props.inProgress} submitText="Save" cancel={props.cancel} />
  </form>;
});

const stateToProps = ({k8s}: RootState, {obj}) => ({
  model: k8s.getIn(['RESOURCES', 'models', referenceFor(obj)]) as K8sKind,
});

export const ResourceRequirementsModalLink = connect(stateToProps)((props: ResourceRequirementsModalLinkProps) => {
  const {obj, type, path, model} = props;
  const {cpu, memory} = _.get(obj.spec, `${path}.${type}`, {cpu: 'none', memory: 'none'});

  const onClick = () => {
    const modal = createModalLauncher(ResourceRequirementsModal);
    const description = `Define the resource ${type} for this ${obj.kind} instance.`;
    const title = `${obj.kind} Resource ${_.capitalize(type)}`;

    return modal({title, description, obj, model, type, path});
  };

  return <button type="button" className="btn btn-link co-modal-btn-link" onClick={onClick}>{`CPU: ${cpu}, Memory: ${memory}`}</button>;
});

export type ResourceRequirementsModalProps = {
  title: string;
  description: string;
  obj: K8sResourceKind;
  model: K8sKind;
  type: 'requests' | 'limits';
  path: string;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};

export type ResourceRequirementsProps = {
  cpu: string;
  memory: string;
  onChangeCPU: (value: string) => void;
  onChangeMemory: (value: string) => void;
  path?: string;
};

export type ResourceRequirementsModalLinkProps = {
  obj: K8sResourceKind;
  model: K8sKind;
  type: 'requests' | 'limits';
  path: string;
};

ResourceRequirements.displayName = 'ResourceRequirements';
ResourceRequirementsModalLink.displayName = 'ResourceRequirementsModalLink';
ResourceRequirementsModal.displayName = 'ResourceRequirementsModal';

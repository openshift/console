import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';

import { ClusterServiceVersionResourceKind } from '../../index';
import { withHandlePromise } from '../../../utils';
import { k8sUpdate, referenceFor, K8sKind } from '../../../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../../../factory/modal';
import { RootState } from '../../../../redux';

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
      <div className="row co-m-form-row">
        <div className="col-xs-5">
          <label style={{fontWeight: 300}} className="text-muted text-uppercase" htmlFor="cpu">CPU cores</label>
          <input value={cpu} onChange={e => setCPU(e.target.value)} name="cpu" type="text" className="form-control" style={{width: 150}} autoFocus placeholder="500m" />
        </div>
        <div className="col-xs-5">
          <label style={{fontWeight: 300}} className="text-muted text-uppercase" htmlFor="memory">Memory</label>
          <input value={memory} onChange={e => setMemory(e.target.value)} name="memory" type="text" className="form-control" style={{width: 150}} placeholder="50Mi" />
        </div>
      </div>
    </ModalBody>
    <ModalSubmitFooter errorMessage={props.errorMessage} inProgress={props.inProgress} submitText="Save" cancel={e => props.cancel(e)} />
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
  obj: ClusterServiceVersionResourceKind;
  model: K8sKind;
  type: 'requests' | 'limits';
  path: string;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel: (error: any) => void;
  close: () => void;
};

export type ResourceRequirementsModalLinkProps = {
  obj: ClusterServiceVersionResourceKind;
  model: K8sKind;
  type: 'requests' | 'limits';
  path: string;
};

ResourceRequirementsModalLink.displayName = 'ResourceRequirementsModalLink';
ResourceRequirementsModal.displayName = 'ResourceRequirementsModal';

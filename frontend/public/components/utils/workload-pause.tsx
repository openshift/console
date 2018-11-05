import * as React from 'react';
// eslint-disable-next-line no-unused-vars
import { K8sKind, k8sPatch, K8sResourceKind} from '../../module/k8s/index';
import { errorModal } from '../modals/index';

export const togglePaused = (model: K8sKind, obj: K8sResourceKind) => {
  const patch = [{
    path: '/spec/paused',
    op: 'add',
    value: !obj.spec.paused,
  }];

  return k8sPatch(model, obj, patch);
};

export const WorkloadPausedAlert = ({model, obj}) => {
  return <p className="alert alert-info">
    <span className="pficon pficon-info" aria-hidden="true"></span>
    <b>{obj.metadata.name} is paused.</b> This will stop any new rollouts or triggers from running until resumed.
    <button className="btn btn-link" type="button" onClick={() => togglePaused(model, obj).catch((err) => errorModal({error: err.message}))}>Resume Rollouts</button>
  </p>;
};

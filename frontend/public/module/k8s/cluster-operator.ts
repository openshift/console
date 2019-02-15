/* eslint-disable no-unused-vars, no-undef */
import * as _ from 'lodash-es';
import { K8sResourceKind } from '.';

export enum OperatorStatus {
  Available = 'Available',
  Updating = 'Updating',
  Failing = 'Failing',
  Unknown = 'Unknown',
}

export const getStatusAndMessage = (operator: K8sResourceKind) => {
  const conditions = _.get(operator, 'status.conditions');
  const failing: any = _.find(conditions, { type: 'Failing', status: 'True' });
  if (failing) {
    return { status: OperatorStatus.Failing, message: failing.message };
  }

  const progressing: any = _.find(conditions, { type: 'Progressing', status: 'True' });
  if (progressing) {
    return { status: OperatorStatus.Updating, message: progressing.message };
  }

  const available: any = _.find(conditions, { type: 'Available', status: 'True' });
  if (available) {
    return { status: OperatorStatus.Available, message: available.message };
  }

  return { status: OperatorStatus.Unknown, message: '' };
};

export const getClusterOperatorStatus = (operator: K8sResourceKind) => {
  const { status } = getStatusAndMessage(operator);
  return status;
};

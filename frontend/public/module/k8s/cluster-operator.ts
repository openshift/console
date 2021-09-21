import * as _ from 'lodash-es';
import { ClusterOperator, OperandVersion } from '.';

export enum OperatorStatus {
  Available = 'Available',
  Progressing = 'Progressing',
  Degraded = 'Degraded',
  CannotUpdate = 'Cannot update',
  Unknown = 'Unknown',
}

export const getStatusAndMessage = (operator: ClusterOperator) => {
  const conditions = _.get(operator, 'status.conditions');
  const cannotUpdate: any = _.find(conditions, { type: 'Upgradeable', status: 'False' });
  if (cannotUpdate) {
    return { status: OperatorStatus.CannotUpdate, message: cannotUpdate.message };
  }

  const degraded: any = _.find(conditions, { type: 'Degraded', status: 'True' });
  if (degraded) {
    return { status: OperatorStatus.Degraded, message: degraded.message };
  }

  const progressing: any = _.find(conditions, { type: 'Progressing', status: 'True' });
  if (progressing) {
    return { status: OperatorStatus.Progressing, message: progressing.message };
  }

  const available: any = _.find(conditions, { type: 'Available', status: 'True' });
  if (available) {
    return { status: OperatorStatus.Available, message: available.message };
  }

  return { status: OperatorStatus.Unknown, message: '' };
};

export const getClusterOperatorStatus = (operator: ClusterOperator) => {
  const { status } = getStatusAndMessage(operator);
  return status;
};

export const getClusterOperatorVersion = (operator: ClusterOperator) => {
  const versions: OperandVersion[] = _.get(operator, 'status.versions', []);
  const operatorVersion = _.find(versions, (v) => v.name === 'operator');
  return operatorVersion ? operatorVersion.version : '';
};

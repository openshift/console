import * as _ from 'lodash-es';
import { ClusterOperator, OperandVersion } from '.';

export enum OperatorStatus {
  Available = 'Available',
  Updating = 'Updating',
  Degraded = 'Degraded',
  Upgradeable = 'Not upgradeable',
  Unknown = 'Unknown',
}

export const getStatusAndMessage = (operator: ClusterOperator) => {
  const conditions = _.get(operator, 'status.conditions');
  const degraded: any = _.find(conditions, { type: 'Degraded', status: 'True' });
  if (degraded) {
    return { status: OperatorStatus.Degraded, message: degraded.message };
  }

  const progressing: any = _.find(conditions, { type: 'Progressing', status: 'True' });
  if (progressing) {
    return { status: OperatorStatus.Updating, message: progressing.message };
  }

  const upgradeable: any = _.find(conditions, { type: 'Upgradeable', status: 'False' });
  if (upgradeable) {
    return { status: OperatorStatus.Upgradeable, message: upgradeable.message };
  }

  const available: any = _.find(conditions, { type: 'Available', status: 'True' });
  if (available) {
    return { status: OperatorStatus.Available, message: available.message };
  }

  return { status: OperatorStatus.Unknown, message: '' };
};

export const hasNotUpgradeable = (operator: ClusterOperator) => {
  const conditions = _.get(operator, 'status.conditions');
  const upgradeable: any = _.find(conditions, { type: 'Upgradeable', status: 'False' });
  return upgradeable;
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

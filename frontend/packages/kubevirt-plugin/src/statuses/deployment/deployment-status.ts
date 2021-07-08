import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  getConditionReason,
  getStatusConditionOfType,
  isConditionStatusTrue,
} from '../../selectors/selectors';
import { DeploymentStatus } from './constants';

export const getStatus = (deployment: K8sResourceKind) => {
  const progressingCond = getStatusConditionOfType(deployment, 'Progressing');

  if (progressingCond) {
    const failureCond = getStatusConditionOfType(deployment, 'ReplicaFailure');
    const availableCond = getStatusConditionOfType(deployment, 'Available');
    const progressingReason = getConditionReason(progressingCond);
    if (isConditionStatusTrue(progressingCond) && !isConditionStatusTrue(failureCond)) {
      if (progressingReason === 'NewReplicaSetAvailable' && isConditionStatusTrue(availableCond)) {
        return { status: DeploymentStatus.ROLLOUT_COMPLETE, message: progressingReason };
      }

      return { status: DeploymentStatus.PROGRESSING, message: progressingReason };
    }
    return {
      status: DeploymentStatus.FAILED,
      message: getConditionReason(failureCond) || progressingReason,
    };
  }
  return null;
};

export const getDeploymentStatus = (deployment: K8sResourceKind) =>
  getStatus(deployment) || { status: DeploymentStatus.UNKNOWN };

export const getSimpleDeploymentStatus = (deployment) => getDeploymentStatus(deployment).status;

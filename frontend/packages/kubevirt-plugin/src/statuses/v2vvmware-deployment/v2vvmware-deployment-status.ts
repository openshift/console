import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { DeploymentStatus, getDeploymentStatus } from '../deployment';
import { getPodStatus, getSimplePodStatus, POD_STATUS_ALL_ERROR } from '../pod';
import { V2VVMWareDeploymentStatus } from './constants';

const getStatus = (deployment: K8sResourceKind, deploymentPods: PodKind[]) => {
  const deploymentStatus = getDeploymentStatus(deployment);

  if (deploymentPods && deploymentStatus.status === DeploymentStatus.PROGRESSING) {
    const failingPod = deploymentPods.find((pod) =>
      POD_STATUS_ALL_ERROR.includes(getSimplePodStatus(pod)),
    );

    if (failingPod) {
      return {
        status: V2VVMWareDeploymentStatus.POD_FAILED,
        pod: failingPod,
        message: getPodStatus(failingPod).message,
        deployment,
      };
    }
  }

  const mappedStatus = V2VVMWareDeploymentStatus.fromDeploymentStatus(deploymentStatus.status);

  if (mappedStatus) {
    return {
      ...deploymentStatus,
      status: mappedStatus,
      deployment,
    };
  }

  return null;
};

export const getV2vVMwareDeploymentStatus = (deployment, deploymentPods) =>
  getStatus(deployment, deploymentPods) || { status: V2VVMWareDeploymentStatus.UNKNOWN };

export const getSimpleV2vVMwareDeploymentStatus = (deployment, deploymentPods) =>
  getV2vVMwareDeploymentStatus(deployment, deploymentPods).status;

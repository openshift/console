import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { DeploymentStatus, getDeploymentStatus } from '../deployment';
import { getPodStatus, getSimplePodStatus, POD_STATUS_ALL_ERROR } from '../pod';
import { PodDeploymentStatus } from './constants';

const getStatus = (deployment: K8sResourceKind, deploymentPods: PodKind[]) => {
  const deploymentStatus = getDeploymentStatus(deployment);

  if (deploymentPods && deploymentStatus.status === DeploymentStatus.PROGRESSING) {
    const failingPod = deploymentPods.find((pod) =>
      POD_STATUS_ALL_ERROR.includes(getSimplePodStatus(pod)),
    );

    if (failingPod) {
      return {
        status: PodDeploymentStatus.POD_FAILED,
        pod: failingPod,
        message: getPodStatus(failingPod).message,
        deployment,
      };
    }
  }

  const mappedStatus = PodDeploymentStatus.fromDeploymentStatus(deploymentStatus.status);

  if (mappedStatus) {
    return {
      ...deploymentStatus,
      status: mappedStatus,
      deployment,
    };
  }

  return null;
};

export const getPodDeploymentStatus = (deployment, deploymentPods) =>
  getStatus(deployment, deploymentPods) || { status: PodDeploymentStatus.UNKNOWN };

export const getSimplePodDeploymentStatus = (deployment, deploymentPods) =>
  getPodDeploymentStatus(deployment, deploymentPods).status;

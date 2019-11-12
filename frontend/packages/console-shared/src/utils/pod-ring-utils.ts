import * as _ from 'lodash';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { PodRCData, PodRingResources, PodRingData } from '../types';
import { TransformResourceData } from './resource-utils';

const applyPods = (podsData: PodRingData, dc: PodRCData) => {
  const {
    pods,
    current,
    previous,
    isRollingOut,
    obj: {
      metadata: { uid },
    },
  } = dc;
  podsData[uid] = {
    pods,
    current,
    previous,
    isRollingOut,
  };
  return podsData;
};

export const transformPodRingData = (resources: PodRingResources, kind: string): PodRingData => {
  const deploymentKinds = {
    [DeploymentModel.kind]: 'deployments',
    [DeploymentConfigModel.kind]: 'deploymentConfigs',
  };

  const targetDeployment = deploymentKinds[kind];
  const transformResourceData = new TransformResourceData(resources);

  if (!targetDeployment) {
    throw new Error(`Invalid target deployment resource: (${targetDeployment})`);
  }
  if (_.isEmpty(resources[targetDeployment].data)) {
    return {};
  }

  const podsData: PodRingData = {};
  const resourceData = resources[targetDeployment].data;

  if (kind === DeploymentConfigModel.kind) {
    return transformResourceData
      .getPodsForDeploymentConfigs(resourceData)
      .reduce(applyPods, podsData);
  }

  if (kind === DeploymentModel.kind) {
    return transformResourceData.getPodsForDeployments(resourceData).reduce(applyPods, podsData);
  }
  return podsData;
};

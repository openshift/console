import * as _ from 'lodash';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PodRCData, PodRingResources, PodRingData } from '../types';
import { TransformResourceData } from './resource-utils';

type PodRingLabelType = {
  subTitle: string;
  title: string;
};

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

export const podRingLabel = (obj: K8sResourceKind, canScale: boolean): PodRingLabelType => {
  const {
    spec: { replicas },
    status: { availableReplicas },
  } = obj;

  const pluralize = replicas > 1 || replicas === 0 ? 'pods' : 'pod';
  const knativeSubtitle = canScale ? '' : 'to 0';
  const scalingSubtitle = !replicas ? knativeSubtitle : `scaling to ${replicas}`;

  return {
    title: availableReplicas || (canScale ? 'Scaled to 0' : 'Autoscaled'),
    subTitle: replicas !== availableReplicas ? scalingSubtitle : pluralize,
  };
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

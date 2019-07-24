import * as _ from 'lodash';
import { TransformPodData } from './pod-utils';

export const transformPodRingData = (resources, kind) => {
  const podsData = {};

  const deploymentKinds = {
    Deployment: 'deployments',
    DeploymentConfig: 'deploymentConfigs',
  };

  const targetDeployment = deploymentKinds[kind];

  const transformPodData = new TransformPodData(resources);

  if (!transformPodData.deploymentKindMap[targetDeployment]) {
    throw new Error(`Invalid target deployment resource: (${targetDeployment})`);
  }
  if (_.isEmpty(resources[targetDeployment].data)) {
    return {};
  }

  const targetDeploymentsKind = transformPodData.deploymentKindMap[targetDeployment].dcKind;
  const resourceData = resources[targetDeployment].data;

  _.forEach(resourceData, (d) => {
    d.kind = targetDeploymentsKind;
    const dUID = _.get(d, 'metadata.uid');
    const replicationControllers = transformPodData.getReplicationControllers(d, targetDeployment);
    const current = _.head(replicationControllers);
    const previous = _.nth(replicationControllers, 1);
    const currentPods = current
      ? transformPodData.transformPods(transformPodData.getPods(current, d))
      : [];
    const previousPods = previous
      ? transformPodData.transformPods(transformPodData.getPods(previous, d))
      : [];

    podsData[dUID] = {
      pods: [...currentPods, ...previousPods],
    };
  });
  return podsData;
};

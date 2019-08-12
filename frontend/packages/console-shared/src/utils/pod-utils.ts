import * as _ from 'lodash';
import {
  K8sResourceKind,
  K8sKind,
  SelfSubjectAccessReviewKind,
  AccessReviewResourceAttributes,
} from '@console/internal/module/k8s';
import { checkAccess } from '@console/internal/components/utils';
import {
  DeploymentModel,
  DaemonSetModel,
  StatefulSetModel,
  DeploymentConfigModel,
} from '@console/internal/models';
import { ResourceProps, PodDataResources } from '../types/pod';

export const podColor = {
  Running: '#0066CC',
  'Not Ready': '#519DE9',
  Warning: '#F0AB00',
  Empty: '#FFFFFF',
  Failed: '#CC0000',
  Pending: '#8BC1F7',
  Succceeded: '#519149',
  Terminating: '#002F5D',
  Unknown: '#A18FFF',
  'Scaled to 0': '#FFFFFF',
  Idle: '#FFFFFF',
  'Autoscaled to 0': '#FFFFFF',
};

export const podStatus = Object.keys(podColor);

const isContainerFailedFilter = (containerStatus) => {
  return containerStatus.state.terminated && containerStatus.state.terminated.exitCode !== 0;
};

const isContainerLoopingFilter = (containerStatus) => {
  return (
    containerStatus.state.waiting && containerStatus.state.waiting.reason === 'CrashLoopBackOff'
  );
};

const numContainersReadyFilter = (pod) => {
  let numReady = 0;
  _.forEach(pod.status.containerStatuses, (status) => {
    if (status.ready) {
      numReady++;
    }
  });
  return numReady;
};

const isReady = (pod) => {
  const numReady = numContainersReadyFilter(pod);
  const total = _.size(pod.spec.containers);

  return numReady === total;
};

const podWarnings = (pod) => {
  if (pod.status.phase === 'Running' && pod.status.containerStatuses) {
    return _.map(pod.status.containerStatuses, (containerStatus) => {
      if (!containerStatus.state) {
        return null;
      }

      if (isContainerFailedFilter(containerStatus)) {
        if (_.has(pod, ['metadata', 'deletionTimestamp'])) {
          return 'Failed';
        }
        return 'Warning';
      }
      if (isContainerLoopingFilter(containerStatus)) {
        return 'Failed';
      }
      return null;
    }).filter((x) => x);
  }
  return null;
};

export const getPodStatus = (pod) => {
  if (_.has(pod, ['metadata', 'deletionTimestamp'])) {
    return 'Terminating';
  }
  const warnings = podWarnings(pod);
  if (warnings !== null && warnings.length) {
    if (warnings.includes('Failed')) {
      return 'Failed';
    }
    return 'Warning';
  }
  if (pod.status.phase === 'Running' && !isReady(pod)) {
    return 'Not Ready';
  }
  return _.get(pod, 'status.phase', 'Unknown');
};

export const calculateRadius = (size: number) => {
  const radius = size / 2;
  const podStatusStrokeWidth = (8 / 104) * size;
  const podStatusInset = (5 / 104) * size;
  const podStatusOuterRadius = radius - podStatusInset;
  const podStatusInnerRadius = podStatusOuterRadius - podStatusStrokeWidth;
  const decoratorRadius = radius * 0.25;

  return {
    radius,
    podStatusInnerRadius,
    podStatusOuterRadius,
    decoratorRadius,
  };
};

export const checkPodEditAccess = (
  resource: K8sResourceKind,
  resourceKind: K8sKind,
  impersonate: string,
): Promise<SelfSubjectAccessReviewKind> => {
  if (_.isEmpty(resource) || !resourceKind) {
    return Promise.resolve(null);
  }
  const { name, namespace } = resource.metadata;
  const resourceAttributes: AccessReviewResourceAttributes = {
    group: resourceKind.apiGroup,
    resource: resourceKind.plural,
    verb: 'patch',
    name,
    namespace,
  };
  return checkAccess(resourceAttributes, impersonate);
};

export class TransformPodData {
  // eslint-disable-next-line
  constructor(private resources: PodDataResources) {}

  public deploymentKindMap = {
    deployments: {
      dcKind: DeploymentModel.kind,
      rcKind: 'ReplicaSet',
      rController: 'replicasets',
    },
    daemonSets: {
      dcKind: DaemonSetModel.kind,
      rcKind: 'ReplicaSet',
      rController: 'replicasets',
    },
    statefulSets: {
      dcKind: StatefulSetModel.kind,
      rcKind: 'ReplicaSet',
      rController: 'replicasets',
    },
    deploymentConfigs: {
      dcKind: DeploymentConfigModel.kind,
      rcKind: 'ReplicationController',
      rController: 'replicationControllers',
    },
  };

  public transformPods = (pods): K8sResourceKind[] => {
    return _.map(pods, (pod) =>
      _.merge(_.pick(pod, 'metadata', 'status', 'spec.containers'), {
        id: pod.metadata.uid,
        name: pod.metadata.name,
        kind: 'Pod',
      }),
    );
  };

  /**
   * sort the deployment version
   */
  private sortByDeploymentVersion = (
    replicationControllers: ResourceProps[],
    descending: boolean,
  ) => {
    const version = 'openshift.io/deployment-config.latest-version';
    const compareDeployments = (left, right) => {
      const leftVersion = parseInt(_.get(left, version), 10);
      const rightVersion = parseInt(_.get(right, version), 10);

      // Fall back to sorting by name if right Name no deployment versions.
      let leftName: string;
      let rightName: string;
      if (!_.isFinite(leftVersion) && !_.isFinite(rightVersion)) {
        leftName = _.get(left, 'metadata.name', '');
        rightName = _.get(right, 'metadata.name', '');
        return descending ? rightName.localeCompare(leftName) : leftName.localeCompare(rightName);
      }

      if (!leftVersion) {
        return descending ? 1 : -1;
      }

      if (!rightVersion) {
        return descending ? -1 : 1;
      }

      return descending ? rightVersion - leftVersion : leftVersion - rightVersion;
    };

    return _.toArray(replicationControllers).sort(compareDeployments);
  };

  /**
   * fetches all the replication controllers from the deployment
   * @param deploymentConfig
   * @param targetDeployment 'deployments' || 'deploymentConfigs'
   */
  public getReplicationControllers(
    deploymentConfig: ResourceProps,
    targetDeployment: string,
  ): ResourceProps[] {
    // Get the current replication controller or replicaset
    const targetReplicationControllersKind = this.deploymentKindMap[targetDeployment].rcKind;
    const replicationControllers = this.deploymentKindMap[targetDeployment].rController;
    const dcUID = _.get(deploymentConfig, 'metadata.uid');

    const rControllers = _.filter(
      this.resources[replicationControllers].data,
      (replicationController) => {
        return _.some(_.get(replicationController, 'metadata.ownerReferences'), {
          uid: dcUID,
          controller: true,
        });
      },
    );
    const sortedControllers = this.sortByDeploymentVersion(rControllers, true);
    return _.size(sortedControllers)
      ? _.map(sortedControllers, (nextController) =>
          _.merge(nextController, {
            kind: targetReplicationControllersKind,
          }),
        )
      : ([{ kind: targetReplicationControllersKind }] as ResourceProps[]);
  }

  /**
   * check if config is knative serving resource.
   * @param configRes
   * @param properties
   */
  public isKnativeServing(configRes: ResourceProps, properties: string): boolean {
    const deploymentsLabels = _.get(configRes, properties) || {};
    return !!deploymentsLabels['serving.knative.dev/configuration'];
  }

  /**
   * check if the deployment/deploymentconfig is idled.
   * @param deploymentConfig
   */
  public isIdled(deploymentConfig: ResourceProps): boolean {
    return !!_.get(
      deploymentConfig,
      'metadata.annotations["idling.alpha.openshift.io/idled-at"]',
      false,
    );
  }

  /**
   * Get all the pods from a replication controller or a replicaset.
   * @param replicationController
   */
  public getPods(replicationController: ResourceProps, deploymentConfig: ResourceProps) {
    const deploymentCondition = {
      uid: _.get(replicationController, 'metadata.uid'),
      controller: true,
    };
    const dcCondition = {
      uid: _.get(deploymentConfig, 'metadata.uid'),
    };
    const condition =
      deploymentConfig.kind === DaemonSetModel.kind ||
      deploymentConfig.kind === StatefulSetModel.kind
        ? dcCondition
        : deploymentCondition;
    const dcPodsData = _.filter(this.resources.pods.data, (pod) => {
      return _.some(_.get(pod, 'metadata.ownerReferences'), condition);
    });
    if (
      dcPodsData &&
      !dcPodsData.length &&
      this.isKnativeServing(replicationController, 'metadata.labels')
    ) {
      return [
        {
          ..._.pick(replicationController, 'metadata', 'status', 'spec'),
          status: { phase: 'Autoscaled to 0' },
        },
      ];
    }
    if (dcPodsData && !dcPodsData.length && this.isIdled(deploymentConfig)) {
      return [
        {
          ..._.pick(replicationController, 'metadata', 'status', 'spec'),
          status: { phase: 'Idle' },
        },
      ];
    }
    return dcPodsData;
  }
}

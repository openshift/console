import * as _ from 'lodash';
import {
  K8sResourceKind,
  K8sKind,
  SelfSubjectAccessReviewKind,
  AccessReviewResourceAttributes,
} from '@console/internal/module/k8s';
import { checkAccess } from '@console/internal/components/utils/rbac';
import { podColor, AllPodStatus, DEPLOYMENT_STRATEGY, DEPLOYMENT_PHASE } from '../constants';
import { ExtPodKind } from '../types/pod';
import { PodControllerOverviewItem, DeploymentStrategy } from '../types';

export const podStatus = Object.keys(podColor);

const isContainerFailedFilter = (containerStatus) => {
  return containerStatus.state.terminated && containerStatus.state.terminated.exitCode !== 0;
};

export const isContainerLoopingFilter = (containerStatus) => {
  return (
    containerStatus.state.waiting && containerStatus.state.waiting.reason === 'CrashLoopBackOff'
  );
};

const numContainersReadyFilter = (pod) => {
  const {
    status: { containerStatuses },
  } = pod;
  let numReady = 0;
  _.forEach(containerStatuses, (status) => {
    if (status.ready) {
      numReady++;
    }
  });
  return numReady;
};

const isReady = (pod) => {
  const {
    spec: { containers },
  } = pod;
  const numReady = numContainersReadyFilter(pod);
  const total = _.size(containers);

  return numReady === total;
};

const podWarnings = (pod) => {
  const {
    status: { phase, containerStatuses },
  } = pod;
  if (phase === AllPodStatus.Running && containerStatuses) {
    return _.map(containerStatuses, (containerStatus) => {
      if (!containerStatus.state) {
        return null;
      }

      if (isContainerFailedFilter(containerStatus)) {
        if (_.has(pod, ['metadata', 'deletionTimestamp'])) {
          return AllPodStatus.Failed;
        }
        return AllPodStatus.Warning;
      }
      if (isContainerLoopingFilter(containerStatus)) {
        return AllPodStatus.CrashLoopBackOff;
      }
      return null;
    }).filter((x) => x);
  }
  return null;
};

export const getPodStatus = (pod) => {
  if (_.has(pod, ['metadata', 'deletionTimestamp'])) {
    return AllPodStatus.Terminating;
  }
  const warnings = podWarnings(pod);
  if (warnings !== null && warnings.length) {
    if (warnings.includes(AllPodStatus.CrashLoopBackOff)) {
      return AllPodStatus.CrashLoopBackOff;
    }
    if (warnings.includes(AllPodStatus.Failed)) {
      return AllPodStatus.Failed;
    }
    return AllPodStatus.Warning;
  }
  const phase = _.get(pod, ['status', 'phase'], AllPodStatus.Unknown);
  if (phase === AllPodStatus.Running && !isReady(pod)) {
    return AllPodStatus.NotReady;
  }
  return phase;
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
    podStatusStrokeWidth,
    podStatusInset,
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

/**
 * check if config is knative serving resource.
 * @param configRes
 * @param properties
 */
export const isKnativeServing = (configRes: K8sResourceKind, properties: string): boolean => {
  const deploymentsLabels = _.get(configRes, properties) || {};
  return !!deploymentsLabels['serving.knative.dev/configuration'];
};

/**
 * check if the deployment/deploymentconfig is idled.
 * @param deploymentConfig
 */
export const isIdled = (deploymentConfig: K8sResourceKind): boolean => {
  return !!_.get(
    deploymentConfig,
    'metadata.annotations["idling.alpha.openshift.io/idled-at"]',
    false,
  );
};

const getScalingUp = (dc: K8sResourceKind): ExtPodKind => {
  return {
    ..._.pick(dc, 'metadata'),
    status: {
      phase: AllPodStatus.ScalingUp,
    },
  };
};

export const podDataInProgress = (
  dc: K8sResourceKind,
  current: PodControllerOverviewItem,
  isRollingOut: boolean,
): boolean => {
  const strategy: DeploymentStrategy = dc?.spec?.strategy?.type;
  return (
    current?.phase !== DEPLOYMENT_PHASE.complete &&
    (strategy === DEPLOYMENT_STRATEGY.recreate || strategy === DEPLOYMENT_STRATEGY.rolling) &&
    isRollingOut
  );
};

export const getPodData = (
  dc: K8sResourceKind,
  pods: ExtPodKind[],
  current: PodControllerOverviewItem,
  previous: PodControllerOverviewItem,
  isRollingOut: boolean,
): { inProgressDeploymentData: ExtPodKind[] | null; completedDeploymentData: ExtPodKind[] } => {
  const strategy: DeploymentStrategy = _.get(dc, ['spec', 'strategy', 'type'], null);
  const currentDeploymentphase = current && current.phase;
  const currentPods = current && current.pods;
  const previousPods = previous && previous.pods;
  // DaemonSets and StatefulSets
  if (!strategy) return { inProgressDeploymentData: null, completedDeploymentData: pods };

  // Scaling no. of pods
  if (currentDeploymentphase === DEPLOYMENT_PHASE.complete) {
    return { inProgressDeploymentData: null, completedDeploymentData: currentPods };
  }

  // Deploy - Rolling - Recreate
  if (
    (strategy === DEPLOYMENT_STRATEGY.recreate ||
      strategy === DEPLOYMENT_STRATEGY.rolling ||
      strategy === DEPLOYMENT_STRATEGY.rollingUpdate) &&
    isRollingOut
  ) {
    return {
      inProgressDeploymentData: currentPods,
      completedDeploymentData: previousPods,
    };
  }
  // if build is not finished show `Scaling Up` on pod phase
  if (!current && !previous) {
    return { inProgressDeploymentData: null, completedDeploymentData: [getScalingUp(dc)] };
  }
  return { inProgressDeploymentData: null, completedDeploymentData: pods };
};

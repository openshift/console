import * as _ from 'lodash';
import { ReplicationControllerModel, DeploymentConfigModel } from '@console/internal/models';
import {
  K8sResourceKind,
  K8sResourceCommon,
  PodKind,
  K8sKind,
  apiVersionForModel,
} from '@console/internal/module/k8s';
import { getAnnotation } from '../selectors';
import { ExtPodKind, OverviewItemAlerts, AllPodStatus } from '../types/pod';

// Annotation key for deployment config latest version
export const DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION =
  'openshift.io/deployment-config.latest-version';

// Annotation key for deployment phase
export const DEPLOYMENT_PHASE_ANNOTATION = 'openshift.io/deployment.phase';

export const CONTAINER_WAITING_STATE_ERROR_REASONS = [
  'CrashLoopBackOff',
  'ErrImagePull',
  'ImagePullBackOff',
];

export enum DEPLOYMENT_PHASE {
  new = 'New',
  running = 'Running',
  pending = 'Pending',
  complete = 'Complete',
  failed = 'Failed',
  cancelled = 'Cancelled',
}

export type PodControllerOverviewItem = {
  alerts: OverviewItemAlerts;
  revision: number;
  obj: K8sResourceKind;
  phase?: string;
  pods: ExtPodKind[];
};

export const getOwnedResources = <T extends K8sResourceKind>(
  obj: K8sResourceKind,
  resources: T[],
): T[] => {
  const uid = obj?.metadata?.uid;
  if (!uid) {
    return [];
  }
  return _.filter(resources, ({ metadata: { ownerReferences } }) => {
    return _.some(ownerReferences, {
      uid,
      controller: true,
    });
  });
};

const getDeploymentPhase = (rc: K8sResourceKind): DEPLOYMENT_PHASE =>
  _.get(rc, ['metadata', 'annotations', DEPLOYMENT_PHASE_ANNOTATION]);

export const getOwnerNameByKind = (obj: K8sResourceCommon, kind: K8sKind): string => {
  return obj?.metadata?.ownerReferences?.find(
    (ref) =>
      ref.kind === kind.kind &&
      ((!kind.apiGroup && ref.apiVersion === 'v1') ||
        ref.apiVersion?.startsWith(`${kind.apiGroup}/`)),
  )?.name;
};

const isDeploymentInProgressOrCompleted = (resource: K8sResourceKind): boolean => {
  return (
    [
      DEPLOYMENT_PHASE.new,
      DEPLOYMENT_PHASE.pending,
      DEPLOYMENT_PHASE.running,
      DEPLOYMENT_PHASE.complete,
    ].indexOf(getDeploymentPhase(resource)) > -1
  );
};

const sortByRevision = (
  replicators: K8sResourceKind[],
  getRevision: Function,
  descending: boolean = true,
): K8sResourceKind[] => {
  const compare = (left, right) => {
    const leftVersion = getRevision(left);
    const rightVersion = getRevision(right);
    if (!_.isFinite(leftVersion) && !_.isFinite(rightVersion)) {
      const leftName = _.get(left, 'metadata.name', '');
      const rightName = _.get(right, 'metadata.name', '');
      if (descending) {
        return rightName.localeCompare(leftName);
      }
      return leftName.localeCompare(rightName);
    }

    if (!leftVersion) {
      return descending ? 1 : -1;
    }

    if (!rightVersion) {
      return descending ? -1 : 1;
    }

    if (descending) {
      return rightVersion - leftVersion;
    }

    return leftVersion - rightVersion;
  };

  return _.toArray(replicators).sort(compare);
};

export const getDeploymentConfigVersion = (obj: K8sResourceCommon): number => {
  const version = getAnnotation(obj, DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION);
  return version && parseInt(version, 10);
};

const isReplicationControllerVisible = (resource: K8sResourceKind): boolean => {
  return !!_.get(resource, ['status', 'replicas'], isDeploymentInProgressOrCompleted(resource));
};

const sortReplicationControllersByRevision = (
  replicationControllers: K8sResourceKind[],
): K8sResourceKind[] => {
  return sortByRevision(replicationControllers, getDeploymentConfigVersion);
};

export const isIdled = (deploymentConfig: K8sResourceKind): boolean => {
  return !!_.get(
    deploymentConfig,
    'metadata.annotations["idling.alpha.openshift.io/idled-at"]',
    false,
  );
};

const getIdledStatus = (
  rc: PodControllerOverviewItem,
  dc: K8sResourceKind,
): PodControllerOverviewItem => {
  const { pods } = rc;
  if (pods && !pods.length && isIdled(dc)) {
    return {
      ...rc,
      // FIXME: This is not a PodKind.
      pods: [
        {
          ..._.pick(rc.obj, 'metadata', 'status', 'spec'),
          status: { phase: AllPodStatus.Idle },
        },
      ],
    };
  }
  return rc;
};

// Only show an alert once if multiple pods have the same error for the same owner.
const podAlertKey = (alert: any, pod: K8sResourceKind, containerName: string = 'all'): string => {
  const id = _.get(pod, 'metadata.ownerReferences[0].uid', pod.metadata.uid);
  return `${alert}--${id}--${containerName}`;
};

const getPodAlerts = (pod: K8sResourceKind): OverviewItemAlerts => {
  const alerts = {};
  const statuses = [
    ..._.get(pod, 'status.initContainerStatuses', []),
    ..._.get(pod, 'status.containerStatuses', []),
  ];
  statuses.forEach((status) => {
    const { name, state } = status;
    const waitingReason = _.get(state, 'waiting.reason');
    if (CONTAINER_WAITING_STATE_ERROR_REASONS.includes(waitingReason)) {
      const key = podAlertKey(waitingReason, pod, name);
      const message = state.waiting.message || waitingReason;
      alerts[key] = { severity: 'error', message };
    }
  });

  _.get(pod, 'status.conditions', []).forEach((condition) => {
    const { type, status, reason, message } = condition;
    if (type === 'PodScheduled' && status === 'False' && reason === 'Unschedulable') {
      // eslint-disable-next-line
      const key = podAlertKey(reason, pod);
      alerts[key] = {
        severity: 'error',
        message: `${reason}: ${message}`,
      };
    }
  });

  return alerts;
};

export const getPodsForResource = (resource: K8sResourceKind, resources: any): PodKind[] => {
  const { pods } = resources;
  return getOwnedResources(resource, pods?.data);
};

const combinePodAlerts = (pods: K8sResourceKind[]): OverviewItemAlerts =>
  _.reduce(
    pods,
    (acc, pod) => ({
      ...acc,
      ...getPodAlerts(pod),
    }),
    {},
  );

export const getReplicationControllerAlerts = (rc: K8sResourceKind): OverviewItemAlerts => {
  const phase = getDeploymentPhase(rc);
  const version = getDeploymentConfigVersion(rc);
  const name = getOwnerNameByKind(rc, DeploymentConfigModel);
  const label = _.isFinite(version) ? `${name} #${version}` : rc.metadata.name;
  const key = `${rc.metadata.uid}--Rollout${phase}`;
  switch (phase) {
    case 'Cancelled':
      return {
        [key]: {
          severity: 'info',
          message: `Rollout ${label} was cancelled.`,
        },
      };
    case 'Failed':
      return {
        [key]: {
          severity: 'error',
          message: `Rollout ${label} failed.`,
        },
      };
    default:
      return {};
  }
};

export const toReplicationControllerItem = (
  rc: K8sResourceKind,
  resources: any,
): PodControllerOverviewItem => {
  const pods = getPodsForResource(rc, resources);
  const alerts = {
    ...combinePodAlerts(pods),
    ...getReplicationControllerAlerts(rc),
  };
  const phase = getDeploymentPhase(rc);
  const revision = getDeploymentConfigVersion(rc);
  const obj = {
    ...rc,
    apiVersion: apiVersionForModel(ReplicationControllerModel),
    kind: ReplicationControllerModel.kind,
  };
  return {
    alerts,
    obj,
    phase,
    pods,
    revision,
  };
};

export const getReplicationControllersForResource = (
  resource: K8sResourceKind,
  resources: any,
): {
  mostRecentRC: K8sResourceKind;
  visibleReplicationControllers: PodControllerOverviewItem[];
} => {
  const { replicationControllers } = resources;
  if (!replicationControllers?.data?.length) {
    return {
      mostRecentRC: null,
      visibleReplicationControllers: [],
    };
  }
  const ownedRC = getOwnedResources(resource, replicationControllers.data);
  const sortedRCs = sortReplicationControllersByRevision(ownedRC);
  // get the most recent RCs included failed or canceled to show warnings
  const [mostRecentRC] = sortedRCs;
  // get the visible RCs except failed/canceled
  const visibleReplicationControllers = _.filter(sortedRCs, isReplicationControllerVisible);
  return {
    mostRecentRC,
    visibleReplicationControllers: visibleReplicationControllers.map((rc) =>
      getIdledStatus(toReplicationControllerItem(rc, resources), resource),
    ),
  };
};

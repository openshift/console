import * as _ from 'lodash';
import { alertMessageResources } from '@console/internal/components/monitoring/alerting';
import { Alert, Alerts } from '@console/internal/components/monitoring/types';
import {
  ReplicationControllerModel,
  ReplicaSetModel,
  StatefulSetModel,
  JobModel,
  DeploymentConfigModel,
} from '@console/internal/models';
import {
  K8sResourceKind,
  K8sResourceCommon,
  LabelSelector,
  PodKind,
  CronJobKind,
  PodTemplate,
  RouteKind,
  apiVersionForModel,
  K8sKind,
  JobKind,
} from '@console/internal/module/k8s';
import { getBuildNumber } from '@console/internal/module/k8s/builds';
import {
  DEPLOYMENT_REVISION_ANNOTATION,
  DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION,
  TRIGGERS_ANNOTATION,
  DEPLOYMENT_PHASE_ANNOTATION,
  CONTAINER_WAITING_STATE_ERROR_REASONS,
  DEPLOYMENT_STRATEGY,
  DEPLOYMENT_PHASE,
  AllPodStatus,
} from '../constants';
import {
  BuildConfigOverviewItem,
  OverviewItemAlerts,
  PodControllerOverviewItem,
  OverviewItem,
  ExtPodKind,
  LimitsData,
} from '../types';
import { doesHpaMatch } from './hpa-utils';
import { isKnativeServing, isIdled } from './pod-utils';

export const WORKLOAD_TYPES = [
  'deployments',
  'deploymentConfigs',
  'daemonSets',
  'statefulSets',
  'jobs',
  'cronJobs',
  'pods',
];

export const MONITORABLE_KINDS = ['Deployment', 'DeploymentConfig', 'StatefulSet', 'DaemonSet'];

type ResourceItem = {
  [key: string]: K8sResourceKind[];
};

export type ResourceUtil = (obj: K8sResourceKind, props: any) => ResourceItem | undefined;

export const getResourcePausedAlert = (resource: K8sResourceKind): OverviewItemAlerts => {
  if (!resource.spec.paused) {
    return {};
  }
  return {
    [`${resource.metadata.uid}--Paused`]: {
      severity: 'info',
      message: `${resource.metadata.name} is paused.`,
    },
  };
};

export const getBuildAlerts = (buildConfigs: BuildConfigOverviewItem[]): OverviewItemAlerts => {
  const buildAlerts = {};
  const addAlert = (build: K8sResourceKind, buildPhase: string) =>
    _.set(buildAlerts, `${build.metadata.uid}--build${buildPhase}`, {
      severity: `build${buildPhase}`,
      message: _.get(build, ['status', 'message'], buildPhase),
    });

  _.each(buildConfigs, (bc) => {
    let seenComplete = false;
    // Requires builds to be sorted by most recent first.
    _.each(bc.builds, (build: K8sResourceKind) => {
      const buildPhase = _.get(build, ['status', 'phase']);
      switch (buildPhase) {
        case 'Complete':
          seenComplete = true;
          break;
        case 'Failed':
        case 'Error':
          if (!seenComplete) {
            // show failure/error
            addAlert(build, buildPhase);
          }
          break;
        case 'New':
        case 'Pending':
        case 'Running':
          // show new/pending/running
          addAlert(build, buildPhase);
          break;
        default:
          break;
      }
    });
  });

  return buildAlerts;
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

const getAnnotation = (obj: K8sResourceCommon, annotation: string): string => {
  return obj?.metadata?.annotations?.[annotation];
};

export const getDeploymentRevision = (obj: K8sResourceCommon): number => {
  const revision = getAnnotation(obj, DEPLOYMENT_REVISION_ANNOTATION);
  return revision && parseInt(revision, 10);
};

export const getDeploymentConfigVersion = (obj: K8sResourceCommon): number => {
  const version = getAnnotation(obj, DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION);
  return version && parseInt(version, 10);
};

export const getOwnerNameByKind = (obj: K8sResourceCommon, kind: K8sKind): string => {
  return obj?.metadata?.ownerReferences?.find(
    (ref) =>
      ref.kind === kind.kind &&
      ((!kind.apiGroup && ref.apiVersion === 'v1') ||
        ref.apiVersion?.startsWith(`${kind.apiGroup}/`)),
  )?.name;
};

export const sortReplicaSetsByRevision = (replicaSets: K8sResourceKind[]): K8sResourceKind[] => {
  return sortByRevision(replicaSets, getDeploymentRevision);
};

const sortReplicationControllersByRevision = (
  replicationControllers: K8sResourceKind[],
): K8sResourceKind[] => {
  return sortByRevision(replicationControllers, getDeploymentConfigVersion);
};

export const sortBuilds = (builds: K8sResourceKind[]): K8sResourceKind[] => {
  const byCreationTime = (left, right) => {
    const leftCreationTime = new Date(_.get(left, 'metadata.creationTimestamp', Date.now()));
    const rightCreationTime = new Date(_.get(right, 'metadata.creationTimestamp', Date.now()));
    return rightCreationTime.getMilliseconds() - leftCreationTime.getMilliseconds();
  };

  const byBuildNumber = (left, right) => {
    const leftBuildNumber = getBuildNumber(left);
    const rightBuildNumber = getBuildNumber(right);
    if (!_.isFinite(leftBuildNumber) || !_.isFinite(rightBuildNumber)) {
      return byCreationTime(left, right);
    }
    return rightBuildNumber - leftBuildNumber;
  };

  return [...builds].sort(byBuildNumber);
};

// FIXME use parseJSONAnnotation helper
const getAnnotatedTriggers = (obj: K8sResourceKind) => {
  const triggersJSON = getAnnotation(obj, TRIGGERS_ANNOTATION) || '[]';
  try {
    return JSON.parse(triggersJSON);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.error('Error parsing triggers annotation', e);
    return [];
  }
};

const getDeploymentPhase = (rc: K8sResourceKind): DEPLOYMENT_PHASE =>
  _.get(rc, ['metadata', 'annotations', DEPLOYMENT_PHASE_ANNOTATION]);

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

const getAutoscaledPods = (rc: K8sResourceKind): ExtPodKind[] => {
  return [
    {
      ..._.pick(rc, 'metadata', 'status', 'spec'),
      status: { phase: AllPodStatus.AutoScaledTo0 },
    },
  ];
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

export const getRolloutStatus = (
  dc: K8sResourceKind,
  current: PodControllerOverviewItem,
  previous: PodControllerOverviewItem,
): boolean => {
  const strategy = dc?.spec?.strategy?.type;
  const phase = current && current.phase;
  const currentRC = current && current.obj;
  const notFailedOrCancelled =
    phase !== DEPLOYMENT_PHASE.cancelled && phase !== DEPLOYMENT_PHASE.failed;
  if (strategy === DEPLOYMENT_STRATEGY.recreate) {
    return (
      notFailedOrCancelled &&
      getDeploymentConfigVersion(currentRC) > 1 &&
      phase !== DEPLOYMENT_PHASE.complete
    );
  }
  return notFailedOrCancelled && previous && previous.pods.length > 0;
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

const isReplicationControllerVisible = (resource: K8sResourceKind): boolean => {
  return !!_.get(resource, ['status', 'replicas'], isDeploymentInProgressOrCompleted(resource));
};

export const getPodsForResource = (resource: K8sResourceKind, resources: any): PodKind[] => {
  const { pods } = resources;
  return getOwnedResources(resource, pods?.data);
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

const toResourceItem = (
  rs: K8sResourceKind,
  model: K8sKind,
  resources: any,
): PodControllerOverviewItem => {
  const obj = {
    ...rs,
    apiVersion: apiVersionForModel(model),
    kind: `${model.kind}`,
  };
  const isKnative = isKnativeServing(rs, 'metadata.labels');
  const podData = getPodsForResource(rs, resources);
  const pods = podData && !podData.length && isKnative ? getAutoscaledPods(rs) : podData;
  const alerts = combinePodAlerts(pods);
  return {
    alerts,
    obj,
    pods,
    revision: getDeploymentRevision(rs),
  };
};

const getActiveStatefulSets = (ss: K8sResourceKind, resources: any): K8sResourceKind[] => {
  const { statefulSets } = resources;
  const ownedRS = _.filter(statefulSets?.data, (f) => f.metadata.name === ss?.metadata?.name);
  return _.filter(ownedRS, (rs) => _.get(rs, 'status.replicas'));
};

export const getStatefulSetsResource = (
  ss: K8sResourceKind,
  resources: any,
): PodControllerOverviewItem[] => {
  const activeStatefulSets = getActiveStatefulSets(ss, resources);
  return activeStatefulSets.map((pss) =>
    getIdledStatus(toResourceItem(pss, StatefulSetModel, resources), ss),
  );
};

export const getActiveReplicaSets = (
  deployment: K8sResourceKind,
  resources: any,
): K8sResourceKind[] => {
  const { replicaSets } = resources;
  const currentRevision = getDeploymentRevision(deployment);
  const ownedRS = getOwnedResources(deployment, replicaSets?.data);
  return _.filter(
    ownedRS,
    (rs) => _.get(rs, 'status.replicas') || getDeploymentRevision(rs) === currentRevision,
  );
};

export const getReplicaSetsForResource = (
  deployment: K8sResourceKind,
  resources: any,
): PodControllerOverviewItem[] => {
  const replicaSets = getActiveReplicaSets(deployment, resources);
  return sortReplicaSetsByRevision(replicaSets).map((rs) =>
    getIdledStatus(toResourceItem(rs, ReplicaSetModel, resources), deployment),
  );
};

export const getJobsForCronJob = (cronJobUid: string, resources: any): JobKind[] => {
  if (!resources?.jobs?.data?.length) {
    return [];
  }
  return resources.jobs.data
    .filter((job) => job.metadata?.ownerReferences?.find((ref) => ref.uid === cronJobUid))
    .map((job) => ({
      ...job,
      apiVersion: apiVersionForModel(JobModel),
      kind: JobModel.kind,
    }));
};

export const getBuildsForResource = (
  buildConfig: K8sResourceKind,
  resources: any,
): K8sResourceKind[] => {
  const { builds } = resources;
  return getOwnedResources(buildConfig, builds.data);
};

export const getBuildConfigsForCronJob = (
  cronJob: CronJobKind,
  resources: any,
): BuildConfigOverviewItem[] => {
  const buildConfigs = resources?.buildConfigs?.data ?? [];
  const currentNamespace = cronJob.metadata.namespace;
  const containers = cronJob.spec?.jobTemplate?.spec?.template?.spec?.containers ?? [];
  return _.reduce(
    buildConfigs,
    (acc, buildConfig) => {
      const targetImageNamespace = buildConfig?.spec?.output?.to?.namespace ?? currentNamespace;
      const targetImageName = buildConfig?.spec?.output?.to?.name;
      if (
        currentNamespace === targetImageNamespace &&
        containers.find((container) => container.image?.endsWith(targetImageName))
      ) {
        const builds = getBuildsForResource(buildConfig, resources);
        return [
          ...acc,
          {
            ...buildConfig,
            builds: sortBuilds(builds),
          },
        ];
      }
      return acc;
    },
    [],
  );
};

export const getBuildConfigsForResource = (
  resource: K8sResourceKind,
  resources: any,
): BuildConfigOverviewItem[] => {
  if (resource.kind === 'CronJob') {
    return getBuildConfigsForCronJob(resource as CronJobKind, resources);
  }
  const NAME_LABEL = 'app.kubernetes.io/name';
  const buildConfigs = resources?.buildConfigs?.data;
  const currentNamespace = resource.metadata.namespace;
  const nativeTriggers = resource?.spec?.triggers;
  const annotatedTriggers = getAnnotatedTriggers(resource);
  const triggers = _.unionWith(nativeTriggers, annotatedTriggers, _.isEqual);
  return _.flatMap(triggers, (trigger) => {
    const triggerFrom = trigger.from || (trigger.imageChangeParams?.from ?? {});
    if (triggerFrom.kind !== 'ImageStreamTag') {
      return [];
    }
    return _.reduce(
      buildConfigs,
      (acc, buildConfig) => {
        const triggerImageNamespace = triggerFrom.namespace || currentNamespace;
        const triggerImageName = triggerFrom.name;
        const targetImageNamespace = buildConfig.spec?.output?.to?.namespace ?? currentNamespace;
        const targetImageName = buildConfig.spec?.output?.to?.name;
        if (
          triggerImageNamespace === targetImageNamespace &&
          (triggerImageName === targetImageName ||
            resource.metadata?.labels?.[NAME_LABEL] === buildConfig.metadata?.labels?.[NAME_LABEL])
        ) {
          const builds = getBuildsForResource(buildConfig, resources);
          return [
            ...acc,
            {
              ...buildConfig,
              builds: sortBuilds(builds),
            },
          ];
        }
        return acc;
      },
      [],
    );
  });
};

const getPodTemplate = (resource: K8sResourceKind): PodTemplate => {
  switch (resource.kind) {
    case 'Pod':
      return resource as PodKind;
    case 'DeploymentConfig':
      // Include labels automatically added to deployment config pods since a service
      // might select them.
      return _.defaultsDeep(
        {
          metadata: {
            labels: {
              deploymentconfig: resource.metadata.name,
            },
          },
        },
        resource.spec.template,
      );
    default:
      return resource.spec.template;
  }
};

export const getRoutesForServices = (services: string[], routes: RouteKind[]): RouteKind[] => {
  if (!services?.length || !routes?.length) {
    return [];
  }
  return routes.filter((route) => services.includes(route.spec?.to?.name));
};

export const getServicesForResource = (
  resource: K8sResourceKind,
  services: K8sResourceKind[],
): K8sResourceKind[] => {
  const template: PodTemplate = getPodTemplate(resource);
  return _.filter(services, (service: K8sResourceKind) => {
    const selector = new LabelSelector(_.get(service, 'spec.selector', {}));
    return selector.matches(template);
  });
};

export const getWorkloadMonitoringAlerts = (
  resource: K8sResourceKind,
  monitoringAlerts: Alerts,
): Alert[] => {
  const alerts = _.reduce(
    monitoringAlerts?.data,
    (acc, alert) => {
      const labelValues = _.map(alertMessageResources, (model, label) => alert?.labels?.[label]);
      if (_.find(labelValues, (val) => val === resource?.metadata?.name)) {
        acc.push(alert);
      }
      return acc;
    },
    [],
  );
  return alerts;
};

export const validPod = (pod: K8sResourceKind) => {
  const owners = pod?.metadata?.ownerReferences;
  const phase = pod?.status?.phase;
  return _.isEmpty(owners) && phase !== 'Succeeded' && phase !== 'Failed';
};

const isStandaloneJob = (job: K8sResourceKind) =>
  !_.find(job.metadata?.ownerReferences, (owner) => owner.kind === 'CronJob');

export const getStandaloneJobs = (jobs: K8sResourceKind[]) =>
  jobs.filter((job) => isStandaloneJob(job));

export const getOverviewItemForResource = (
  obj: K8sResourceKind,
  resources: any,
  utils?: ResourceUtil[],
): OverviewItem => {
  const isMonitorable = MONITORABLE_KINDS.includes(obj.kind);
  const monitoringAlerts = isMonitorable
    ? getWorkloadMonitoringAlerts(obj, resources?.monitoringAlerts)
    : undefined;
  const hpas = resources?.hpas?.data?.filter(doesHpaMatch(obj));

  const overviewItems: OverviewItem = {
    obj,
    hpas,
    isMonitorable,
    monitoringAlerts,
  };

  if (utils) {
    return utils.reduce((acc, util) => {
      return { ...acc, ...util(obj, resources) };
    }, overviewItems);
  }
  return overviewItems;
};

export const createOverviewItemForType = (
  type: string,
  resource: K8sResourceKind,
  resources: any,
  utils?: ResourceUtil[],
): OverviewItem => {
  if (!WORKLOAD_TYPES.includes(type)) {
    return undefined;
  }
  switch (type) {
    case 'jobs':
      return isStandaloneJob(resource)
        ? getOverviewItemForResource(resource, resources, utils)
        : null;
    case 'pods':
      return validPod(resource)
        ? getOverviewItemForResource(resource, resources, utils)
        : undefined;
    default:
      return getOverviewItemForResource(resource, resources, utils);
  }
};

export const createOverviewItemsForType = (
  type: string,
  resources: any,
  utils?: ResourceUtil[],
): OverviewItem[] => {
  if (!WORKLOAD_TYPES.includes(type)) {
    return [];
  }
  const typedItems = resources[type]?.data ?? [];
  return typedItems.reduce((acc, resource) => {
    const item = createOverviewItemForType(type, resource, resources, utils);
    if (item) {
      acc.push(item);
    }
    return acc;
  }, []);
};

export const getResourceLimitsData = (limitsData: LimitsData) => ({
  ...((limitsData.cpu.limit || limitsData.memory.limit) && {
    limits: {
      ...(limitsData.cpu.limit && { cpu: `${limitsData.cpu.limit}${limitsData.cpu.limitUnit}` }),
      ...(limitsData.memory.limit && {
        memory: `${limitsData.memory.limit}${limitsData.memory.limitUnit}`,
      }),
    },
  }),
  ...((limitsData.cpu.request || limitsData.memory.request) && {
    requests: {
      ...(limitsData.cpu.request && {
        cpu: `${limitsData.cpu.request}${limitsData.cpu.requestUnit}`,
      }),
      ...(limitsData.memory.request && {
        memory: `${limitsData.memory.request}${limitsData.memory.requestUnit}`,
      }),
    },
  }),
});

export const getResourceData = (res: string) => {
  const resourcesRegEx = /^[0-9]*|[a-zA-Z]*/g;
  return res.match(resourcesRegEx);
};

export const getLimitsDataFromResource = (resource: K8sResourceKind) => {
  const containers = resource?.spec?.template?.spec?.containers ?? [];

  const [cpuLimit, cpuLimitUnit] = getResourceData(containers?.[0]?.resources?.limits?.cpu ?? '');
  const [memoryLimit, memoryLimitUnit] = getResourceData(
    containers?.[0]?.resources?.limits?.memory ?? '',
  );
  const [cpuRequest, cpuRequestUnit] = getResourceData(
    containers?.[0]?.resources?.requests?.cpu ?? '',
  );
  const [memoryRequest, memoryRequestUnit] = getResourceData(
    containers?.[0]?.resources?.requests?.memory ?? '',
  );

  const limitsData = {
    cpu: {
      request: cpuRequest,
      requestUnit: cpuRequestUnit || '',
      defaultRequestUnit: cpuRequestUnit || '',
      limit: cpuLimit,
      limitUnit: cpuLimitUnit || '',
      defaultLimitUnit: cpuLimitUnit || '',
    },
    memory: {
      request: memoryRequest,
      requestUnit: memoryRequestUnit || 'Mi',
      defaultRequestUnit: memoryRequestUnit || 'Mi',
      limit: memoryLimit,
      limitUnit: memoryLimitUnit || 'Mi',
      defaultLimitUnit: memoryLimitUnit || 'Mi',
    },
  };
  return limitsData;
};

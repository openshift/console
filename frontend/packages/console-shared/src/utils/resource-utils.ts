import * as _ from 'lodash';
import { OverviewResourceUtil } from '@console/plugin-sdk';
import {
  DeploymentKind,
  K8sResourceKind,
  LabelSelector,
  PodKind,
  CronJobKind,
  PodTemplate,
  RouteKind,
  apiVersionForModel,
  referenceForModel,
  K8sKind,
  ObjectMetadata,
  JobKind,
} from '@console/internal/module/k8s';
import {
  DeploymentConfigModel,
  ReplicationControllerModel,
  ReplicaSetModel,
  DeploymentModel,
  DaemonSetModel,
  StatefulSetModel,
  PodModel,
  JobModel,
  CronJobModel,
} from '@console/internal/models';
import { getBuildNumber } from '@console/internal/module/k8s/builds';
import { FirehoseResource } from '@console/internal/components/utils';
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';
import { Alert, Alerts } from '@console/internal/components/monitoring/types';
import { alertMessageResources } from '@console/internal/components/monitoring/alerting';
import {
  BuildConfigOverviewItem,
  OverviewItemAlerts,
  PodControllerOverviewItem,
  OverviewItem,
  PodRCData,
  ExtPodKind,
  OperatorBackedServiceKindMap,
} from '../types';
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
import { resourceStatus, podStatus } from './ResourceStatus';
import { isKnativeServing, isIdled } from './pod-utils';
import { doesHpaMatch } from '@console/dev-console/src/components/hpa/hpa-utils';

export const getResourceList = (namespace: string, resList?: any): FirehoseResource[] => {
  let resources: FirehoseResource[] = [
    {
      isList: true,
      kind: 'DeploymentConfig',
      namespace,
      prop: 'deploymentConfigs',
      optional: true,
    },
    {
      isList: true,
      kind: 'Deployment',
      namespace,
      prop: 'deployments',
      optional: true,
    },
    {
      isList: true,
      kind: 'DaemonSet',
      namespace,
      prop: 'daemonSets',
      optional: true,
    },
    {
      isList: true,
      kind: 'Pod',
      namespace,
      prop: 'pods',
      optional: true,
    },
    {
      isList: true,
      kind: 'Job',
      namespace,
      prop: 'jobs',
      optional: true,
    },
    {
      isList: true,
      kind: 'CronJob',
      namespace,
      prop: 'cronJobs',
      optional: true,
    },
    {
      isList: true,
      kind: 'ReplicationController',
      namespace,
      prop: 'replicationControllers',
      optional: true,
    },
    {
      isList: true,
      kind: 'Route',
      namespace,
      prop: 'routes',
      optional: true,
    },
    {
      isList: true,
      kind: 'Service',
      namespace,
      prop: 'services',
      optional: true,
    },
    {
      isList: true,
      kind: 'ReplicaSet',
      namespace,
      prop: 'replicaSets',
      optional: true,
    },
    {
      isList: true,
      kind: 'BuildConfig',
      namespace,
      prop: 'buildConfigs',
      optional: true,
    },
    {
      isList: true,
      kind: 'Build',
      namespace,
      prop: 'builds',
      optional: true,
    },
    {
      isList: true,
      kind: 'StatefulSet',
      namespace,
      prop: 'statefulSets',
      optional: true,
    },
    {
      isList: true,
      kind: 'Secret',
      namespace,
      prop: 'secrets',
      optional: true,
    },
    {
      isList: true,
      kind: referenceForModel(ClusterServiceVersionModel),
      namespace,
      prop: 'clusterServiceVersions',
      optional: true,
    },
  ];

  if (resList) {
    resList.forEach((resource) => {
      resources = [...resources, ...resource.properties.resources(namespace)];
    });
  }

  return resources;
};

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
  { metadata: { uid } }: K8sResourceKind,
  resources: T[],
): T[] => {
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

const getAnnotation = (obj: K8sResourceKind, annotation: string): string => {
  return _.get(obj, ['metadata', 'annotations', annotation]);
};

export const parseJSONAnnotation = (
  annotations: ObjectMetadata['annotations'],
  annotationKey: string,
  onError?: (err: Error) => void,
  defaultReturn?: any,
): any => {
  try {
    return annotations?.[annotationKey] ? JSON.parse(annotations?.[annotationKey]) : defaultReturn;
  } catch (e) {
    onError && onError(e);
    // eslint-disable-next-line no-console
    console.warn(`Could not parse annotation ${annotationKey} as JSON: `, e);
    return defaultReturn;
  }
};

const getDeploymentRevision = (obj: K8sResourceKind): number => {
  const revision = getAnnotation(obj, DEPLOYMENT_REVISION_ANNOTATION);
  return revision && parseInt(revision, 10);
};

const getDeploymentConfigVersion = (obj: K8sResourceKind): number => {
  const version = getAnnotation(obj, DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION);
  return version && parseInt(version, 10);
};

const getDeploymentConfigName = (obj: K8sResourceKind): string => {
  return _.get(obj, 'metadata.ownerReferences[0].name', null);
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
      const key = podAlertKey(reason, pod, name);
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
  const name = getDeploymentConfigName(rc);
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
  const {
    spec: {
      strategy: { type: strategy },
    },
  } = dc;
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

export const getOperatorBackedServiceKindMap = (
  installedOperators: ClusterServiceVersionKind[],
): OperatorBackedServiceKindMap =>
  installedOperators
    ? installedOperators.reduce((kindMap, csv) => {
        (csv?.spec?.customresourcedefinitions?.owned || []).forEach((crd) => {
          if (!(crd.kind in kindMap)) {
            kindMap[crd.kind] = csv;
          }
        });
        return kindMap;
      }, {})
    : {};

export const getPodsForResource = (resource: K8sResourceKind, resources: any): PodKind[] => {
  const { pods } = resources;
  return getOwnedResources(resource, pods.data);
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
  const ownedRS = _.filter(statefulSets?.data, (f) => f.metadata.name === ss.metadata.name);
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
  const ownedRS = getOwnedResources(deployment, replicaSets.data);
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

export const getJobsForCronJob = (cronJob: K8sResourceKind, resources: any): JobKind[] => {
  if (!resources?.jobs?.data?.length) {
    return [];
  }
  return resources.jobs.data
    .filter((job) => job.metadata?.ownerReferences?.find((ref) => ref.uid === cronJob.metadata.uid))
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
          triggerImageName === targetImageName
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

export const getPodTemplate = (resource: K8sResourceKind): PodTemplate => {
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

export const getRoutesForServices = (services: K8sResourceKind[], resources: any): RouteKind[] => {
  const { routes } = resources;
  return _.filter(routes.data, (route) => {
    const name = _.get(route, 'spec.to.name');
    return _.some(services, { metadata: { name } });
  });
};

export const getServicesForResource = (
  resource: K8sResourceKind,
  resources: any,
): K8sResourceKind[] => {
  const { services } = resources;
  const template: PodTemplate = getPodTemplate(resource);
  return _.filter(services.data, (service: K8sResourceKind) => {
    const selector = new LabelSelector(_.get(service, 'spec.selector', {}));
    return selector.matches(template);
  });
};

const isKindMonitorable = (model: K8sKind): boolean => {
  switch (model) {
    case DeploymentModel:
    case DeploymentConfigModel:
    case StatefulSetModel:
    case DaemonSetModel:
      return true;
    default:
      return false;
  }
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

export const getOverviewItemsForResource = (
  obj: K8sResourceKind,
  resources: any,
  isMonitorable: boolean,
  utils?: OverviewResourceUtil[],
  current?: PodControllerOverviewItem,
  previous?: PodControllerOverviewItem,
  isRollingOut?: boolean,
  customPods?: PodKind[],
  additionalAlerts?: OverviewItemAlerts,
  customBuildConfigs?: BuildConfigOverviewItem[],
) => {
  const monitoringAlerts = isMonitorable
    ? getWorkloadMonitoringAlerts(obj, resources?.monitoringAlerts)
    : undefined;
  const buildConfigs = customBuildConfigs || getBuildConfigsForResource(obj, resources);
  const services = getServicesForResource(obj, resources);
  const routes = getRoutesForServices(services, resources);
  const pods = customPods ?? getPodsForResource(obj, resources);
  const alerts = {
    ...(additionalAlerts ?? combinePodAlerts(pods)),
    ...getBuildAlerts(buildConfigs),
  };
  const status = resourceStatus(obj, current, isRollingOut);
  const hpas = resources?.hpas?.data?.filter(doesHpaMatch(obj));
  const overviewItems = {
    alerts,
    buildConfigs,
    obj,
    hpas,
    pods,
    routes,
    services,
    status,
    isMonitorable,
    current,
    previous,
    isRollingOut,
    monitoringAlerts,
  };

  if (utils) {
    return utils.reduce((acc, util) => {
      return { ...acc, ...util.properties.getResources(obj, resources) };
    }, overviewItems);
  }
  return overviewItems;
};

export const createDeploymentConfigItem = (
  deploymentConfig: K8sResourceKind,
  resources: any,
  utils?: OverviewResourceUtil[],
): OverviewItem => {
  const { mostRecentRC, visibleReplicationControllers } = getReplicationControllersForResource(
    deploymentConfig,
    resources,
  );
  const [current, previous] = visibleReplicationControllers;
  const isRollingOut = getRolloutStatus(deploymentConfig, current, previous);
  const buildConfigs = getBuildConfigsForResource(deploymentConfig, resources);
  const services = getServicesForResource(deploymentConfig, resources);
  const routes = getRoutesForServices(services, resources);
  const rolloutAlerts = mostRecentRC ? getReplicationControllerAlerts(mostRecentRC) : {};
  const alerts = {
    ...getResourcePausedAlert(deploymentConfig),
    ...getBuildAlerts(buildConfigs),
    ...rolloutAlerts,
  };
  const status = resourceStatus(deploymentConfig, current, isRollingOut);
  const pods = [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])];
  const monitoringAlerts = getWorkloadMonitoringAlerts(
    deploymentConfig,
    resources?.monitoringAlerts,
  );
  const overviewItems = {
    alerts,
    buildConfigs,
    current,
    isRollingOut,
    obj: deploymentConfig,
    previous,
    pods,
    routes,
    services,
    status,
    isMonitorable: true,
    monitoringAlerts,
  };

  if (utils) {
    return utils.reduce((acc, util) => {
      return { ...acc, ...util.properties.getResources(deploymentConfig, resources) };
    }, overviewItems);
  }
  return overviewItems;
};

export const createDeploymentConfigItems = (
  deployments: K8sResourceKind[],
  resources: any,
  utils?: OverviewResourceUtil[],
): OverviewItem[] => {
  if (!deployments) {
    return [];
  }
  return deployments.map((d) => createDeploymentConfigItem(d, resources, utils));
};

export const createDeploymentItem = (
  deployment: K8sResourceKind,
  resources: any,
  utils?: OverviewResourceUtil[],
): OverviewItem => {
  const replicaSets = getReplicaSetsForResource(deployment, resources);
  const [current, previous] = replicaSets;
  const isRollingOut = !!current && !!previous;
  const buildConfigs = getBuildConfigsForResource(deployment, resources);
  const services = getServicesForResource(deployment, resources);
  const routes = getRoutesForServices(services, resources);
  const alerts = {
    ...getResourcePausedAlert(deployment),
    ...getBuildAlerts(buildConfigs),
  };
  const status = resourceStatus(deployment, current, isRollingOut);
  const pods = [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])];
  const monitoringAlerts = getWorkloadMonitoringAlerts(deployment, resources?.monitoringAlerts);
  const overviewItem = {
    obj: deployment,
    alerts,
    buildConfigs,
    current,
    isRollingOut,
    previous,
    pods,
    routes,
    services,
    status,
    isMonitorable: true,
    monitoringAlerts,
  };
  if (utils) {
    return utils.reduce((acc, util) => {
      return { ...acc, ...util.properties.getResources(deployment, resources) };
    }, overviewItem);
  }
  return overviewItem;
};

export const createDeploymentItems = (
  deployments: DeploymentKind[],
  resources: any,
  utils?: OverviewResourceUtil[],
): OverviewItem[] => {
  if (!deployments) {
    return [];
  }
  return deployments.map((d) => createDeploymentItem(d, resources, utils));
};

export const createCronJobItem = (
  cronJob: CronJobKind,
  resources: any,
  utils?: OverviewResourceUtil[],
): OverviewItem => {
  const buildConfigs = getBuildConfigsForCronJob(cronJob, resources);
  const jobs = getJobsForCronJob(cronJob, resources);
  const pods = jobs?.reduce((acc, job) => {
    acc.push(...getPodsForResource(job, resources));
    return acc;
  }, []);
  const alerts = {
    ...combinePodAlerts(pods),
    ...getBuildAlerts(buildConfigs),
  };
  const status = resourceStatus(cronJob);
  const isMonitorable = isKindMonitorable(CronJobModel);
  const monitoringAlerts = isMonitorable
    ? getWorkloadMonitoringAlerts(cronJob, resources?.monitoringAlerts)
    : undefined;
  const overviewItem = {
    alerts,
    obj: cronJob,
    buildConfigs,
    pods,
    jobs,
    status,
    routes: [],
    services: [],
    isMonitorable,
    monitoringAlerts,
  };

  if (utils) {
    return utils.reduce((acc, util) => {
      return { ...acc, ...util.properties.getResources(cronJob, resources) };
    }, overviewItem);
  }
  return overviewItem;
};

export const createCronJobItems = (
  cronJobs: CronJobKind[],
  resources: any,
  utils?: OverviewResourceUtil[],
): OverviewItem[] => {
  if (!cronJobs) {
    return [];
  }
  return cronJobs.map((d) => createCronJobItem(d, resources, utils));
};

export const getStandaloneJobs = (jobs: JobKind[]) => {
  return jobs.filter((job) => !job.metadata?.ownerReferences?.length);
};

export const createWorkloadItems = (
  model: K8sKind,
  typedItems: K8sResourceKind[],
  resources: any,
  utils?: OverviewResourceUtil[],
): OverviewItem[] => {
  if (!typedItems) {
    return [];
  }
  return typedItems.map((d) =>
    getOverviewItemsForResource(d, resources, isKindMonitorable(model), utils),
  );
};

export const createPodItem = (pod: PodKind, resources: any): OverviewItem => {
  const owners = pod?.metadata?.ownerReferences;
  const phase = pod?.status?.phase;
  if (!_.isEmpty(owners) || phase === 'Succeeded' || phase === 'Failed') {
    return null;
  }
  const alerts = getPodAlerts(pod);
  const services = getServicesForResource(pod, resources);
  const routes = getRoutesForServices(services, resources);
  const status = podStatus(pod as PodKind);
  const isMonitorable = isKindMonitorable(PodModel);
  const monitoringAlerts: Alert[] = isMonitorable
    ? getWorkloadMonitoringAlerts(pod, resources?.monitoringAlerts)
    : undefined;

  return {
    alerts,
    obj: pod,
    buildConfigs: null,
    routes,
    services,
    status,
    pods: [pod],
    isMonitorable,
    monitoringAlerts,
  };
};

export const createPodItems = (pods: K8sResourceKind[], resources: any): OverviewItem[] => {
  if (!pods) {
    return [];
  }
  return pods.reduce((acc, p) => {
    const item = createPodItem(p as PodKind, resources);
    if (item) {
      acc.push(item);
    }
    return acc;
  }, []);
};

export const createOverviewItemsForType = (
  type: string,
  resources: any,
  utils?: OverviewResourceUtil[],
): OverviewItem[] => {
  const typedItems = resources[type]?.data ?? [];
  switch (type) {
    case 'deployments':
      return createDeploymentItems(typedItems, resources, utils);
    case 'deploymentConfigs':
      return createDeploymentConfigItems(typedItems, resources, utils);
    case 'cronJobs':
      return createCronJobItems(typedItems, resources, utils);
    case 'statefulSets':
      return createWorkloadItems(StatefulSetModel, typedItems, resources, utils);
    case 'daemonSets':
      return createWorkloadItems(DaemonSetModel, typedItems, resources, utils);
    case 'jobs':
      return createWorkloadItems(JobModel, getStandaloneJobs(typedItems), resources, utils);
    case 'pods':
      return createPodItems(typedItems, resources);
    default:
      return [];
  }
};

export const createOverviewItemForType = (
  type: string,
  resource: K8sResourceKind,
  resources: any,
  utils?: OverviewResourceUtil[],
): OverviewItem => {
  switch (type) {
    case 'deployments':
      return createDeploymentItem(resource, resources, utils);
    case 'deploymentConfigs':
      return createDeploymentConfigItem(resource, resources, utils);
    case 'cronJobs':
      return createCronJobItem(resource as CronJobKind, resources, utils);
    case 'statefulSets':
      return getOverviewItemsForResource(
        resource,
        resources,
        isKindMonitorable(StatefulSetModel),
        utils,
      );
    case 'daemonSets':
      return getOverviewItemsForResource(
        resource,
        resources,
        isKindMonitorable(DaemonSetModel),
        utils,
      );
    case 'jobs':
      return resource.metadata?.ownerReferences?.length
        ? null
        : getOverviewItemsForResource(resource, resources, isKindMonitorable(JobModel), utils);
    case 'pods':
      return createPodItem(resource as PodKind, resources);
    default:
      return undefined;
  }
};

export const getPodsForDeploymentConfigs = (
  deploymentConfigs: K8sResourceKind[],
  resources: any,
): PodRCData[] => {
  return _.map(deploymentConfigs, (dc) => {
    const obj: K8sResourceKind = {
      ...dc,
      apiVersion: apiVersionForModel(DeploymentConfigModel),
      kind: DeploymentConfigModel.kind,
    };
    const { visibleReplicationControllers } = getReplicationControllersForResource(obj, resources);
    const [current, previous] = visibleReplicationControllers;
    const isRollingOut = getRolloutStatus(obj, current, previous);
    return {
      obj,
      current,
      previous,
      pods: [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])],
      isRollingOut,
    };
  });
};

export const getPodsForDeployments = (
  deployments: K8sResourceKind[],
  resources: any,
): PodRCData[] => {
  return _.map(deployments, (d) => {
    const obj: K8sResourceKind = {
      ...d,
      apiVersion: apiVersionForModel(DeploymentModel),
      kind: DeploymentModel.kind,
    };
    const replicaSets = getReplicaSetsForResource(obj, resources);
    const [current, previous] = replicaSets;
    const isRollingOut = !!current && !!previous;

    return {
      obj,
      current,
      previous,
      isRollingOut,
      pods: [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])],
    };
  });
};

export const getPodsForStatefulSets = (ss: K8sResourceKind[], resources: any): PodRCData[] => {
  return _.map(ss, (s) => {
    const obj: K8sResourceKind = {
      ...s,
      apiVersion: apiVersionForModel(StatefulSetModel),
      kind: StatefulSetModel.kind,
    };
    const statefulSets = getStatefulSetsResource(obj, resources);
    const [current, previous] = statefulSets;
    const isRollingOut = !!current && !!previous;

    return {
      obj,
      current,
      previous,
      isRollingOut,
      pods: [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])],
    };
  });
};

export const getPodsForDaemonSets = (ds: K8sResourceKind[], resources: any): PodRCData[] => {
  return _.map(ds, (d) => {
    const obj: K8sResourceKind = {
      ...d,
      apiVersion: apiVersionForModel(StatefulSetModel),
      kind: StatefulSetModel.kind,
    };
    return {
      obj,
      current: undefined,
      previous: undefined,
      isRollingOut: undefined,
      pods: getPodsForResource(d, resources),
    };
  });
};

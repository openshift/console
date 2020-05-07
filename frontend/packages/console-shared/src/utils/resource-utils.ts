import * as _ from 'lodash';
import {
  DeploymentKind,
  K8sResourceKind,
  LabelSelector,
  PodKind,
  PodTemplate,
  RouteKind,
  apiVersionForModel,
  referenceForModel,
  K8sKind,
  ObjectMetadata,
} from '@console/internal/module/k8s';
import {
  DeploymentConfigModel,
  ReplicationControllerModel,
  ReplicaSetModel,
  DeploymentModel,
  DaemonSetModel,
  StatefulSetModel,
  PodModel,
} from '@console/internal/models';
import { getBuildNumber } from '@console/internal/module/k8s/builds';
import { FirehoseResource } from '@console/internal/components/utils';
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
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';

export const getResourceList = (namespace: string, resList?: any) => {
  let resources: FirehoseResource[] = [
    {
      isList: true,
      kind: 'DeploymentConfig',
      namespace,
      prop: 'deploymentConfigs',
    },
    {
      isList: true,
      kind: 'Deployment',
      namespace,
      prop: 'deployments',
    },
    {
      isList: true,
      kind: 'DaemonSet',
      namespace,
      prop: 'daemonSets',
    },
    {
      isList: true,
      kind: 'Pod',
      namespace,
      prop: 'pods',
    },
    {
      isList: true,
      kind: 'ReplicationController',
      namespace,
      prop: 'replicationControllers',
    },
    {
      isList: true,
      kind: 'Route',
      namespace,
      prop: 'routes',
    },
    {
      isList: true,
      kind: 'Service',
      namespace,
      prop: 'services',
    },
    {
      isList: true,
      kind: 'ReplicaSet',
      namespace,
      prop: 'replicaSets',
    },
    {
      isList: true,
      kind: 'BuildConfig',
      namespace,
      prop: 'buildConfigs',
    },
    {
      isList: true,
      kind: 'Build',
      namespace,
      prop: 'builds',
    },
    {
      isList: true,
      kind: 'StatefulSet',
      namespace,
      prop: 'statefulSets',
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

  let utils = [];
  if (resList) {
    resList.forEach((resource) => {
      resources = [...resources, ...resource.properties.resources(namespace)];
      utils = [...utils, resource.properties.utils];
    });
  }

  return { resources, utils };
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

export const isOperatorBackedService = (
  obj: K8sResourceKind,
  installedOperators: ClusterServiceVersionKind[],
): boolean => {
  const kind = _.get(obj, 'metadata.ownerReferences[0].kind', null);
  const ownerUid = _.get(obj, 'metadata.ownerReferences[0].uid');
  const operatBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);
  const operatorResource: K8sResourceKind = _.find(installedOperators, {
    metadata: { uid: ownerUid },
  }) as K8sResourceKind;
  return (
    kind &&
    operatBackedServiceKindMap &&
    (!_.isEmpty(operatorResource) || kind in operatBackedServiceKindMap)
  );
};

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

export const getBuildsForResource = (
  buildConfig: K8sResourceKind,
  resources: any,
): K8sResourceKind[] => {
  const { builds } = resources;
  return getOwnedResources(buildConfig, builds.data);
};

export const getBuildConfigsForResource = (
  resource: K8sResourceKind,
  resources: any,
): BuildConfigOverviewItem[] => {
  const buildConfigs = _.get(resources, ['buildConfigs', 'data']);
  const currentNamespace = resource.metadata.namespace;
  const nativeTriggers = _.get(resource, 'spec.triggers');
  const annotatedTriggers = getAnnotatedTriggers(resource);
  const triggers = _.unionWith(nativeTriggers, annotatedTriggers, _.isEqual);
  return _.flatMap(triggers, (trigger) => {
    const triggerFrom = trigger.from || _.get(trigger, 'imageChangeParams.from', {});
    if (triggerFrom.kind !== 'ImageStreamTag') {
      return [];
    }
    return _.reduce(
      buildConfigs,
      (acc, buildConfig) => {
        const triggerImageNamespace = triggerFrom.namespace || currentNamespace;
        const triggerImageName = triggerFrom.name;
        const targetImageNamespace = _.get(
          buildConfig,
          'spec.output.to.namespace',
          currentNamespace,
        );
        const targetImageName = _.get(buildConfig, 'spec.output.to.name');
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

export const createDeploymentConfigItems = (
  deploymentConfigs: K8sResourceKind[],
  resources: any,
  installedOperators: ClusterServiceVersionKind[],
  utils?: Function[],
  operatorsFilter?: boolean,
): OverviewItem[] => {
  const items = _.map(deploymentConfigs, (dc) => {
    const obj: K8sResourceKind = {
      ...dc,
      apiVersion: apiVersionForModel(DeploymentConfigModel),
      kind: DeploymentConfigModel.kind,
    };
    const { mostRecentRC, visibleReplicationControllers } = getReplicationControllersForResource(
      obj,
      resources,
    );
    const [current, previous] = visibleReplicationControllers;
    const isRollingOut = getRolloutStatus(obj, current, previous);
    const buildConfigs = getBuildConfigsForResource(obj, resources);
    const services = getServicesForResource(obj, resources);
    const routes = getRoutesForServices(services, resources);
    const rolloutAlerts = mostRecentRC ? getReplicationControllerAlerts(mostRecentRC) : {};
    const alerts = {
      ...getResourcePausedAlert(obj),
      ...getBuildAlerts(buildConfigs),
      ...rolloutAlerts,
    };
    const status = resourceStatus(obj, current, isRollingOut);
    const pods = [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])];
    const overviewItems = {
      alerts,
      buildConfigs,
      current,
      isRollingOut,
      obj,
      previous,
      pods,
      routes,
      services,
      status,
      isMonitorable: true,
      isOperatorBackedService: isOperatorBackedService(obj, installedOperators),
    };

    if (utils) {
      return utils.reduce((acc, element) => {
        return { ...acc, ...element(obj, resources) };
      }, overviewItems);
    }
    return overviewItems;
  });
  if (operatorsFilter !== undefined) {
    return items.filter((item) => item.isOperatorBackedService === operatorsFilter);
  }
  return items;
};

export const createDeploymentItems = (
  deployments: DeploymentKind[],
  resources: any,
  installedOperators: ClusterServiceVersionKind[],
  utils?: Function[],
  operatorsFilter?: boolean,
): OverviewItem<DeploymentKind>[] => {
  const items = _.map(deployments, (d) => {
    const obj: DeploymentKind = {
      ...d,
      apiVersion: apiVersionForModel(DeploymentModel),
      kind: DeploymentModel.kind,
    };
    const replicaSets = getReplicaSetsForResource(obj, resources);
    const [current, previous] = replicaSets;
    const isRollingOut = !!current && !!previous;
    const buildConfigs = getBuildConfigsForResource(obj, resources);
    const services = getServicesForResource(obj, resources);
    const routes = getRoutesForServices(services, resources);
    const alerts = {
      ...getResourcePausedAlert(obj),
      ...getBuildAlerts(buildConfigs),
    };
    const status = resourceStatus(obj, current, isRollingOut);
    const pods = [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])];
    const overviewItems = {
      alerts,
      buildConfigs,
      current,
      isRollingOut,
      obj,
      previous,
      pods,
      routes,
      services,
      status,
      isMonitorable: true,
      isOperatorBackedService: isOperatorBackedService(obj, installedOperators),
    };

    if (utils) {
      return utils.reduce((acc, element) => {
        return { ...acc, ...element(obj, resources) };
      }, overviewItems);
    }
    return overviewItems;
  });
  if (operatorsFilter !== undefined) {
    return items.filter((item) => item.isOperatorBackedService === operatorsFilter);
  }
  return items;
};

export const createDaemonSetItems = (
  daemonSets: K8sResourceKind[],
  resources: any,
  installedOperators: ClusterServiceVersionKind[],
  utils?: Function[],
  operatorsFilter?: boolean,
): OverviewItem[] => {
  const items = _.map(daemonSets, (ds) => {
    const obj: K8sResourceKind = {
      ...ds,
      apiVersion: apiVersionForModel(DaemonSetModel),
      kind: DaemonSetModel.kind,
    };
    const buildConfigs = getBuildConfigsForResource(obj, resources);
    const services = getServicesForResource(obj, resources);
    const routes = getRoutesForServices(services, resources);
    const pods = getPodsForResource(obj, resources);
    const alerts = {
      ...combinePodAlerts(pods),
      ...getBuildAlerts(buildConfigs),
    };
    const status = resourceStatus(obj);
    return {
      alerts,
      buildConfigs,
      obj,
      pods,
      routes,
      services,
      status,
      isMonitorable: true,
      isOperatorBackedService: isOperatorBackedService(obj, installedOperators),
    };
  });
  if (operatorsFilter !== undefined) {
    return items.filter((item) => item.isOperatorBackedService === operatorsFilter);
  }
  return items;
};

export const createStatefulSetItems = (
  statefulSets: K8sResourceKind[],
  resources: any,
  installedOperators: ClusterServiceVersionKind[],
  utils?: Function[],
  operatorsFilter?: boolean,
): OverviewItem[] => {
  const items = _.map(statefulSets, (ss) => {
    const obj: K8sResourceKind = {
      ...ss,
      apiVersion: apiVersionForModel(StatefulSetModel),
      kind: StatefulSetModel.kind,
    };
    const buildConfigs = getBuildConfigsForResource(obj, resources);
    const pods = getPodsForResource(obj, resources);
    const alerts = {
      ...combinePodAlerts(pods),
      ...getBuildAlerts(buildConfigs),
    };
    const services = getServicesForResource(obj, resources);
    const routes = getRoutesForServices(services, resources);
    const status = resourceStatus(obj);
    return {
      alerts,
      buildConfigs,
      obj,
      pods,
      routes,
      services,
      status,
      isMonitorable: true,
      isOperatorBackedService: isOperatorBackedService(obj, installedOperators),
    };
  });
  if (operatorsFilter !== undefined) {
    return items.filter((item) => item.isOperatorBackedService === operatorsFilter);
  }
  return items;
};

export const createPodItems = (resources: any): OverviewItem[] => {
  const { pods } = resources;
  return _.reduce(
    pods.data,
    (acc, pod) => {
      const obj: PodKind = {
        ...pod,
        apiVersion: apiVersionForModel(PodModel),
        kind: PodModel.kind,
      };
      const owners = _.get(obj, 'metadata.ownerReferences');
      const phase = _.get(obj, 'status.phase');
      if (!_.isEmpty(owners) || phase === 'Succeeded' || phase === 'Failed') {
        return acc;
      }

      const alerts = getPodAlerts(obj);
      const services = getServicesForResource(obj, resources);
      const routes = getRoutesForServices(services, resources);
      const status = podStatus(obj);
      return [
        ...acc,
        {
          alerts,
          obj,
          routes,
          services,
          status,
        },
      ];
    },
    [],
  );
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

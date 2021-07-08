import {
  CronJobModel,
  DeploymentConfigModel,
  DeploymentModel,
  StatefulSetModel,
} from '@console/internal/models';
import { apiVersionForModel, K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { PodRCData } from '../types';
import {
  getJobsForCronJob,
  getPodsForResource,
  getReplicaSetsForResource,
  getReplicationControllersForResource,
  getRolloutStatus,
  getStatefulSetsResource,
} from './resource-utils';

export const getPodsForDeploymentConfig = (
  deploymentConfig: K8sResourceKind,
  resources: any,
): PodRCData => {
  const obj: K8sResourceKind = {
    ...deploymentConfig,
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
    pods: [...(current?.pods || []), ...(previous?.pods || [])],
    isRollingOut,
  };
};

export const getPodsForDeploymentConfigs = (
  deploymentConfigs: K8sResourceKind[],
  resources: any,
): PodRCData[] =>
  deploymentConfigs ? deploymentConfigs.map((dc) => getPodsForDeploymentConfig(dc, resources)) : [];

export const getPodsForDeployment = (deployment: K8sResourceKind, resources: any): PodRCData => {
  const obj: K8sResourceKind = {
    ...deployment,
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
    pods: [...(current?.pods || []), ...(previous?.pods || [])],
  };
};

export const getPodsForDeployments = (
  deployments: K8sResourceKind[],
  resources: any,
): PodRCData[] => (deployments ? deployments.map((d) => getPodsForDeployment(d, resources)) : []);

export const getPodsForStatefulSet = (ss: K8sResourceKind, resources: any): PodRCData => {
  const obj: K8sResourceKind = {
    ...ss,
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
    pods: [...(current?.pods || []), ...(previous?.pods || [])],
  };
};

export const getPodsForStatefulSets = (ss: K8sResourceKind[], resources: any): PodRCData[] =>
  ss ? ss.map((s) => getPodsForStatefulSet(s, resources)) : [];

export const getPodsForDaemonSet = (ds: K8sResourceKind, resources: any): PodRCData => {
  const obj: K8sResourceKind = {
    ...ds,
    apiVersion: apiVersionForModel(StatefulSetModel),
    kind: StatefulSetModel.kind,
  };
  return {
    obj,
    current: undefined,
    previous: undefined,
    isRollingOut: undefined,
    pods: getPodsForResource(ds, resources),
  };
};

export const getPodsForDaemonSets = (ds: K8sResourceKind[], resources: any): PodRCData[] =>
  ds ? ds.map((d) => getPodsForDaemonSet(d, resources)) : [];

export const getPodsForCronJob = (cronJob: K8sResourceKind, resources: any): PodRCData => {
  const obj: K8sResourceKind = {
    ...cronJob,
    apiVersion: apiVersionForModel(CronJobModel),
    kind: CronJobModel.kind,
  };
  const jobs = getJobsForCronJob(cronJob?.metadata?.uid, resources);
  return {
    obj,
    current: undefined,
    previous: undefined,
    isRollingOut: undefined,
    pods: jobs?.reduce((acc, job) => {
      acc.push(...getPodsForResource(job, resources));
      return acc;
    }, []),
  };
};

export const getPodsForCronJobs = (cronJobs: K8sResourceKind[], resources: any): PodRCData[] =>
  cronJobs ? cronJobs.map((cronJob) => getPodsForCronJob(cronJob, resources)) : [];

export const getPodsDataForResource = (
  resource: K8sResourceKind,
  kind: string,
  resources: any,
): PodRCData => {
  switch (kind) {
    case 'DeploymentConfig':
      return getPodsForDeploymentConfig(resource, resources);
    case 'Deployment':
      return getPodsForDeployment(resource, resources);
    case 'StatefulSet':
      return getPodsForStatefulSet(resource, resources);
    case 'DaemonSet':
      return getPodsForDaemonSet(resource, resources);
    case 'CronJob':
      return getPodsForCronJob(resource, resources);
    case 'Pod':
      return {
        obj: resource,
        current: undefined,
        previous: undefined,
        isRollingOut: true,
        pods: [resource as PodKind],
      };
    default:
      return {
        obj: resource,
        current: undefined,
        previous: undefined,
        isRollingOut: undefined,
        pods: getPodsForResource(resource, resources),
      };
  }
};

export const getResourcesToWatchForPods = (kind: string, namespace: string) => {
  switch (kind) {
    case 'DeploymentConfig':
      return {
        pods: {
          isList: true,
          kind: 'Pod',
          namespace,
        },
        replicationControllers: {
          isList: true,
          kind: 'ReplicationController',
          namespace,
        },
      };
    case 'Deployment':
      return {
        pods: {
          isList: true,
          kind: 'Pod',
          namespace,
        },
        replicaSets: {
          isList: true,
          kind: 'ReplicaSet',
          namespace,
        },
      };
    case 'StatefulSet':
      return {
        pods: {
          isList: true,
          kind: 'Pod',
          namespace,
        },
        statefulSets: {
          isList: true,
          kind: 'StatefulSet',
          namespace,
        },
      };
    case 'CronJob':
      return {
        pods: {
          isList: true,
          kind: 'Pod',
          namespace,
        },
        jobs: {
          isList: true,
          kind: 'Job',
          namespace,
        },
      };
    default:
      return {
        pods: {
          isList: true,
          kind: 'Pod',
          namespace,
        },
      };
  }
};

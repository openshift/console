/* eslint-disable oxc/no-barrel-file */
import type {
  DashboardsOverviewInventoryItem,
  DashboardsProjectOverviewInventoryItem,
} from '@console/dynamic-plugin-sdk/src/extensions/dashboards';
import type { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import {
  getNodeInventoryQuery,
  getInventoryCountQuery,
  getPodInventoryQuery,
  getPVCInventoryQuery,
  getPrometheusInventoryCount,
  getPrometheusNodeStatusGroups,
  getPrometheusPodStatusGroups,
  getPrometheusPVCStatusGroups,
} from '@console/shared/src/components/dashboard/inventory-card/prometheus-utils';

// re-export to allow for usage in exposedModules
export {
  NodeModel,
  PodModel,
  StorageClassModel,
  PersistentVolumeClaimModel,
  DeploymentModel,
  DeploymentConfigModel,
  StatefulSetModel,
  ServiceModel,
  RouteModel,
  ConfigMapModel,
  SecretModel,
  VolumeSnapshotModel,
} from '@console/internal/models';

export {
  getNodeStatusGroups,
  getPodStatusGroups,
  getPVCStatusGroups,
  getVSStatusGroups,
} from '@console/shared/src/components/dashboard/inventory-card/utils';

interface ClusterPrometheusInventory extends NonNullable<
  ResolvedExtension<DashboardsOverviewInventoryItem>['properties']['prometheus']
> {}
interface ProjectPrometheusInventory extends NonNullable<
  ResolvedExtension<DashboardsProjectOverviewInventoryItem>['properties']['prometheus']
> {}

export const clusterNodePrometheus: ClusterPrometheusInventory = {
  getQuery: getNodeInventoryQuery,
  mapper: getPrometheusNodeStatusGroups,
};
export const clusterPodPrometheus: ClusterPrometheusInventory = {
  getQuery: getPodInventoryQuery,
  mapper: getPrometheusPodStatusGroups,
};
export const clusterStorageClassPrometheus: ClusterPrometheusInventory = {
  getQuery: () => getInventoryCountQuery('kube_storageclass_info', 'storageclass'),
  mapper: getPrometheusInventoryCount,
};
export const clusterPVCPrometheus: ClusterPrometheusInventory = {
  getQuery: getPVCInventoryQuery,
  mapper: getPrometheusPVCStatusGroups,
};

export const projectDeploymentPrometheus: ProjectPrometheusInventory = {
  getQuery: (namespace) =>
    getInventoryCountQuery('kube_deployment_spec_replicas', 'deployment', namespace),
  mapper: getPrometheusInventoryCount,
};
export const projectDeploymentConfigPrometheus: ProjectPrometheusInventory = {
  getQuery: (namespace) =>
    getInventoryCountQuery(
      'openshift_deploymentconfig_spec_replicas',
      'deploymentconfig',
      namespace,
      'openshift-state-metrics',
    ),
  mapper: getPrometheusInventoryCount,
};
export const projectStatefulSetPrometheus: ProjectPrometheusInventory = {
  getQuery: (namespace) =>
    getInventoryCountQuery('kube_statefulset_replicas', 'statefulset', namespace),
  mapper: getPrometheusInventoryCount,
};
export const projectPodPrometheus: ProjectPrometheusInventory = {
  getQuery: getPodInventoryQuery,
  mapper: getPrometheusPodStatusGroups,
};
export const projectPVCPrometheus: ProjectPrometheusInventory = {
  getQuery: getPVCInventoryQuery,
  mapper: getPrometheusPVCStatusGroups,
};
export const projectServicePrometheus: ProjectPrometheusInventory = {
  getQuery: (namespace) => getInventoryCountQuery('kube_service_info', 'service', namespace),
  mapper: getPrometheusInventoryCount,
};
export const projectRoutePrometheus: ProjectPrometheusInventory = {
  getQuery: (namespace) =>
    getInventoryCountQuery('openshift_route_info', 'route', namespace, 'openshift-state-metrics'),
  mapper: getPrometheusInventoryCount,
};
export const projectConfigMapPrometheus: ProjectPrometheusInventory = {
  getQuery: (namespace) => getInventoryCountQuery('kube_configmap_info', 'configmap', namespace),
  mapper: getPrometheusInventoryCount,
};
export const projectSecretPrometheus: ProjectPrometheusInventory = {
  getQuery: (namespace) => getInventoryCountQuery('kube_secret_info', 'secret', namespace),
  mapper: getPrometheusInventoryCount,
};

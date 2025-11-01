import { Map as ImmutableMap } from 'immutable';
import { ResourceDetailsPage, ResourcePage, ResourceListPage } from '@console/plugin-sdk';
import {
  ResourceDetailsPage as DynamicResourceDetailsPage,
  ResourceListPage as DynamicResourceListPage,
} from '@console/dynamic-plugin-sdk';
import { referenceForModel, GroupVersionKind, referenceForExtensionModel } from '../module/k8s';
import {
  AlertmanagerModel,
  AppliedClusterResourceQuotaModel,
  BuildConfigModel,
  BuildModel,
  ClusterOperatorModel,
  ClusterRoleModel,
  ClusterVersionModel,
  ConfigMapModel,
  ContainerModel,
  CronJobModel,
  ClusterResourceQuotaModel,
  CustomResourceDefinitionModel,
  DaemonSetModel,
  DeploymentConfigModel,
  DeploymentModel,
  GroupModel,
  HorizontalPodAutoscalerModel,
  ImageStreamModel,
  ImageStreamTagModel,
  JobModel,
  LimitRangeModel,
  MachineAutoscalerModel,
  MachineConfigModel,
  MachineConfigPoolModel,
  MachineHealthCheckModel,
  MachineModel,
  MachineSetModel,
  NamespaceModel,
  NodeModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
  PodModel,
  ProjectModel,
  PrometheusModel,
  ReplicaSetModel,
  ReplicationControllerModel,
  ResourceQuotaModel,
  RoleBindingModel,
  RoleModel,
  SecretModel,
  ServiceAccountModel,
  ServiceMonitorModel,
  StatefulSetModel,
  StorageClassModel,
  VolumeAttributesClassModel,
  TemplateInstanceModel,
  UserModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  ClusterRoleBindingModel,
  ControlPlaneMachineSetModel,
} from '../models';
import { PodDisruptionBudgetModel } from '@console/app/src/models';

const addResourcePage = (
  map: ImmutableMap<ResourceMapKey, ResourceMapValue>,
  page: ResourcePage,
) => {
  const key = page.properties?.modelParser
    ? page.properties?.modelParser(page.properties.model)
    : referenceForModel(page.properties.model);
  if (!map.has(key)) {
    map.set(key, page.properties.loader);
  }
};

const addDynamicResourcePage = (
  map: ImmutableMap<ResourceMapKey, ResourceMapValue>,
  page: DynamicResourcePage,
) => {
  const key = referenceForExtensionModel(page.properties.model);
  if (!map.has(key)) {
    map.set(key, page.properties.component);
  }
};

type ResourceMapKey = GroupVersionKind | string;
type ResourceMapValue = () => Promise<React.ComponentType<any>>;
type DynamicResourcePage = DynamicResourceListPage | DynamicResourceDetailsPage;

export const baseDetailsPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(ConfigMapModel), () =>
    import('./configmap' /* webpackChunkName: "configmap" */).then((m) => m.ConfigMapsDetailsPage),
  )
  .set(referenceForModel(ContainerModel), () =>
    import('./container' /* webpackChunkName: "container" */).then((m) => m.ContainersDetailsPage),
  )
  .set(referenceForModel(DaemonSetModel), () =>
    import('./daemon-set' /* webpackChunkName: "daemon-set" */).then(
      (m) => m.DaemonSetsDetailsPage,
    ),
  )
  .set(referenceForModel(DeploymentConfigModel), () =>
    import('./deployment-config' /* webpackChunkName: "deployment-config" */).then(
      (m) => m.DeploymentConfigsDetailsPage,
    ),
  )
  .set(referenceForModel(DeploymentModel), () =>
    import('./deployment' /* webpackChunkName: "deployment" */).then(
      (m) => m.DeploymentsDetailsPage,
    ),
  )
  .set(referenceForModel(BuildConfigModel), () =>
    import('./build-config' /* webpackChunkName: "build-config" */).then(
      (m) => m.BuildConfigsDetailsPage,
    ),
  )
  .set(referenceForModel(BuildModel), () =>
    import('./build' /* webpackChunkName: "build" */).then((m) => m.BuildsDetailsPage),
  )
  .set(referenceForModel(ImageStreamModel), () =>
    import('./image-stream' /* webpackChunkName: "image-stream" */).then(
      (m) => m.ImageStreamsDetailsPage,
    ),
  )
  .set(referenceForModel(ImageStreamTagModel), () =>
    import('./image-stream-tag' /* webpackChunkName: "image-stream-tag" */).then(
      (m) => m.ImageStreamTagsDetailsPage,
    ),
  )
  .set(referenceForModel(JobModel), () =>
    import('./job' /* webpackChunkName: "job" */).then((m) => m.JobsDetailsPage),
  )
  .set(referenceForModel(CronJobModel), () =>
    import('./cron-job' /* webpackChunkName: "cron-job" */).then((m) => m.CronJobsDetailsPage),
  )
  .set(referenceForModel(ProjectModel), () =>
    import('./namespace' /* webpackChunkName: "namespace" */).then((m) => m.ProjectsDetailsPage),
  )
  .set(referenceForModel(NamespaceModel), () =>
    import('./namespace' /* webpackChunkName: "namespace" */).then((m) => m.NamespacesDetailsPage),
  )
  .set(referenceForModel(NodeModel), () =>
    import(
      '@console/app/src/components/nodes/NodeDetailsPage' /* webpackChunkName: "node-detail" */
    ).then((m) => m.default),
  )
  .set(referenceForModel(MachineAutoscalerModel), () =>
    import('./machine-autoscaler' /* webpackChunkName: "machine-autoscaler" */).then(
      (m) => m.MachineAutoscalerDetailsPage,
    ),
  )
  .set(referenceForModel(MachineConfigModel), () =>
    import('./machine-config' /* webpackChunkName: "machine-config" */).then(
      (m) => m.MachineConfigDetailsPage,
    ),
  )
  .set(referenceForModel(MachineConfigPoolModel), () =>
    import('./machine-config-pool' /* webpackChunkName: "machine-config-pool" */).then(
      (m) => m.MachineConfigPoolDetailsPage,
    ),
  )
  .set(referenceForModel(MachineModel), () =>
    import('./machine' /* webpackChunkName: "machine" */).then((m) => m.MachineDetailsPage),
  )
  .set(referenceForModel(MachineSetModel), () =>
    import('./machine-set' /* webpackChunkName: "machine-set" */).then(
      (m) => m.MachineSetDetailsPage,
    ),
  )
  .set(referenceForModel(ControlPlaneMachineSetModel), () =>
    import('./control-plane-machine-set' /* webpackChunkName: "control-plane-machine-set" */).then(
      (m) => m.ControlPlaneMachineSetDetailsPage,
    ),
  )
  .set(referenceForModel(MachineHealthCheckModel), () =>
    import('./machine-health-check' /* webpackChunkName: "machine-health-check" */).then(
      (m) => m.MachineHealthCheckDetailsPage,
    ),
  )
  .set(referenceForModel(PodModel), () =>
    import('./pod' /* webpackChunkName: "pod" */).then((m) => m.PodsDetailsPage),
  )
  .set(referenceForModel(ReplicaSetModel), () =>
    import('./replicaset' /* webpackChunkName: "replicaset" */).then(
      (m) => m.ReplicaSetsDetailsPage,
    ),
  ) //TODO should be replica-set
  .set(referenceForModel(ReplicationControllerModel), () =>
    import('./replication-controller' /* webpackChunkName: "replication-controller" */).then(
      (m) => m.ReplicationControllersDetailsPage,
    ),
  )
  .set(referenceForModel(SecretModel), () =>
    import('./secret' /* webpackChunkName: "secret" */).then((m) => m.SecretsDetailsPage),
  )
  .set(referenceForModel(ServiceAccountModel), () =>
    import('./service-account' /* webpackChunkName: "service-account" */).then(
      (m) => m.ServiceAccountsDetailsPage,
    ),
  )
  .set(referenceForModel(ClusterRoleModel), () =>
    import('./RBAC/role' /* webpackChunkName: "role" */).then((m) => m.ClusterRolesDetailsPage),
  )
  .set(referenceForModel(RoleModel), () =>
    import('./RBAC/role' /* webpackChunkName: "role" */).then((m) => m.RolesDetailsPage),
  )
  .set(referenceForModel(ClusterRoleBindingModel), () =>
    import('./RBAC/role' /* webpackChunkName: "role" */).then(
      (m) => m.ClusterRoleBindingsDetailsPage,
    ),
  )
  .set(referenceForModel(UserModel), () =>
    import('./user' /* webpackChunkName: "user" */).then((m) => m.UserDetailsPage),
  )
  .set(referenceForModel(GroupModel), () =>
    import('./group' /* webpackChunkName: "group" */).then((m) => m.GroupDetailsPage),
  )
  .set(referenceForModel(AlertmanagerModel), () =>
    import('./alert-manager' /* webpackChunkName: "alert-manager" */).then(
      (m) => m.AlertManagersDetailsPage,
    ),
  )
  .set(referenceForModel(StatefulSetModel), () =>
    import('./stateful-set' /* webpackChunkName: "stateful-set" */).then(
      (m) => m.StatefulSetsDetailsPage,
    ),
  )
  .set(referenceForModel(ResourceQuotaModel), () =>
    import('./resource-quota' /* webpackChunkName: "resource-quota" */).then(
      (m) => m.ResourceQuotasDetailsPage,
    ),
  )
  .set(referenceForModel(ClusterResourceQuotaModel), () =>
    import('./resource-quota' /* webpackChunkName: "resource-quota" */).then(
      (m) => m.ResourceQuotasDetailsPage,
    ),
  )
  .set(referenceForModel(AppliedClusterResourceQuotaModel), () =>
    import('./resource-quota' /* webpackChunkName: "resource-quota" */).then(
      (m) => m.AppliedClusterResourceQuotasDetailsPage,
    ),
  )
  .set(referenceForModel(LimitRangeModel), () =>
    import('./limit-range' /* webpackChunkName: "limit-range" */).then(
      (m) => m.LimitRangeDetailsPage,
    ),
  )
  .set(referenceForModel(HorizontalPodAutoscalerModel), () =>
    import('./hpa' /* webpackChunkName: "hpa" */).then(
      (m) => m.HorizontalPodAutoscalersDetailsPage,
    ),
  )
  .set(referenceForModel(PersistentVolumeModel), () =>
    import('./persistent-volume' /* webpackChunkName: "persistent-volume" */).then(
      (m) => m.PersistentVolumesDetailsPage,
    ),
  )
  .set(referenceForModel(PersistentVolumeClaimModel), () =>
    import('./persistent-volume-claim' /* webpackChunkName: "persistent-volume-claim" */).then(
      (m) => m.PersistentVolumeClaimsDetailsPage,
    ),
  )
  .set(referenceForModel(StorageClassModel), () =>
    import('./storage-class' /* webpackChunkName: "storage-class" */).then(
      (m) => m.StorageClassDetailsPage,
    ),
  )
  .set(referenceForModel(VolumeAttributesClassModel), () =>
    import('./volume-attributes-class' /* webpackChunkName: "volume-attributes-class" */).then(
      (m) => m.VolumeAttributesClassDetailsPage,
    ),
  )
  .set(referenceForModel(TemplateInstanceModel), () =>
    import('./template-instance' /* webpackChunkName: "template-instance" */).then(
      (m) => m.TemplateInstanceDetailsPage,
    ),
  )
  .set(referenceForModel(CustomResourceDefinitionModel), () =>
    import(
      './custom-resource-definition' /* webpackChunkName: "custom-resource-definition" */
    ).then((m) => m.CustomResourceDefinitionsDetailsPage),
  )
  .set(referenceForModel(ClusterOperatorModel), () =>
    import('./cluster-settings/cluster-operator' /* webpackChunkName: "cluster-operator" */).then(
      (m) => m.ClusterOperatorDetailsPage,
    ),
  )
  .set(referenceForModel(ClusterVersionModel), () =>
    import('./cluster-settings/cluster-version' /* webpackChunkName: "cluster-version" */).then(
      (m) => m.ClusterVersionDetailsPage,
    ),
  )
  .set(referenceForModel(PodDisruptionBudgetModel), () =>
    import('@console/app/src/components/pdb/PDBDetailsPage' /* webpackChunkName: "pdb" */).then(
      (m) => m.PodDisruptionBudgetDetailsPage,
    ),
  )
  .set(referenceForModel(VolumeSnapshotModel), () =>
    import(
      '@console/app/src/components/volume-snapshot/volume-snapshot-details' /* webpackChunkName: "volume-snapshot-details" */
    ).then((m) => m.default),
  )
  .set(referenceForModel(VolumeSnapshotClassModel), () =>
    import(
      '@console/app/src/components/volume-snapshot/volume-snapshot-class-details' /* webpackChunkName: "volume-snapshot-class-details" */
    ).then((m) => m.default),
  );

export const getResourceDetailsPages = (
  pluginPages: ResourceDetailsPage[] = [],
  dynamicPluginPages: DynamicResourceDetailsPage[] = [],
) =>
  ImmutableMap<ResourceMapKey, ResourceMapValue>()
    .merge(baseDetailsPages)
    .withMutations((map) => {
      pluginPages.forEach((page) => {
        addResourcePage(map, page);
      });
      dynamicPluginPages.forEach((page) => {
        addDynamicResourcePage(map, page);
      });
    });

export const baseListPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(ConfigMapModel), () =>
    import('./configmap' /* webpackChunkName: "configmap" */).then((m) => m.ConfigMapsPage),
  )
  .set(referenceForModel(DaemonSetModel), () =>
    import('./daemon-set' /* webpackChunkName: "daemon-set" */).then((m) => m.DaemonSetsPage),
  )
  .set(referenceForModel(DeploymentConfigModel), () =>
    import('./deployment-config' /* webpackChunkName: "deployment-config" */).then(
      (m) => m.DeploymentConfigsPage,
    ),
  )
  .set(referenceForModel(DeploymentModel), () =>
    import('./deployment' /* webpackChunkName: "deployment" */).then((m) => m.DeploymentsPage),
  )
  .set(referenceForModel(BuildConfigModel), () =>
    import('./build-config' /* webpackChunkName: "build-config" */).then((m) => m.BuildConfigsPage),
  )
  .set(referenceForModel(BuildModel), () =>
    import('./build' /* webpackChunkName: "build" */).then((m) => m.BuildsPage),
  )
  .set(referenceForModel(ImageStreamModel), () =>
    import('./image-stream' /* webpackChunkName: "image-stream" */).then((m) => m.ImageStreamsPage),
  )
  .set(referenceForModel(JobModel), () =>
    import('./job' /* webpackChunkName: "job" */).then((m) => m.JobsPage),
  )
  .set(referenceForModel(CronJobModel), () =>
    import('./cron-job' /* webpackChunkName: "cron-job" */).then((m) => m.CronJobsPage),
  )
  .set(referenceForModel(ProjectModel), () =>
    import('./namespace' /* webpackChunkName: "namespace" */).then((m) => m.ProjectsPage),
  )
  .set(referenceForModel(NamespaceModel), () =>
    import('./namespace' /* webpackChunkName: "namespace" */).then((m) => m.NamespacesPage),
  )
  .set(referenceForModel(NodeModel), () =>
    import('@console/app/src/components/nodes/NodesPage' /* webpackChunkName: "node" */).then(
      (m) => m.default,
    ),
  )
  .set(referenceForModel(MachineAutoscalerModel), () =>
    import('./machine-autoscaler' /* webpackChunkName: "machine-autoscaler" */).then(
      (m) => m.MachineAutoscalerPage,
    ),
  )
  .set(referenceForModel(MachineConfigModel), () =>
    import('./machine-config' /* webpackChunkName: "machine-config" */).then(
      (m) => m.MachineConfigPage,
    ),
  )
  .set(referenceForModel(MachineConfigPoolModel), () =>
    import('./machine-config-pool' /* webpackChunkName: "machine-config-pool" */).then(
      (m) => m.MachineConfigPoolPage,
    ),
  )
  .set(referenceForModel(MachineModel), () =>
    import('./machine' /* webpackChunkName: "machine" */).then((m) => m.MachinePage),
  )
  .set(referenceForModel(MachineHealthCheckModel), () =>
    import('./machine-health-check' /* webpackChunkName: "machine-health-check" */).then(
      (m) => m.MachineHealthCheckPage,
    ),
  )
  .set(referenceForModel(MachineSetModel), () =>
    import('./machine-set' /* webpackChunkName: "machine-set" */).then((m) => m.MachineSetPage),
  )
  .set(referenceForModel(ControlPlaneMachineSetModel), () =>
    import('./control-plane-machine-set' /* webpackChunkName: "control-plane-machine-set" */).then(
      (m) => m.ControlPlaneMachineSetListPage,
    ),
  )
  .set(referenceForModel(PodModel), () =>
    import('./pod' /* webpackChunkName: "pod" */).then((m) => m.PodsPage),
  )
  .set(referenceForModel(ReplicaSetModel), () =>
    import('./replicaset' /* webpackChunkName: "replicaset" */).then((m) => m.ReplicaSetsPage),
  ) //TODO should be replica-set
  .set(referenceForModel(ReplicationControllerModel), () =>
    import('./replication-controller' /* webpackChunkName: "replication-controller" */).then(
      (m) => m.ReplicationControllersPage,
    ),
  )
  .set(referenceForModel(SecretModel), () =>
    import('./secret' /* webpackChunkName: "secret" */).then((m) => m.SecretsPage),
  )
  .set(referenceForModel(ServiceAccountModel), () =>
    import('./service-account' /* webpackChunkName: "service-account" */).then(
      (m) => m.ServiceAccountsPage,
    ),
  )
  .set(referenceForModel(RoleModel), () =>
    import('./RBAC/role' /* webpackChunkName: "role" */).then((m) => m.RolesPage),
  )
  .set(referenceForModel(RoleBindingModel), () =>
    import('./RBAC/bindings' /* webpackChunkName: "bindings" */).then((m) => m.RoleBindingsPage),
  )
  .set(referenceForModel(UserModel), () =>
    import('./user' /* webpackChunkName: "user" */).then((m) => m.UserPage),
  )
  .set(referenceForModel(GroupModel), () =>
    import('./group' /* webpackChunkName: "group" */).then((m) => m.GroupPage),
  )
  .set(referenceForModel(PrometheusModel), () =>
    import('./prometheus' /* webpackChunkName: "prometheus" */).then(
      (m) => m.PrometheusInstancesPage,
    ),
  )
  .set(referenceForModel(ServiceMonitorModel), () =>
    import('./service-monitor' /* webpackChunkName: "service-monitor" */).then(
      (m) => m.ServiceMonitorsPage,
    ),
  )
  .set(referenceForModel(AlertmanagerModel), () =>
    import('./alert-manager' /* webpackChunkName: "alert-manager" */).then(
      (m) => m.AlertManagersPage,
    ),
  )
  .set(referenceForModel(StatefulSetModel), () =>
    import('./stateful-set' /* webpackChunkName: "stateful-set" */).then((m) => m.StatefulSetsPage),
  )
  .set(referenceForModel(ResourceQuotaModel), () =>
    import('./resource-quota' /* webpackChunkName: "resource-quota" */).then(
      (m) => m.ResourceQuotasPage,
    ),
  )
  .set(referenceForModel(AppliedClusterResourceQuotaModel), () =>
    import('./resource-quota' /* webpackChunkName: "resource-quota" */).then(
      (m) => m.AppliedClusterResourceQuotasPage,
    ),
  )
  .set(referenceForModel(LimitRangeModel), () =>
    import('./limit-range' /* webpackChunkName: "limit-range" */).then((m) => m.LimitRangeListPage),
  )
  .set(referenceForModel(HorizontalPodAutoscalerModel), () =>
    import('./hpa' /* webpackChunkName: "hpa" */).then((m) => m.HorizontalPodAutoscalersPage),
  )
  .set(referenceForModel(PersistentVolumeModel), () =>
    import('./persistent-volume' /* webpackChunkName: "persistent-volume" */).then(
      (m) => m.PersistentVolumesPage,
    ),
  )
  .set(referenceForModel(PersistentVolumeClaimModel), () =>
    import('./persistent-volume-claim' /* webpackChunkName: "persistent-volume-claim" */).then(
      (m) => m.PersistentVolumeClaimsPage,
    ),
  )
  .set(referenceForModel(StorageClassModel), () =>
    import('./storage-class' /* webpackChunkName: "storage-class" */).then(
      (m) => m.StorageClassPage,
    ),
  )
  .set(referenceForModel(VolumeAttributesClassModel), () =>
    import('./volume-attributes-class' /* webpackChunkName: "volume-attributes-class" */).then(
      (m) => m.VolumeAttributesClassPage,
    ),
  )
  .set(referenceForModel(TemplateInstanceModel), () =>
    import('./template-instance' /* webpackChunkName: "template-instance" */).then(
      (m) => m.TemplateInstancePage,
    ),
  )
  .set(referenceForModel(CustomResourceDefinitionModel), () =>
    import(
      './custom-resource-definition' /* webpackChunkName: "custom-resource-definition" */
    ).then((m) => m.CustomResourceDefinitionsPage),
  )
  .set(referenceForModel(ClusterOperatorModel), () =>
    import('./cluster-settings/cluster-operator' /* webpackChunkName: "cluster-operator" */).then(
      (m) => m.ClusterOperatorPage,
    ),
  )
  .set(referenceForModel(PodDisruptionBudgetModel), () =>
    import('@console/app/src/components/pdb/PDBPage' /* webpackChunkName: "pdb" */).then(
      (m) => m.PodDisruptionBudgetsPage,
    ),
  )
  .set(referenceForModel(VolumeSnapshotModel), () =>
    import(
      '@console/app/src/components/volume-snapshot/volume-snapshot' /* webpackChunkName: "volume-snapshot" */
    ).then((m) => m.default),
  )
  .set(referenceForModel(VolumeSnapshotClassModel), () =>
    import(
      '@console/app/src/components/volume-snapshot/volume-snapshot-class' /* webpackChunkName: "volume-snapshot-class" */
    ).then((m) => m.default),
  );

export const getResourceListPages = (
  pluginPages: ResourceListPage[] = [],
  dynamicPluginPages: DynamicResourceListPage[] = [],
) =>
  ImmutableMap<ResourceMapKey, ResourceMapValue>()
    .merge(baseListPages)
    .withMutations((map) => {
      pluginPages.forEach((page) => {
        addResourcePage(map, page);
      });
      dynamicPluginPages.forEach((page) => {
        addDynamicResourcePage(map, page);
      });
    });

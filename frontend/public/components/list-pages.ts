import { Map as ImmutableMap } from 'immutable';
import { PodDisruptionBudgetModel } from '@console/app/src/models';
import type { ResourceListPage } from '@console/dynamic-plugin-sdk';
import {
  AlertmanagerModel,
  AppliedClusterResourceQuotaModel,
  BuildConfigModel,
  BuildModel,
  ClusterOperatorModel,
  ConfigMapModel,
  CronJobModel,
  DaemonSetModel,
  DeploymentConfigModel,
  DeploymentModel,
  GroupModel,
  HorizontalPodAutoscalerModel,
  ImageStreamModel,
  JobModel,
  LimitRangeModel,
  MachineAutoscalerModel,
  MachineConfigModel,
  MachineConfigPoolModel,
  MachineHealthCheckModel,
  MachineModel,
  MachineSetModel,
  ControlPlaneMachineSetModel,
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
  CustomResourceDefinitionModel,
} from '../models';
import type { GroupVersionKind } from '../module/k8s';
import { referenceForModel, referenceForExtensionModel } from '../module/k8s';

type ResourceMapKey = GroupVersionKind | string;
type ResourceMapValue = () => Promise<React.ComponentType<any>>;

const addDynamicResourcePage = (
  map: ImmutableMap<ResourceMapKey, ResourceMapValue>,
  page: ResourceListPage,
) => {
  const key = referenceForExtensionModel(page.properties.model);
  if (!map.has(key)) {
    map.set(key, page.properties.component);
  }
};

const baseListPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
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
      (m) => m.NodesPage,
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
    import('./pod-list' /* webpackChunkName: "pod" */).then((m) => m.PodsPage),
  )
  .set(referenceForModel(ReplicaSetModel), () =>
    import('./replicaset' /* webpackChunkName: "replicaset" */).then((m) => m.ReplicaSetsPage),
  ) // TODO should be replica-set
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
    // eslint-disable-next-line import/no-cycle
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
    ).then((m) => m.VolumeSnapshotPage),
  )
  .set(referenceForModel(VolumeSnapshotClassModel), () =>
    import(
      '@console/app/src/components/volume-snapshot/volume-snapshot-class' /* webpackChunkName: "volume-snapshot-class" */
    ).then((m) => m.VolumeSnapshotClassPage),
  );

export const getResourceListPages = (pluginPages: ResourceListPage[] = []) =>
  ImmutableMap<ResourceMapKey, ResourceMapValue>()
    .merge(baseListPages)
    .withMutations((map) => {
      pluginPages.forEach((page) => {
        addDynamicResourcePage(map, page);
      });
    });

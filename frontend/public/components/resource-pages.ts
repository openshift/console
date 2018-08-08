/* eslint-disable no-unused-vars */

import { ConfigMapsPage, ConfigMapsDetailsPage } from './configmap';
import { ClustersPage, ClustersDetailsPage } from './clusters';
import { ContainersDetailsPage } from './container';
import { DaemonSetsPage, DaemonSetsDetailsPage } from './daemonset';
import { DeploymentConfigsPage, DeploymentConfigsDetailsPage } from './deployment-config';
import { DeploymentsPage, DeploymentsDetailsPage } from './deployment';
import { BuildConfigsPage, BuildConfigsDetailsPage } from './build-config';
import { BuildsPage, BuildsDetailsPage } from './build';
import { ImageStreamsPage, ImageStreamsDetailsPage } from './image-stream';
import { ImageStreamTagsDetailsPage } from './image-stream-tag';
import { JobsPage, JobsDetailsPage } from './job';
import { CronJobsPage, CronJobsDetailsPage } from './cron-job';
import { NamespacesPage, NamespacesDetailsPage, ProjectsPage, ProjectsDetailsPage } from './namespace';
import { NetworkPoliciesPage, NetworkPoliciesDetailsPage } from './network-policy';
import { NodesPage, NodesDetailsPage } from './node';
import { PodsPage, PodsDetailsPage } from './pod';
import { ReplicaSetsPage, ReplicaSetsDetailsPage } from './replicaset';
import { ReplicationControllersPage, ReplicationControllersDetailsPage } from './replication-controller';
import { SecretsPage, SecretsDetailsPage } from './secret';
import { ServiceAccountsPage, ServiceAccountsDetailsPage } from './service-account';
import { ServicesPage, ServicesDetailsPage } from './service';
import { IngressesPage, IngressesDetailsPage } from './ingress';
import { RoutesPage, RoutesDetailsPage } from './routes';
import { ClusterRolesDetailsPage, RolesPage, RolesDetailsPage } from './RBAC/role';
import { RoleBindingsPage } from './RBAC/bindings';
import { PrometheusInstancesPage } from './prometheus';
import { ServiceMonitorsPage } from './service-monitor';
import { AlertManagersPage, AlertManagersDetailsPage } from './alert-manager';
import { StatefulSetsPage, StatefulSetsDetailsPage } from './stateful-set';
import { ResourceQuotasPage, ResourceQuotasDetailsPage } from './resource-quota';
import { HorizontalPodAutoscalersPage, HorizontalPodAutoscalersDetailsPage } from './hpa';
import { PersistentVolumesPage, PersistentVolumesDetailsPage } from './persistent-volume';
import { PersistentVolumeClaimsPage, PersistentVolumeClaimsDetailsPage } from './persistent-volume-claim';
import { DefaultPage, DefaultDetailsPage } from './default-resource';
import { ReportsPage, ReportsDetailsPage, ReportGenerationQueriesPage, ReportGenerationQueriesDetailsPage, ReportReference, ReportGenerationQueryReference } from './chargeback';
import { CustomResourceDefinitionsPage } from './custom-resource-definition';
import { ClusterServiceVersionsPage, ClusterServiceVersionsDetailsPage, ClusterServiceVersionResourcesDetailsPage } from './cloud-services';
import { SubscriptionsPage, SubscriptionDetailsPage } from './cloud-services/subscription';
import { InstallPlansPage, InstallPlanDetailsPage } from './cloud-services/install-plan';
import { CatalogSourceDetailsPage, CatalogSourcesPage } from './cloud-services/catalog-source';
import { StorageClassPage, StorageClassDetailsPage } from './storage-class';

import { referenceForModel, GroupVersionKind } from '../module/k8s';
import {
  ClusterModel,
  ConfigMapModel,
  DaemonSetModel,
  DeploymentModel,
  DeploymentConfigModel,
  BuildConfigModel,
  BuildModel,
  ImageStreamModel,
  JobModel,
  CronJobModel,
  ProjectModel,
  NamespaceModel,
  NetworkPolicyModel,
  NodeModel,
  PodModel,
  ReplicaSetModel,
  ReplicationControllerModel,
  SecretModel,
  ServiceAccountModel,
  ServiceModel,
  IngressModel,
  RouteModel,
  RoleModel,
  RoleBindingModel,
  PrometheusModel,
  ServiceMonitorModel,
  AlertmanagerModel,
  StatefulSetModel,
  ResourceQuotaModel,
  HorizontalPodAutoscalerModel,
  PersistentVolumeModel,
  PersistentVolumeClaimModel,
  StorageClassModel,
  CustomResourceDefinitionModel,
  ClusterServiceVersionModel,
  SubscriptionModel,
  InstallPlanModel,
  ImageStreamTagModel,
  ClusterRoleModel,
  ContainerModel,
  CatalogSourceModel,
} from '../models';

export const resourceListPages = new Map<GroupVersionKind | string, React.ComponentType<any>>()
  .set('Default', DefaultPage)
  .set(referenceForModel(ClusterModel), ClustersPage)
  .set(referenceForModel(ConfigMapModel), ConfigMapsPage)
  .set(referenceForModel(DaemonSetModel), DaemonSetsPage)
  .set(referenceForModel(DeploymentConfigModel), DeploymentConfigsPage)
  .set(referenceForModel(DeploymentModel), DeploymentsPage)
  .set(referenceForModel(BuildConfigModel), BuildConfigsPage)
  .set(referenceForModel(BuildModel), BuildsPage)
  .set(referenceForModel(ImageStreamModel), ImageStreamsPage)
  .set(referenceForModel(JobModel), JobsPage)
  .set(referenceForModel(CronJobModel), CronJobsPage)
  .set(referenceForModel(ProjectModel), ProjectsPage)
  .set(referenceForModel(NamespaceModel), NamespacesPage)
  .set(referenceForModel(NetworkPolicyModel), NetworkPoliciesPage)
  .set(referenceForModel(NodeModel), NodesPage)
  .set(referenceForModel(PodModel), PodsPage)
  .set(referenceForModel(ReplicaSetModel), ReplicaSetsPage)
  .set(referenceForModel(ReplicationControllerModel), ReplicationControllersPage)
  .set(referenceForModel(SecretModel), SecretsPage)
  .set(referenceForModel(ServiceAccountModel), ServiceAccountsPage)
  .set(referenceForModel(ServiceModel), ServicesPage)
  .set(referenceForModel(IngressModel), IngressesPage)
  .set(referenceForModel(RouteModel), RoutesPage)
  .set(referenceForModel(RoleModel), RolesPage)
  .set(referenceForModel(RoleBindingModel), RoleBindingsPage)
  .set(referenceForModel(PrometheusModel), PrometheusInstancesPage)
  .set(referenceForModel(ServiceMonitorModel), ServiceMonitorsPage)
  .set(referenceForModel(AlertmanagerModel), AlertManagersPage)
  .set(referenceForModel(StatefulSetModel), StatefulSetsPage)
  .set(referenceForModel(ResourceQuotaModel), ResourceQuotasPage)
  .set(referenceForModel(HorizontalPodAutoscalerModel), HorizontalPodAutoscalersPage)
  .set(referenceForModel(PersistentVolumeModel), PersistentVolumesPage)
  .set(referenceForModel(PersistentVolumeClaimModel), PersistentVolumeClaimsPage)
  .set(ReportReference, ReportsPage)
  .set(ReportGenerationQueryReference, ReportGenerationQueriesPage)
  .set(referenceForModel(StorageClassModel), StorageClassPage)
  .set(referenceForModel(CustomResourceDefinitionModel), CustomResourceDefinitionsPage)
  .set(referenceForModel(ClusterServiceVersionModel), ClusterServiceVersionsPage)
  .set(referenceForModel(CatalogSourceModel), CatalogSourcesPage)
  .set(referenceForModel(SubscriptionModel), SubscriptionsPage)
  .set(referenceForModel(InstallPlanModel), InstallPlansPage)
  /*  ------------------------------- NOTE -------------------------------

  To avoid circular imports, the keys in this list are manually duplicated in ./resource-dropdown.tsx !

  ------------------------------------------------------------------------
  */
  ;

export const resourceDetailPages = new Map<GroupVersionKind | string, React.ComponentType<any>>()
  .set('Default', DefaultDetailsPage)
  .set(referenceForModel(ClusterModel), ClustersDetailsPage)
  .set(referenceForModel(ConfigMapModel), ConfigMapsDetailsPage)
  .set(referenceForModel(ContainerModel), ContainersDetailsPage)
  .set(referenceForModel(DaemonSetModel), DaemonSetsDetailsPage)
  .set(referenceForModel(DeploymentConfigModel), DeploymentConfigsDetailsPage)
  .set(referenceForModel(DeploymentModel), DeploymentsDetailsPage)
  .set(referenceForModel(BuildConfigModel), BuildConfigsDetailsPage)
  .set(referenceForModel(BuildModel), BuildsDetailsPage)
  .set(referenceForModel(ImageStreamModel), ImageStreamsDetailsPage)
  .set(referenceForModel(ImageStreamTagModel), ImageStreamTagsDetailsPage)
  .set(referenceForModel(JobModel), JobsDetailsPage)
  .set(referenceForModel(CronJobModel), CronJobsDetailsPage)
  .set(referenceForModel(ProjectModel), ProjectsDetailsPage)
  .set(referenceForModel(NamespaceModel), NamespacesDetailsPage)
  .set(referenceForModel(NetworkPolicyModel), NetworkPoliciesDetailsPage)
  .set(referenceForModel(NodeModel), NodesDetailsPage)
  .set(referenceForModel(PodModel), PodsDetailsPage)
  .set(referenceForModel(ReplicaSetModel), ReplicaSetsDetailsPage)
  .set(referenceForModel(ReplicationControllerModel), ReplicationControllersDetailsPage)
  .set(referenceForModel(SecretModel), SecretsDetailsPage)
  .set(referenceForModel(ServiceAccountModel), ServiceAccountsDetailsPage)
  .set(referenceForModel(ServiceModel), ServicesDetailsPage)
  .set(referenceForModel(IngressModel), IngressesDetailsPage)
  .set(referenceForModel(RouteModel), RoutesDetailsPage)
  .set(referenceForModel(ClusterRoleModel), ClusterRolesDetailsPage)
  .set(referenceForModel(RoleModel), RolesDetailsPage)
  .set(referenceForModel(AlertmanagerModel), AlertManagersDetailsPage)
  .set(referenceForModel(StatefulSetModel), StatefulSetsDetailsPage)
  .set(referenceForModel(ResourceQuotaModel), ResourceQuotasDetailsPage)
  .set(referenceForModel(HorizontalPodAutoscalerModel), HorizontalPodAutoscalersDetailsPage)
  .set(referenceForModel(PersistentVolumeModel), PersistentVolumesDetailsPage)
  .set(referenceForModel(PersistentVolumeClaimModel), PersistentVolumeClaimsDetailsPage)
  .set(ReportReference, ReportsDetailsPage)
  .set(ReportGenerationQueryReference, ReportGenerationQueriesDetailsPage)
  .set(referenceForModel(StorageClassModel), StorageClassDetailsPage)
  .set(referenceForModel(ClusterServiceVersionModel), ClusterServiceVersionsDetailsPage)
  .set(referenceForModel(CatalogSourceModel), CatalogSourceDetailsPage)
  .set('ClusterServiceVersionResources', ClusterServiceVersionResourcesDetailsPage)
  .set(referenceForModel(SubscriptionModel), SubscriptionDetailsPage)
  .set(referenceForModel(InstallPlanModel), InstallPlanDetailsPage);

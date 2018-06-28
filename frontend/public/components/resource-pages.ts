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
import { EtcdClustersPage } from './etcd-cluster';
import { PrometheusInstancesPage } from './prometheus';
import { ServiceMonitorsPage } from './service-monitor';
import { AlertManagersPage, AlertManagersDetailsPage } from './alert-manager';
import { PodVulnsPage, PodVulnsDetailsPage } from './secscan/pod-vuln';
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
import { CatalogSourceDetailsPage } from './cloud-services/catalog-source';
import { StorageClassPage, StorageClassDetailsPage } from './storage-class';

import { K8sKind } from '../module/k8s';
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
  EtcdClusterModel,
  PrometheusModel,
  ServiceMonitorModel,
  AlertmanagerModel,
  PodVulnModel,
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

export const resourceListPages = new Map<K8sKind | string, React.ComponentType<any>>()
  .set('Default', DefaultPage)
  .set(ClusterModel, ClustersPage)
  .set(ConfigMapModel, ConfigMapsPage)
  .set(DaemonSetModel, DaemonSetsPage)
  .set(DeploymentConfigModel, DeploymentConfigsPage)
  .set(DeploymentModel, DeploymentsPage)
  .set(BuildConfigModel, BuildConfigsPage)
  .set(BuildModel, BuildsPage)
  .set(ImageStreamModel, ImageStreamsPage)
  .set(JobModel, JobsPage)
  .set(CronJobModel, CronJobsPage)
  .set(ProjectModel, ProjectsPage)
  .set(NamespaceModel, NamespacesPage)
  .set(NetworkPolicyModel, NetworkPoliciesPage)
  .set(NodeModel, NodesPage)
  .set(PodModel, PodsPage)
  .set(ReplicaSetModel, ReplicaSetsPage)
  .set(ReplicationControllerModel, ReplicationControllersPage)
  .set(SecretModel, SecretsPage)
  .set(ServiceAccountModel, ServiceAccountsPage)
  .set(ServiceModel, ServicesPage)
  .set(IngressModel, IngressesPage)
  .set(RouteModel, RoutesPage)
  .set(RoleModel, RolesPage)
  .set(RoleBindingModel, RoleBindingsPage)
  .set(EtcdClusterModel, EtcdClustersPage)
  .set(PrometheusModel, PrometheusInstancesPage)
  .set(ServiceMonitorModel, ServiceMonitorsPage)
  .set(AlertmanagerModel, AlertManagersPage)
  .set(PodVulnModel, PodVulnsPage)
  .set(StatefulSetModel, StatefulSetsPage)
  .set(ResourceQuotaModel, ResourceQuotasPage)
  .set(HorizontalPodAutoscalerModel, HorizontalPodAutoscalersPage)
  .set(PersistentVolumeModel, PersistentVolumesPage)
  .set(PersistentVolumeClaimModel, PersistentVolumeClaimsPage)
  .set(ReportReference, ReportsPage)
  .set(ReportGenerationQueryReference, ReportGenerationQueriesPage)
  .set(StorageClassModel, StorageClassPage)
  .set(CustomResourceDefinitionModel, CustomResourceDefinitionsPage)
  .set(ClusterServiceVersionModel, ClusterServiceVersionsPage)
  .set(SubscriptionModel, SubscriptionsPage)
  .set(InstallPlanModel, InstallPlansPage)
  /*  ------------------------------- NOTE -------------------------------

  To avoid circular imports, the keys in this list are manually duplicated in ./resource-dropdown.tsx !

  ------------------------------------------------------------------------
  */
  ;

export const resourceDetailPages = new Map<K8sKind | string, React.ComponentType<any>>()
  .set('Default', DefaultDetailsPage)
  .set(ClusterModel, ClustersDetailsPage)
  .set(ConfigMapModel, ConfigMapsDetailsPage)
  .set(ContainerModel, ContainersDetailsPage)
  .set(DaemonSetModel, DaemonSetsDetailsPage)
  .set(DeploymentConfigModel, DeploymentConfigsDetailsPage)
  .set(DeploymentModel, DeploymentsDetailsPage)
  .set(BuildConfigModel, BuildConfigsDetailsPage)
  .set(BuildModel, BuildsDetailsPage)
  .set(ImageStreamModel, ImageStreamsDetailsPage)
  .set(ImageStreamTagModel, ImageStreamTagsDetailsPage)
  .set(JobModel, JobsDetailsPage)
  .set(CronJobModel, CronJobsDetailsPage)
  .set(ProjectModel, ProjectsDetailsPage)
  .set(NamespaceModel, NamespacesDetailsPage)
  .set(NetworkPolicyModel, NetworkPoliciesDetailsPage)
  .set(NodeModel, NodesDetailsPage)
  .set(PodModel, PodsDetailsPage)
  .set(ReplicaSetModel, ReplicaSetsDetailsPage)
  .set(ReplicationControllerModel, ReplicationControllersDetailsPage)
  .set(SecretModel, SecretsDetailsPage)
  .set(ServiceAccountModel, ServiceAccountsDetailsPage)
  .set(ServiceModel, ServicesDetailsPage)
  .set(IngressModel, IngressesDetailsPage)
  .set(RouteModel, RoutesDetailsPage)
  .set(ClusterRoleModel, ClusterRolesDetailsPage)
  .set(RoleModel, RolesDetailsPage)
  .set(AlertmanagerModel, AlertManagersDetailsPage)
  .set(PodVulnModel, PodVulnsDetailsPage)
  .set(StatefulSetModel, StatefulSetsDetailsPage)
  .set(ResourceQuotaModel, ResourceQuotasDetailsPage)
  .set(HorizontalPodAutoscalerModel, HorizontalPodAutoscalersDetailsPage)
  .set(PersistentVolumeModel, PersistentVolumesDetailsPage)
  .set(PersistentVolumeClaimModel, PersistentVolumeClaimsDetailsPage)
  .set(ReportReference, ReportsDetailsPage)
  .set(ReportGenerationQueryReference, ReportGenerationQueriesDetailsPage)
  .set(StorageClassModel, StorageClassDetailsPage)
  .set(ClusterServiceVersionModel, ClusterServiceVersionsDetailsPage)
  .set(CatalogSourceModel, CatalogSourceDetailsPage)
  .set('ClusterServiceVersionResources', ClusterServiceVersionResourcesDetailsPage)
  .set(SubscriptionModel, SubscriptionDetailsPage)
  .set(InstallPlanModel, InstallPlanDetailsPage);

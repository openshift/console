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
import { ReportsPage, ReportsDetailsPage, ReportGenerationQueriesPage, ReportGenerationQueriesDetailsPage } from './chargeback';
import { CustomResourceDefinitionsPage } from './custom-resource-definition';
import { ClusterServiceVersionsPage, ClusterServiceVersionsDetailsPage, ClusterServiceVersionResourcesDetailsPage } from './cloud-services';
import { SubscriptionsPage, SubscriptionDetailsPage } from './cloud-services/subscription';
import { InstallPlansPage, InstallPlanDetailsPage } from './cloud-services/install-plan';
import { CatalogSourceDetailsPage } from './cloud-services/catalog-source';
import { StorageClassPage, StorageClassDetailsPage } from './storage-class';

export const resourceListPages = new Map<string, React.ComponentType<any>>()
  .set('Clusters', ClustersPage)
  .set('ConfigMaps', ConfigMapsPage)
  .set('DaemonSets', DaemonSetsPage)
  .set('DeploymentConfigs', DeploymentConfigsPage)
  .set('Deployments', DeploymentsPage)
  .set('BuildConfigs', BuildConfigsPage)
  .set('Builds', BuildsPage)
  .set('ImageStreams', ImageStreamsPage)
  .set('Jobs', JobsPage)
  .set('CronJobs', CronJobsPage)
  .set('Projects', ProjectsPage)
  .set('Namespaces', NamespacesPage)
  .set('NetworkPolicies', NetworkPoliciesPage)
  .set('Nodes', NodesPage)
  .set('Pods', PodsPage)
  .set('ReplicaSets', ReplicaSetsPage)
  .set('ReplicationControllers', ReplicationControllersPage)
  .set('Secrets', SecretsPage)
  .set('ServiceAccounts', ServiceAccountsPage)
  .set('Services', ServicesPage)
  .set('Ingresses', IngressesPage)
  .set('Routes', RoutesPage)
  .set('Roles', RolesPage)
  .set('RoleBindings', RoleBindingsPage)
  .set('EtcdClusters', EtcdClustersPage)
  .set('Prometheuses', PrometheusInstancesPage)
  .set('ServiceMonitors', ServiceMonitorsPage)
  .set('Alertmanagers', AlertManagersPage)
  .set('PodVulns', PodVulnsPage)
  .set('StatefulSets', StatefulSetsPage)
  .set('ResourceQuotas', ResourceQuotasPage)
  .set('HorizontalPodAutoscalers', HorizontalPodAutoscalersPage)
  .set('PersistentVolumes', PersistentVolumesPage)
  .set('PersistentVolumeClaims', PersistentVolumeClaimsPage)
  .set('Reports', ReportsPage)
  .set('ReportGenerationQuerys', ReportGenerationQueriesPage)
  .set('Default', DefaultPage)
  .set('StorageClasses', StorageClassPage)
  .set('CustomResourceDefinitions', CustomResourceDefinitionsPage)
  .set('ClusterServiceVersion-v1s', ClusterServiceVersionsPage)
  .set('Subscription-v1s', SubscriptionsPage)
  .set('InstallPlan-v1s', InstallPlansPage)
  /*  ------------------------------- NOTE -------------------------------

  To avoid circular imports, the keys in this list are manually duplicated in ./resource-dropdown.tsx !

  ------------------------------------------------------------------------
  */
  ;

export const resourceDetailPages = new Map<string, React.ComponentType<any>>()
  .set('Clusters', ClustersDetailsPage)
  .set('ConfigMaps', ConfigMapsDetailsPage)
  .set('Containers', ContainersDetailsPage)
  .set('DaemonSets', DaemonSetsDetailsPage)
  .set('DeploymentConfigs', DeploymentConfigsDetailsPage)
  .set('Deployments', DeploymentsDetailsPage)
  .set('BuildConfigs', BuildConfigsDetailsPage)
  .set('Builds', BuildsDetailsPage)
  .set('ImageStreams', ImageStreamsDetailsPage)
  .set('ImageStreamTags', ImageStreamTagsDetailsPage)
  .set('Jobs', JobsDetailsPage)
  .set('CronJobs', CronJobsDetailsPage)
  .set('Projects', ProjectsDetailsPage)
  .set('Namespaces', NamespacesDetailsPage)
  .set('NetworkPolicies', NetworkPoliciesDetailsPage)
  .set('Nodes', NodesDetailsPage)
  .set('Pods', PodsDetailsPage)
  .set('ReplicaSets', ReplicaSetsDetailsPage)
  .set('ReplicationControllers', ReplicationControllersDetailsPage)
  .set('Secrets', SecretsDetailsPage)
  .set('ServiceAccounts', ServiceAccountsDetailsPage)
  .set('Services', ServicesDetailsPage)
  .set('Ingresses', IngressesDetailsPage)
  .set('Routes', RoutesDetailsPage)
  .set('ClusterRoles', ClusterRolesDetailsPage)
  .set('Roles', RolesDetailsPage)
  .set('Alertmanagers', AlertManagersDetailsPage)
  .set('PodVulns', PodVulnsDetailsPage)
  .set('StatefulSets', StatefulSetsDetailsPage)
  .set('ResourceQuotas', ResourceQuotasDetailsPage)
  .set('HorizontalPodAutoscalers', HorizontalPodAutoscalersDetailsPage)
  .set('PersistentVolumes', PersistentVolumesDetailsPage)
  .set('PersistentVolumeClaims', PersistentVolumeClaimsDetailsPage)
  .set('Reports', ReportsDetailsPage)
  .set('ReportGenerationQuerys', ReportGenerationQueriesDetailsPage)
  .set('Default', DefaultDetailsPage)
  .set('StorageClasses', StorageClassDetailsPage)
  .set('ClusterServiceVersion-v1s', ClusterServiceVersionsDetailsPage)
  .set('CatalogSource-v1s', CatalogSourceDetailsPage)
  .set('ClusterServiceVersionResources', ClusterServiceVersionResourcesDetailsPage)
  .set('Subscription-v1s', SubscriptionDetailsPage)
  .set('InstallPlan-v1s', InstallPlanDetailsPage);

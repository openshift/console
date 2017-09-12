import { ConfigMapsPage, ConfigMapsDetailsPage } from './configmap';
import { ContainersDetailsPage } from './container';
import { DaemonSetsPage, DaemonSetsDetailsPage } from './daemonset';
import { DeploymentsPage, DeploymentsDetailsPage } from './deployment';
import { JobsPage, JobsDetailsPage } from './job';
import { NamespacesPage, NamespacesDetailsPage } from './namespace';
import { NetworkPoliciesList, NetworkPoliciesPage, NetworkPoliciesDetailsPage } from './network-policy';
import { NodesPage, NodesDetailsPage } from './node';
import { PodsPage, PodsDetailsPage } from './pod';
import { ReplicaSetsPage, ReplicaSetsDetailsPage } from './replicaset';
import { ReplicationControllersPage, ReplicationControllersDetailsPage } from './replication-controller';
import { SecretsPage, SecretsDetailsPage } from './secret';
import { ServiceAccountsPage, ServiceAccountsDetailsPage } from './service-account';
import { ServicesPage, ServicesDetailsPage } from './service';
import { IngressesPage, IngressesDetailsPage } from './ingress';
import { ClusterRolesDetailsPage, RolesPage, RolesDetailsPage } from './RBAC/role';
import { RoleBindingsPage } from './RBAC/bindings';
import { EtcdClustersPage, EtcdClustersDetailsPage } from './etcd-cluster';
import { PrometheusInstancesPage, PrometheusInstancesDetailsPage } from './prometheus';
import { ServiceMonitorsPage, ServiceMonitorsDetailsPage } from './service-monitor';
import { AlertManagersPage, AlertManagersDetailsPage } from './alert-manager';
import { PodVulnsPage, PodVulnsDetailsPage } from './secscan/pod-vuln';
import { StatefulSetsPage, StatefulSetsDetailsPage } from './stateful-set';
import { ResourceQuotasPage, ResourceQuotasDetailsPage } from './resource-quota';
import { PersistentVolumesPage, PersistentVolumesDetailsPage } from './persistent-volume';
import { PersistentVolumeClaimsPage, PersistentVolumeClaimsDetailsPage } from './persistent-volume-claim';
import { DefaultPage, DefaultDetailsPage } from './default-resource';
import { CustomResourceDefinitionsPage } from './custom-resource-definition';

export const resourceListPages = new Map<string, React.ComponentType<any>>()
  .set('ConfigMaps',ConfigMapsPage)
  .set('DaemonSets', DaemonSetsPage)
  .set('Deployments', DeploymentsPage)
  .set('Jobs', JobsPage)
  .set('Namespaces', NamespacesPage)
  .set('NetworkPoliciesList', NetworkPoliciesList)
  .set('NetworkPolicies', NetworkPoliciesPage)
  .set('Nodes', NodesPage)
  .set('Pods', PodsPage)
  .set('ReplicaSets', ReplicaSetsPage)
  .set('ReplicationControllers', ReplicationControllersPage)
  .set('Secrets', SecretsPage)
  .set('ServiceAccounts', ServiceAccountsPage)
  .set('ServiceAccounts', ServiceAccountsPage)
  .set('Services', ServicesPage)
  .set('Ingresses', IngressesPage)
  .set('Roles', RolesPage)
  .set('RoleBindings', RoleBindingsPage)
  .set('etcdClusters', EtcdClustersPage)
  .set('PrometheusInstances', PrometheusInstancesPage)
  .set('ServiceMonitors', ServiceMonitorsPage)
  .set('AlertManagers', AlertManagersPage)
  .set('PodVulns', PodVulnsPage)
  .set('StatefulSets', StatefulSetsPage)
  .set('ResourceQuotas', ResourceQuotasPage)
  .set('PersistentVolumes', PersistentVolumesPage)
  .set('PersistentVolumeClaims', PersistentVolumeClaimsPage)
  .set('Default', DefaultPage)
  .set('CustomResourceDefinitions', CustomResourceDefinitionsPage);

export const resourceDetailPages = new Map<string, React.ComponentType<any>>()
  .set('ConfigMaps', ConfigMapsDetailsPage)
  .set('Containers', ContainersDetailsPage)
  .set('DaemonSets', DaemonSetsDetailsPage)
  .set('Deployments', DeploymentsDetailsPage)
  .set('Jobs', JobsDetailsPage)
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
  .set('ClusterRoles', ClusterRolesDetailsPage)
  .set('Roles', RolesDetailsPage)
  .set('etcdClusters', EtcdClustersDetailsPage)
  .set('PrometheusInstances', PrometheusInstancesDetailsPage)
  .set('ServiceMonitors', ServiceMonitorsDetailsPage)
  .set('AlertManagers', AlertManagersDetailsPage)
  .set('PodVulns', PodVulnsDetailsPage)
  .set('StatefulSets', StatefulSetsDetailsPage)
  .set('ResourceQuotas', ResourceQuotasDetailsPage)
  .set('PersistentVolumes', PersistentVolumesDetailsPage)
  .set('PersistentVolumeClaims', PersistentVolumeClaimsDetailsPage)
  .set('Default', DefaultDetailsPage);

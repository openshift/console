// eslint-disable-next-line no-unused-vars
import { K8sKind } from '../module/k8s';

export const UICatalogEntryModel: K8sKind = {
  kind: 'UICatalogEntry-v1',
  label: 'UICatalogEntry-v1',
  labelPlural: 'UICatalogEntry-v1s',
  basePath: '/apis/app.coreos.com/',
  apiVersion: 'v1alpha1',
  path: 'uicatalogentry-v1s',
  abbr: 'CE',
  namespaced: true,
  crd: true,
  plural: 'uicatalogentry-v1s',
};

export const ClusterServiceVersionModel: K8sKind = {
  kind: 'ClusterServiceVersion-v1',
  label: 'Application',
  labelPlural: 'Applications',
  basePath: '/apis/app.coreos.com/',
  apiVersion: 'v1alpha1',
  path: 'clusterserviceversion-v1s',
  abbr: 'CSV',
  namespaced: true,
  crd: true,
  plural: 'clusterserviceversion-v1s',
  propagationPolicy : 'Foreground',
};

export const InstallPlanModel: K8sKind = {
  kind: 'InstallPlan-v1',
  label: 'InstallPlan-v1',
  labelPlural: 'InstallPlan-v1s',
  basePath: '/apis/app.coreos.com/',
  apiVersion: 'v1alpha1',
  path: 'installplan-v1s',
  abbr: 'IP',
  namespaced: true,
  crd: true,
  plural: 'installplan-v1s',
};

export const EtcdClusterModel: K8sKind = {
  kind: 'EtcdCluster',
  label: 'etcd Cluster',
  labelPlural: 'Etcd Clusters',
  basePath: '/apis/etcd.database.coreos.com/',
  apiVersion: 'v1beta2',
  path: 'etcdclusters',
  abbr: 'EC',
  namespaced: true,
  crd: true,
  plural: 'etcdclusters',
  propagationPolicy : 'Foreground',
};

export const PrometheusModel: K8sKind = {
  kind: 'Prometheus',
  label: 'Prometheus',
  labelPlural: 'Prometheuses',
  basePath: '/apis/monitoring.coreos.com/',
  apiVersion: 'v1',
  path: 'prometheuses',
  abbr: 'PI',
  namespaced: true,
  crd: true,
  plural: 'prometheuses',
  propagationPolicy : 'Foreground',
};

export const ServiceMonitorModel: K8sKind = {
  kind: 'ServiceMonitor',
  label: 'Service Monitor',
  labelPlural: 'Service Monitors',
  basePath: '/apis/monitoring.coreos.com/',
  apiVersion: 'v1',
  path: 'servicemonitors',
  abbr: 'SM',
  namespaced: true,
  crd: true,
  plural: 'servicemonitors',
  propagationPolicy : 'Foreground',
};

export const AlertmanagerModel: K8sKind = {
  kind: 'Alertmanager',
  label: 'Alertmanager',
  labelPlural: 'Alertmanagers',
  basePath: '/apis/monitoring.coreos.com/',
  apiVersion: 'v1',
  path: 'alertmanagers',
  abbr: 'AM',
  namespaced: true,
  crd: true,
  plural: 'alertmanagers',
  propagationPolicy : 'Foreground',
};

export const VaultServiceModel: K8sKind = {
  kind: 'VaultService',
  label: 'VaultService',
  labelPlural: 'VaultServices',
  basePath: '/apis/vault.security.coreos.com/',
  apiVersion: 'v1alpha1',
  path: 'vaultservices',
  abbr: 'VS',
  namespaced: true,
  crd: true,
  plural: 'vaultservices',
  propagationPolicy : 'Foreground',
};

export const ClusterModel: K8sKind = {
  kind: 'Cluster',
  label: 'Cluster',
  labelPlural: 'Clusters',
  basePath: '/apis/multicluster.coreos.com/',
  path: 'clusters',
  apiVersion: 'v1',
  crd: true,
  plural: 'clusters',
  abbr: 'C',
  namespaced: false,
};

import { K8sModel } from '../../../api/common-types';

export const TestDeploymentModel: K8sModel = {
  label: 'Deployment',
  apiVersion: 'v1',
  apiGroup: 'apps',
  plural: 'deployments',
  abbr: 'D',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Deployment',
  id: 'deployment',
  labelPlural: 'Deployments',
};

export const TestPodModel: K8sModel = {
  apiVersion: 'v1',
  label: 'Pod',
  plural: 'pods',
  abbr: 'P',
  namespaced: true,
  kind: 'Pod',
  id: 'pod',
  labelPlural: 'Pods',
};

export const TestClusterResourceQuotaModel: K8sModel = {
  label: 'ClusterResourceQuota',
  // t('public~ClusterResourceQuota')
  labelKey: 'public~ClusterResourceQuota',
  apiGroup: 'quota.openshift.io',
  apiVersion: 'v1',
  plural: 'clusterresourcequotas',
  abbr: 'CRQ',
  namespaced: false,
  kind: 'ClusterResourceQuota',
  id: 'clusterresourcequota',
  labelPlural: 'ClusterResourceQuotas',
  // t('public~ClusterResourceQuotas')
  labelPluralKey: 'public~ClusterResourceQuotas',
  crd: true,
};

export const TestPrometheusModel: K8sModel = {
  kind: 'Prometheus',
  label: 'Prometheus',
  // t('public~Prometheus')
  labelKey: 'public~Prometheus',
  labelPlural: 'Prometheuses',
  // t('public~Prometheuses')
  labelPluralKey: 'public~Prometheuses',
  apiGroup: 'monitoring.coreos.com',
  apiVersion: 'v1',
  abbr: 'PI',
  namespaced: true,
  crd: true,
  plural: 'prometheuses',
  propagationPolicy: 'Foreground',
};

import { K8sKind } from '@console/internal/module/k8s';

export const OperatorSourceModel: K8sKind = {
  kind: 'OperatorSource',
  label: 'OperatorSource',
  labelPlural: 'OperatorSource',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1',
  abbr: 'OSRC',
  namespaced: true,
  crd: true,
  plural: 'operatorsources',
};

export const CatalogSourceModel: K8sKind = {
  kind: 'CatalogSource',
  label: 'CatalogSource',
  labelPlural: 'CatalogSources',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  abbr: 'CS',
  namespaced: true,
  crd: true,
  plural: 'catalogsources',
};

export const PackageManifestModel: K8sKind = {
  kind: 'PackageManifest',
  label: 'PackageManifest',
  labelPlural: 'PackageManifests',
  apiGroup: 'packages.operators.coreos.com',
  apiVersion: 'v1',
  abbr: 'PM',
  namespaced: true,
  crd: true,
  plural: 'packagemanifests',
};

export const ClusterServiceVersionModel: K8sKind = {
  kind: 'ClusterServiceVersion',
  label: 'ClusterServiceVersion',
  labelPlural: 'ClusterServiceVersions',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  abbr: 'CSV',
  namespaced: true,
  crd: true,
  plural: 'clusterserviceversions',
  propagationPolicy: 'Foreground',
  legacyPluralURL: true,
};

export const InstallPlanModel: K8sKind = {
  kind: 'InstallPlan',
  label: 'InstallPlan',
  labelPlural: 'InstallPlans',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  abbr: 'IP',
  namespaced: true,
  crd: true,
  plural: 'installplans',
  legacyPluralURL: true,
};

export const SubscriptionModel: K8sKind = {
  kind: 'Subscription',
  label: 'Subscription',
  labelPlural: 'Subscriptions',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  abbr: 'SUB',
  namespaced: true,
  crd: true,
  plural: 'subscriptions',
  legacyPluralURL: true,
};

export const OperatorGroupModel: K8sKind = {
  kind: 'OperatorGroup',
  label: 'OperatorGroup',
  labelPlural: 'OperatorGroups',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1',
  abbr: 'OG',
  namespaced: true,
  crd: true,
  plural: 'operatorgroups',
};

export const OperatorHubModel: K8sKind = {
  kind: 'OperatorHub',
  label: 'OperatorHub',
  labelPlural: 'OperatorHubs',
  apiGroup: 'config.openshift.io',
  apiVersion: 'v1',
  abbr: 'OH',
  namespaced: false,
  crd: true,
  plural: 'operatorhubs',
};

import { K8sKind } from '@console/internal/module/k8s';

export const OperatorSourceModel: K8sKind = {
  kind: 'OperatorSource',
  label: 'OperatorSource',
  // t('olm~OperatorSource')
  labelKey: 'olm~OperatorSource',
  labelPlural: 'OperatorSource',
  // t('olm~OperatorSource')
  labelPluralKey: 'olm~OperatorSource',
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
  // t('olm~CatalogSource')
  labelKey: 'olm~CatalogSource',
  labelPlural: 'CatalogSources',
  // t('olm~CatalogSources')
  labelPluralKey: 'olm~CatalogSources',
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
  // t('olm~PackageManifest')
  labelKey: 'olm~PackageManifest',
  labelPlural: 'PackageManifests',
  // t('olm~PackageManifests')
  labelPluralKey: 'olm~PackageManifests',
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
  // t('olm~ClusterServiceVersion')
  labelKey: 'olm~ClusterServiceVersion',
  labelPlural: 'ClusterServiceVersions',
  // t('olm~ClusterServiceVersions')
  labelPluralKey: 'olm~ClusterServiceVersions',
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
  // t('olm~InstallPlan')
  labelKey: 'olm~InstallPlan',
  labelPlural: 'InstallPlans',
  // t('olm~InstallPlans')
  labelPluralKey: 'olm~InstallPlans',
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
  // t('olm~Subscription')
  labelKey: 'olm~Subscription',
  labelPlural: 'Subscriptions',
  // t('olm~Subscriptions')
  labelPluralKey: 'olm~Subscriptions',
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
  // t('olm~OperatorGroup')
  labelKey: 'olm~OperatorGroup',
  labelPlural: 'OperatorGroups',
  // t('olm~OperatorGroups')
  labelPluralKey: 'olm~OperatorGroups',
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
  // t('olm~OperatorHub')
  labelKey: 'olm~OperatorHub',
  labelPlural: 'OperatorHubs',
  // t('olm~OperatorHubs')
  labelPluralKey: 'olm~OperatorHubs',
  apiGroup: 'config.openshift.io',
  apiVersion: 'v1',
  abbr: 'OH',
  namespaced: false,
  crd: true,
  plural: 'operatorhubs',
};

export const CLUSTER_CATALOG_GROUP = 'olm.operatorframework.io';
export const CLUSTER_CATALOG_VERSION = 'v1';
export const CLUSTER_CATALOG_KIND = 'ClusterCatalog';
export const CLUSTER_CATALOG_GROUP_VERSION_KIND = {
  group: CLUSTER_CATALOG_GROUP,
  version: CLUSTER_CATALOG_VERSION,
  kind: CLUSTER_CATALOG_KIND,
};

// User settings key for OLMv1 toggle
export const OLMV1_ENABLED_USER_SETTING_KEY = 'console.olmv1.enabled';

// Feature flag for OLMv1 enablement based on user preference
export const FLAG_OLMV1_ENABLED = 'OLMV1_ENABLED';
export const CATALOG_LABEL_KEY = 'olm.operatorframework.io/metadata.name';

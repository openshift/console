export const CATALOG_LABEL_KEY = 'olm.operatorframework.io/metadata.name';

/** Set by the `console.flag/model` extension for the OLMv1 ClusterCatalog CRD. */
export const FLAG_CLUSTER_CATALOG_API = 'CLUSTER_CATALOG_API';
/** Set by the `console.flag/model` extension for the OLMv1 ClusterExtension CRD. */
export const FLAG_CLUSTER_EXTENSION_API = 'CLUSTER_EXTENSION_API';
/** Set by the `console.flag/model` extension for the OLMv0 ClusterServiceVersion CRD. */
export const FLAG_OPERATOR_LIFECYCLE_MANAGER = 'OPERATOR_LIFECYCLE_MANAGER';
/** Derived: either OLM is installed, so the Installed Operators page has at least one tab. */
export const FLAG_INSTALLED_OPERATORS = 'INSTALLED_OPERATORS';

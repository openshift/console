export const ALLOW_SERVICE_BINDING = 'ALLOW_SERVICE_BINDING';
export const FLAG_OPENSHIFT_PIPELINE = 'OPENSHIFT_PIPELINE';
export const CLUSTER_PIPELINE_NS = 'openshift';

/** URL query params that adjust scope / purpose of the page */
export enum QUERY_PROPERTIES {
  /** For defining a contextual application group (ie, add new workload into this application group) */
  APPLICATION = 'application',
  /** For defining a contextual source of the redirect (ie, connect a new workload from this contextual source) */
  CONTEXT_SOURCE = 'contextSource',
}

export const RESOURCE_NAME_TRUNCATE_LENGTH = 13;

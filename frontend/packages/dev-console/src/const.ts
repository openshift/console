/** URL query params that adjust scope / purpose of the page */
export enum QUERY_PROPERTIES {
  /** For defining a contextual application group (ie, add new workload into this application group) */
  APPLICATION = 'application',
  /** For defining a contextual source of the redirect (ie, connect a new workload from this contextual source) */
  CONTEXT_SOURCE = 'contextSource',
  CONTEXT_ACTION = 'action',
}

/** connects to action for resources */
export const INCONTEXT_ACTIONS_CONNECTS_TO = 'connectsTo';
/** connector action for service binding */
export const INCONTEXT_ACTIONS_SERVICE_BINDING = 'serviceBinding';

export enum CONNECTOR_INCONTEXT_ACTIONS {
  /** connects to action for resources */
  connectsTo = 'connectsTo',
}

export const SERVICE_BINDING_ENABLED = 'SERVICE_BINDING_ENABLED';

export const SAMPLE_APPLICATION_GROUP = 'sample-app';

export const PREFERRED_RESOURCE_TYPE_USER_SETTING_KEY = 'devconsole.preferredResourceType';
export const LAST_RESOURCE_TYPE_STORAGE_KEY = `devconsole.last.resource-type`;

export const NAME_LABEL = 'app.kubernetes.io/name';
export const INSTANCE_LABEL = 'app.kubernetes.io/instance';

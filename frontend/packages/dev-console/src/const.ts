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

export enum CONNECTOR_INCONTEXT_ACTIONS {
  /** connects to action for resources */
  connectsTo = 'connectsTo',
}

export const SAMPLE_APPLICATION_GROUP = 'sample-app';

export const PREFERRED_RESOURCE_TYPE_USER_SETTING_KEY = 'devconsole.preferredResourceType';
export const LAST_RESOURCE_TYPE_STORAGE_KEY = `devconsole.last.resource-type`;
export const LAST_BUILD_PAGE_TAB_STORAGE_KEY = `devconsole.last.build-page-tab`;

export const NAME_LABEL = 'app.kubernetes.io/name';
export const INSTANCE_LABEL = 'app.kubernetes.io/instance';
export const RUNTIME_LABEL = 'app.openshift.io/runtime';
export const RUNTIME_ICON_LABEL = 'app.openshift.io/runtime-icon';
export const FLAG_DEVELOPER_CATALOG = 'DEVELOPER_CATALOG';
export const FLAG_OPERATOR_BACKED_SERVICE_CATALOG_TYPE = 'OPERATOR_BACKED_SERVICE_CATALOG_TYPE';
export const FLAG_SAMPLE_CATALOG_TYPE = 'SAMPLE_CATALOG_TYPE';
export const OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID = 'OperatorBackedService';
export const SAMPLE_CATALOG_TYPE_ID = 'Sample';
export const ADD_TO_PROJECT = 'add-to-project';

export const CUSTOM_ICON_ANNOTATION = 'app.openshift.io/custom-icon';

export const FLAG_JAVA_IMAGE_STREAM_ENABLED = 'JAVA_IMAGE_STREAM_ENABLED';
export const IMAGESTREAM_NAMESPACE = 'openshift';
export const JAVA_IMAGESTREAM_NAME = 'java';

export const FLAG_OPENSHIFT_DEPLOYMENTCONFIG = 'OPENSHIFT_DEPLOYMENTCONFIG';
export const FLAG_OPENSHIFT_BUILDCONFIG = 'OPENSHIFT_BUILDCONFIG';
export const FLAG_OPENSHIFT_PIPELINE = 'OPENSHIFT_PIPELINE';

// Pipeline constants
export const CLUSTER_PIPELINE_NS = 'openshift';
export const PIPELINE_RUNTIME_LABEL = 'pipeline.openshift.io/runtime';
export const FLAG_OPENSHIFT_PIPELINE_AS_CODE = 'OPENSHIFT_PIPELINE_AS_CODE';
export const FUNC_PIPELINE_RUNTIME_LABEL = 'function.knative.dev/runtime';
export const PIPELINE_SERVICE_ACCOUNT = 'pipeline';
export const PIPELINE_RUNTIME_VERSION_LABEL = 'pipeline.openshift.io/runtime-version';
export const PIPELINE_STRATEGY_LABEL = 'pipeline.openshift.io/strategy';
export const preferredNameAnnotation = 'pipeline.openshift.io/preferredName';

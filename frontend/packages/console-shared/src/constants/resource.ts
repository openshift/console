// List of container status waiting reason values that we should call out as errors in project status rows.
export const CONTAINER_WAITING_STATE_ERROR_REASONS = [
  'CrashLoopBackOff',
  'ErrImagePull',
  'ImagePullBackOff',
];

// Annotation key for deployment config latest version
export const DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION =
  'openshift.io/deployment-config.latest-version';

export const DEPLOYMENT_CONFIG_NAME_ANNOTATION = 'openshift.io/deployment-config.name';

// Annotation key for deployment phase
export const DEPLOYMENT_PHASE_ANNOTATION = 'openshift.io/deployment.phase';

// Annotaton key for deployment revision
export const DEPLOYMENT_REVISION_ANNOTATION = 'deployment.kubernetes.io/revision';

// Display name for default overview group.
// Should not be a valid label key to avoid conflicts. https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#syntax-and-character-setexport
export const DEFAULT_GROUP_NAME = 'other resources';

// Interval at which metrics are retrieved and updated
export const METRICS_POLL_INTERVAL = 30 * 1000;

// Annotation key for image triggers
export const TRIGGERS_ANNOTATION = 'image.openshift.io/triggers';

export enum DEPLOYMENT_STRATEGY {
  rolling = 'Rolling',
  recreate = 'Recreate',
  rollingUpdate = 'RollingUpdate',
}

export enum DEPLOYMENT_PHASE {
  new = 'New',
  running = 'Running',
  pending = 'Pending',
  complete = 'Complete',
  failed = 'Failed',
  cancelled = 'Cancelled',
}

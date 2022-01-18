export enum StartedByLabel {
  triggers = 'triggers.tekton.dev/eventlistener',
}
export enum StartedByAnnotation {
  user = 'pipeline.openshift.io/started-by',
}
export enum TektonTaskAnnotation {
  minVersion = ' tekton.dev/pipelines.minVersion',
  tags = 'tekton.dev/tags',
  categories = 'tekton.dev/categories',
  installedFrom = 'openshift.io/installed-from',
}
export enum TektonTaskProviders {
  redhat = 'Red Hat',
  community = 'Community',
}
export enum TektonTaskLabel {
  providerType = 'operator.tekton.dev/provider-type',
  version = 'app.kubernetes.io/version',
}
export enum TektonResourceLabel {
  pipeline = 'tekton.dev/pipeline',
  pipelinerun = 'tekton.dev/pipelineRun',
  taskrun = 'tekton.dev/taskRun',
  pipelineTask = 'tekton.dev/pipelineTask',
}

export enum PipelineResourceType {
  git = 'git',
  image = 'image',
  cluster = 'cluster',
  storage = 'storage',
}

export enum VolumeTypes {
  NoWorkspace = 'noWorkspace',
  EmptyDirectory = 'emptyDirectory',
  ConfigMap = 'configMap',
  Secret = 'secret',
  PVC = 'pvc',
  VolumeClaimTemplate = 'volumeClaimTemplate',
}

export enum SecretAnnotationId {
  Git = 'git',
  Image = 'docker',
}

export const SecretAnnotationType = {
  [SecretAnnotationId.Git]: 'Git Server',
  [SecretAnnotationId.Image]: 'Image Registry',
};

export const PIPELINE_GA_VERSION = '1.4.0';
export const TRIGGERS_GA_VERSION = '1.6.0';
export const PIPELINE_SERVICE_ACCOUNT = 'pipeline';
export const PIPELINE_RUN_AUTO_START_FAILED = `bridge/pipeline-run-auto-start-failed`;

export const DEFAULT_CHART_HEIGHT = 275;
export const DEFAULT_LEGEND_CHART_HEIGHT = 375;
export const DEFAULT_TIME_RANGE = '1w';
export const DEFAULT_REFRESH_INTERVAL = '30s';
export const DEFAULT_SAMPLES = 60;

// Annotation for referencing pipeline name in case of PipelineRun with no reference to a Pipeline (embedded pipeline)
export const preferredNameAnnotation = 'pipeline.openshift.io/preferredName';

export const PIPELINE_NAMESPACE = 'openshift-pipelines';

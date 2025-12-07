import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';

export type ResourceTarget = 'inputs' | 'outputs';

export type TektonParam = {
  default?: string | string[];
  description?: string;
  name: string;
  type?: 'string' | 'array';
};

export type TektonTaskSteps = {
  // TODO: Figure out required fields
  name: string;
  args?: string[];
  command?: string[];
  image?: string;
  resources?: {}[] | {};
  env?: { name: string; value: string }[];
  script?: string[];
};

export type TaskResult = {
  name: string;
  description?: string;
};

export type TektonTaskSpec = {
  metadata?: {};
  description?: string;
  steps: TektonTaskSteps[];
  params?: TektonParam[];
  resources?: TektonResourceGroup<TektonResource>;
  results?: TaskResult[];
  workspaces?: TektonWorkspace[];
};

export type TektonResourceGroup<ResourceType> = {
  inputs?: ResourceType[];
  outputs?: ResourceType[];
};

/** Deprecated upstream - Workspaces are replacing Resources */
export type TektonResource = {
  name: string;
  optional?: boolean;
  type: string; // TODO: limit to known strings
};

export type TektonWorkspace = {
  name: string;
  description?: string;
  mountPath?: string;
  readOnly?: boolean;
  optional?: boolean;
};

export type TektonResultsRun = {
  name: string;
  value: string;
};

export interface Addon {
  enablePipelinesAsCode: boolean;
  params: Param[];
}

export interface Param {
  name: string;
  value: string;
}

export interface Dashboard {
  readonly: boolean;
}

export enum MetricsLevel {
  METRICS_PIPELINERUN_DURATION_TYPE = 'metrics.pipelinerun.duration-type',
  METRICS_PIPELINERUN_LEVEL = 'metrics.pipelinerun.level',
  METRICS_TASKRUN_DURATION_TYPE = 'metrics.taskrun.duration-type',
  METRICS_TASKRUN_LEVEL = 'metrics.taskrun.level',
}

export enum LevelTypes {
  PIPELINE = 'pipeline',
  PIPELINERUN = 'pipelinerun',
  TASK = 'task',
  TASKRUN = 'taskrun',
}

export enum DurationTypes {
  HISTOGRAM = 'histogram',
  LASTVALUE = 'lastvalue',
  NAMESPACE = 'namespace',
}

export interface Pipeline {
  'default-service-account': string;
  'disable-affinity-assistant': boolean;
  'disable-creds-init': boolean;
  'enable-api-fields': string;
  'enable-custom-tasks': boolean;
  'enable-tekton-oci-bundles': boolean;
  [MetricsLevel.METRICS_PIPELINERUN_DURATION_TYPE]: DurationTypes;
  [MetricsLevel.METRICS_PIPELINERUN_LEVEL]: LevelTypes;
  [MetricsLevel.METRICS_TASKRUN_DURATION_TYPE]: DurationTypes;
  [MetricsLevel.METRICS_TASKRUN_LEVEL]: LevelTypes;
  params: Param[];
  'require-git-ssh-secret-known-hosts': boolean;
  'running-in-environment-with-injected-sidecars': boolean;
  'scope-when-expressions-to-task': boolean;
}

export interface Pruner {
  keep: number;
  resources: string[];
  schedule: string;
}

export interface Trigger {
  'default-service-account': string;
  'enable-api-fields': string;
}

export interface Spec {
  addon: Addon;
  config: {};
  dashboard: Dashboard;
  hub: {};
  params: Param[];
  pipeline: Pipeline;
  profile: string;
  pruner: Pruner;
  targetNamespace: string;
  trigger: Trigger;
}

export interface Status {
  conditions: TektonConfigCondition[];
}

export interface TektonConfigCondition {
  lastTransitionTime: string;
  status: string;
  type: string;
}

export type TektonConfig = K8sResourceCommon & {
  spec: Spec;
  status: Status;
};

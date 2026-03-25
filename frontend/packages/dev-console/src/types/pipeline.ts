import type { RunStatus } from '@patternfly/react-topology';
import type {
  K8sResourceCommon,
  K8sResourceCondition,
  K8sResourceKind,
  ObjectMetadata,
} from '@console/internal/module/k8s';
import type { PLRTaskRunStep } from '@console/shipwright-plugin/src/types';
import type {
  TektonParam,
  TektonResource,
  TektonResourceGroup,
  TektonResultsRun,
  TektonTaskSpec,
  TektonWorkspace,
} from './coreTekton';

export type PipelineTaskRef = {
  kind?: string;
  name: string;
  resolver?: string;
  params?: PipelineTaskParam[];
};

export type PipelineTaskWorkspace = {
  name: string;
  workspace: string;
  optional?: boolean;
};

export type PipelineTaskResource = {
  name: string;
  resource?: string;
  from?: string[];
};

export type PipelineTaskParam = {
  name: string;
  value: any;
};

export type WhenExpression = {
  input: string;
  operator: string;
  values: string[];
};

export type PipelineResult = {
  name: string;
  value: string;
  description?: string;
};

export type PipelineTask = {
  name: string;
  params?: PipelineTaskParam[];
  resources?: TektonResourceGroup<PipelineTaskResource>;
  runAfter?: string[];
  taskRef?: PipelineTaskRef;
  taskSpec?: TektonTaskSpec;
  when?: WhenExpression[];
  workspaces?: PipelineTaskWorkspace[];
};

export type PipelineTaskWithStatus = PipelineTask & {
  status: {
    reason: RunStatus;
  };
};

export type PipelineSpec = {
  params?: TektonParam[];
  resources?: TektonResource[];
  serviceAccountName?: string;
  tasks: PipelineTask[];
  workspaces?: TektonWorkspace[];
  finally?: PipelineTask[];
  results?: PipelineResult[];
};

export type PipelineKind = K8sResourceCommon & {
  spec: PipelineSpec;
};

export type PipelineRunParam = {
  name: string;
  value: string | string[];

  // TODO: To be validated
  input?: string;
  output?: string;
  resource?: object;
};

export type PLRTaskRunData = {
  pipelineTaskName: string;
  status: {
    completionTime?: string;
    conditions: K8sResourceCondition[];
    /** Can be empty */
    podName: string;
    startTime: string;
    steps?: PLRTaskRunStep[];
    taskSpec?: TektonTaskSpec;
    taskResults?: { name: string; value: string }[]; // in tekton v1 taskResults is renamed to results
    results?: { name: string; value: string }[];
  };
};

export type ChildReferences = {
  apiVersion: string;
  kind: string;
  name: string;
  pipelineTaskName: string;
};

export type PipelineRunStatus = {
  succeededCondition?: string;
  creationTimestamp?: string;
  conditions?: K8sResourceCondition[];
  startTime?: string;
  completionTime?: string;
  taskRuns?: {
    [taskRunName: string]: PLRTaskRunData;
  };
  pipelineSpec: PipelineSpec;
  skippedTasks?: {
    name: string;
  }[];
  pipelineResults?: TektonResultsRun[]; // in tekton v1 pipelineResults is renamed to results
  results?: TektonResultsRun[];
  childReferences?: ChildReferences[];
};

export type PipelineRunEmbeddedResourceParam = { name: string; value: string };
export type PipelineRunEmbeddedResource = {
  name: string;
  resourceSpec: {
    params: PipelineRunEmbeddedResourceParam[];
    type: string;
  };
};
export type PipelineRunReferenceResource = {
  name: string;
  resourceRef: {
    name: string;
  };
};

export type VolumeTypeClaim = {
  metadata?: ObjectMetadata;
  spec: {
    accessModes: string[];
    resources: {
      requests: {
        storage: string;
      };
    };
    storageClassName?: string;
    volumeMode?: string;
  };
};

export type VolumeTypeSecret = {
  secretName: string;
  items?: {
    key: string;
    path: string;
  }[];
};

export type VolumeTypeConfigMaps = {
  name: string;
  items?: {
    key: string;
    path: string;
  }[];
};

export type VolumeTypePVC = {
  claimName: string;
};

export type PipelineRunResource = PipelineRunReferenceResource | PipelineRunEmbeddedResource;

export type PipelineRunWorkspace = {
  name: string;
  [volumeType: string]:
    | VolumeTypeSecret
    | VolumeTypeConfigMaps
    | VolumeTypePVC
    | VolumeTypeClaim
    | {};
};

export type PipelineRunKind = K8sResourceCommon & {
  spec: {
    pipelineRef?: { name?: string; resolver?: string; params?: PipelineTaskParam[] };
    pipelineSpec?: PipelineSpec;
    params?: PipelineRunParam[];
    workspaces?: PipelineRunWorkspace[];
    resources?: PipelineRunResource[];
    serviceAccountName?: string;
    timeout?: string;
    // Only used in a single case - cancelling a pipeline; should not be copied between PLRs
    status?: 'StoppedRunFinally' | 'PipelineRunPending' | 'CancelledRunFinally';
    // In tekton v1 ServiceAccountName is moved
    // to TaskRunTemplate as TaskRunTemplate.ServiceAccountName
    taskRunTemplate?: {
      serviceAccountName?: string;
    };
  };
  status?: PipelineRunStatus;
};

export type RepositoryStatus = {
  completionTime?: string;
  conditions?: K8sResourceCondition[];
  logurl?: string;
  pipelineRunName: string;
  sha?: string;
  startTime?: string;
  title?: string;
  event_type?: string;
  target_branch?: string;
};

export type RepositoryKind = K8sResourceKind & {
  spec?: {
    url: string;
    branch?: string;
    namespace?: string;
  };
  pipelinerun_status?: RepositoryStatus[];
};

export type TaskKind = K8sResourceCommon & {
  spec: TektonTaskSpec;
};

export type TaskKindAlpha = TaskKind & {
  spec: {
    inputs?: {
      params?: TektonParam[];
      resources?: TektonResource[];
    };
    outputs?: {
      resources?: TektonResource[];
    };
  };
};

export enum CustomRunStatus {
  RunCancelled = 'RunCancelled',
}

export type CustomRunKind = K8sResourceCommon & {
  spec: {
    customRef: {
      apiVersion: string;
      kind: string;
    };
    serviceAccountName?: string;
    status?: CustomRunStatus;
    statusMessage?: string;
  };
};

export enum VolumeTypes {
  NoWorkspace = 'noWorkspace',
  EmptyDirectory = 'emptyDirectory',
  ConfigMap = 'configMap',
  Secret = 'secret',
  PVC = 'pvc',
  VolumeClaimTemplate = 'volumeClaimTemplate',
}

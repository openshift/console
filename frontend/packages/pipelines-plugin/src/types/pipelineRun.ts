import { K8sResourceCommon, ObjectMetadata } from '@console/internal/module/k8s';
import { TektonResultsRun, TektonTaskSpec } from './coreTekton';
import { PipelineKind, PipelineSpec } from './pipeline';

export type PLRTaskRunStep = {
  container: string;
  imageID?: string;
  name: string;
  waiting?: {
    reason: string;
  };
  running?: {
    startedAt: string;
  };
  terminated?: {
    containerID: string;
    exitCode: number;
    finishedAt: string;
    reason: string;
    startedAt: string;
    message?: string;
  };
};

export type PLRTaskRunData = {
  pipelineTaskName: string;
  status: {
    completionTime?: string;
    conditions: Condition[];
    /** Can be empty */
    podName: string;
    startTime: string;
    steps?: PLRTaskRunStep[];
    taskSpec?: TektonTaskSpec;
    taskResults?: { name: string; value: string }[];
  };
};

export type PLRTaskRuns = {
  [taskRunName: string]: PLRTaskRunData;
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

export type PersistentVolumeClaimType = {
  persistentVolumeClaim: VolumeTypePVC;
};

export type VolumeClaimTemplateType = {
  volumeClaimTemplate: VolumeTypeClaim;
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

export type Condition = {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
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

export type PipelineRunParam = {
  name: string;
  value: string | string[];

  // TODO: To be validated
  input?: string;
  output?: string;
  resource?: object;
};

export type PipelineRunKind = K8sResourceCommon & {
  spec: {
    pipelineRef?: { name: string };
    pipelineSpec?: PipelineSpec;
    params?: PipelineRunParam[];
    workspaces?: PipelineRunWorkspace[];
    resources?: PipelineRunResource[];
    serviceAccountName?: string;
    timeout?: string;
    // Only used in a single case - cancelling a pipeline; should not be copied between PLRs
    status?: 'PipelineRunCancelled' | 'PipelineRunPending';
  };
  status?: {
    succeededCondition?: string;
    creationTimestamp?: string;
    conditions?: Condition[];
    startTime?: string;
    completionTime?: string;
    taskRuns?: PLRTaskRuns;
    pipelineSpec: PipelineSpec;
    skippedTasks?: {
      name: string;
    }[];
    pipelineResults?: TektonResultsRun[];
  };
};

export type PipelineWithLatest = PipelineKind & {
  latestRun?: PipelineRunKind;
};

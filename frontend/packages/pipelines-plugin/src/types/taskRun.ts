import { K8sResourceCommon, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { TektonResource, TektonResultsRun } from './coreTekton';
import { PipelineTaskParam, PipelineTaskRef, PipelineTaskSpec } from './pipeline';

import {
  Condition,
  PLRTaskRunStep,
  VolumeTypeConfigMaps,
  VolumeTypePVC,
  VolumeTypeSecret,
} from './pipelineRun';

export type TaskRunWorkspace = {
  name: string;
  volumeClaimTemplate?: PersistentVolumeClaimKind;
  persistentVolumeClaim?: VolumeTypePVC;
  configMap?: VolumeTypeConfigMaps;
  emptyDir?: {};
  secret?: VolumeTypeSecret;
  subPath?: string;
};

export type TaskRunStatus = {
  completionTime?: string;
  conditions?: Condition[];
  podName?: string;
  startTime?: string;
  steps?: PLRTaskRunStep[];
  taskResults?: TektonResultsRun[];
};

export type TaskRunKind = K8sResourceCommon & {
  spec: {
    taskRef?: PipelineTaskRef;
    taskSpec?: PipelineTaskSpec;
    serviceAccountName?: string;
    params?: PipelineTaskParam[];
    resources?: TektonResource[];
    timeout?: string;
    workspaces?: TaskRunWorkspace[];
  };
  status?: TaskRunStatus;
};

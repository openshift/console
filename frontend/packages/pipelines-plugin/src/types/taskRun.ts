import {
  K8sGroupVersionKind,
  K8sResourceCommon,
  PersistentVolumeClaimKind,
} from '@console/internal/module/k8s';
import { TektonResource, TektonResultsRun, TektonTaskSpec } from './coreTekton';
import { PipelineTaskParam, PipelineTaskRef } from './pipeline';
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
  taskResults?: TektonResultsRun[]; // in tekton v1 taskResults is renamed to results
  results?: TektonResultsRun[];
};

export type TaskRunKind = K8sResourceCommon & {
  spec: {
    taskRef?: PipelineTaskRef;
    taskSpec?: TektonTaskSpec;
    serviceAccountName?: string;
    params?: PipelineTaskParam[];
    resources?: TektonResource[];
    timeout?: string;
    workspaces?: TaskRunWorkspace[];
  };
  status?: TaskRunStatus;
};

export const TaskRunGroupVersionKind: K8sGroupVersionKind = {
  group: 'tekton.dev',
  version: 'v1',
  kind: 'TaskRun',
};

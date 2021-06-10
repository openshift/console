import i18next from 'i18next';

import { chart_color_green_400 as successColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import { chart_color_blue_300 as runningColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_300';
import { global_danger_color_100 as failureColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { chart_color_blue_100 as pendingColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_100';
import { chart_color_black_400 as skippedColor } from '@patternfly/react-tokens/dist/js/chart_color_black_400';
import { chart_color_black_500 as cancelledColor } from '@patternfly/react-tokens/dist/js/chart_color_black_500';

import {
  K8sKind,
  referenceForModel,
  GroupVersionKind,
  apiVersionForModel,
} from '@console/internal/module/k8s';
import {
  ClusterTaskModel,
  ClusterTriggerBindingModel,
  PipelineRunModel,
  TaskModel,
  TriggerBindingModel,
  PipelineModel,
} from '../models';
import { pipelineRunFilterReducer, SucceedConditionReason } from './pipeline-filter-reducer';
import { TektonResourceLabel } from '../components/pipelines/const';
import { PipelineKind, PipelineRunKind, PipelineTask } from '../types';

interface Metadata {
  name: string;
  namespace?: string;
}

export interface PropPipelineData {
  metadata: Metadata;
  latestRun?: PipelineRunKind;
}

interface StatusMessage {
  message: string;
  pftoken: { name: string; value: string; var: string };
}

export interface TaskStatus {
  PipelineNotStarted: number;
  Pending: number;
  Running: number;
  Succeeded: number;
  Cancelled: number;
  Failed: number;
  Skipped: number;
}

export interface Resource {
  propsReferenceForRuns: string[];
  resources: FirehoseResource[];
}

export interface Runs {
  data?: PipelineRunKind[];
}

export type KeyedRuns = { [key: string]: Runs };

interface FirehoseResource {
  kind: string;
  namespace?: string;
  isList?: boolean;
  selector?: object;
}

export const getResources = (data: PropPipelineData[]): Resource => {
  const resources = [];
  const propsReferenceForRuns = [];
  if (data && data.length > 0) {
    data.forEach((pipeline, i) => {
      if (pipeline.metadata && pipeline.metadata.namespace && pipeline.metadata.name) {
        propsReferenceForRuns.push(`PipelineRun_${i}`);
        resources.push({
          kind: referenceForModel(PipelineRunModel),
          namespace: pipeline.metadata.namespace,
          isList: true,
          prop: `PipelineRun_${i}`,
          selector: {
            'tekton.dev/pipeline': pipeline.metadata.name,
          },
        });
      }
    });
    return { propsReferenceForRuns, resources };
  }
  return { propsReferenceForRuns: null, resources: null };
};

export const getLatestRun = (runs: Runs, field: string): PipelineRunKind => {
  if (!runs || !runs.data || !(runs.data.length > 0) || !field) {
    return null;
  }
  let latestRun = runs.data[0];
  if (field === 'creationTimestamp') {
    for (let i = 1; i < runs.data.length; i++) {
      latestRun =
        runs.data[i] &&
        runs.data[i].metadata &&
        runs.data[i].metadata[field] &&
        new Date(runs.data[i].metadata[field]) > new Date(latestRun.metadata[field])
          ? runs.data[i]
          : latestRun;
    }
  } else if (field === 'startTime' || field === 'completionTime') {
    for (let i = 1; i < runs.data.length; i++) {
      latestRun =
        runs.data[i] &&
        runs.data[i].status &&
        runs.data[i].status[field] &&
        new Date(runs.data[i].status[field]) > new Date(latestRun.status[field])
          ? runs.data[i]
          : latestRun;
    }
  } else {
    latestRun = runs.data[runs.data.length - 1];
  }
  if (!latestRun.status) {
    latestRun = { ...latestRun, status: { pipelineSpec: { tasks: [] } } };
  }
  if (!latestRun.status.succeededCondition) {
    latestRun.status = { ...latestRun.status, succeededCondition: '' };
  }
  latestRun.status.succeededCondition = pipelineRunFilterReducer(latestRun);
  return latestRun;
};

export const augmentRunsToData = (
  data: PropPipelineData[],
  propsReferenceForRuns: string[],
  runs: { [key: string]: Runs },
): PropPipelineData[] => {
  if (propsReferenceForRuns) {
    const newData: PropPipelineData[] = [];
    propsReferenceForRuns.forEach((reference, i) => {
      const latestRun = getLatestRun(runs[reference], 'creationTimestamp');
      if (latestRun !== data[i].latestRun) {
        // ensure we create a new data object if the latestRun has changed so that shallow compare fails
        newData.push({ ...data[i], latestRun });
      } else {
        newData.push(data[i]);
      }
    });
    return newData;
  }
  return data;
};

export enum runStatus {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Running = 'Running',
  'In Progress' = 'In Progress',
  FailedToStart = 'FailedToStart',
  PipelineNotStarted = 'PipelineNotStarted',
  Skipped = 'Skipped',
  Cancelled = 'Cancelled',
  Pending = 'Pending',
  Idle = 'Idle',
}

export const getRunStatusColor = (status: string): StatusMessage => {
  switch (status) {
    case runStatus.Succeeded:
      return { message: i18next.t('pipelines-plugin~Succeeded'), pftoken: successColor };
    case runStatus.Failed:
      return { message: i18next.t('pipelines-plugin~Failed'), pftoken: failureColor };
    case runStatus.FailedToStart:
      return {
        message: i18next.t('pipelines-plugin~PipelineRun failed to start'),
        pftoken: failureColor,
      };
    case runStatus.Running:
      return { message: i18next.t('pipelines-plugin~Running'), pftoken: runningColor };
    case runStatus['In Progress']:
      return { message: i18next.t('pipelines-plugin~Running'), pftoken: runningColor };

    case runStatus.Skipped:
      return { message: i18next.t('pipelines-plugin~Skipped'), pftoken: skippedColor };
    case runStatus.Cancelled:
      return { message: i18next.t('pipelines-plugin~Cancelled'), pftoken: cancelledColor };
    case runStatus.Idle:
    case runStatus.Pending:
      return { message: i18next.t('pipelines-plugin~Pending'), pftoken: pendingColor };
    default:
      return {
        message: i18next.t('pipelines-plugin~PipelineRun not started yet'),
        pftoken: pendingColor,
      };
  }
};

export const truncateName = (name: string, length: number): string =>
  name.length < length ? name : `${name.slice(0, length - 1)}...`;

export const getPipelineFromPipelineRun = (pipelineRun: PipelineRunKind): PipelineKind => {
  const pipelineName =
    pipelineRun?.metadata?.labels?.[TektonResourceLabel.pipeline] || pipelineRun?.metadata?.name;
  const pipelineSpec = pipelineRun?.status?.pipelineSpec || pipelineRun?.spec?.pipelineSpec;
  if (!pipelineName || !pipelineSpec) {
    return null;
  }
  return {
    apiVersion: apiVersionForModel(PipelineModel),
    kind: PipelineModel.kind,
    metadata: {
      name: pipelineName,
      namespace: pipelineRun.metadata.namespace,
    },
    spec: pipelineSpec,
  };
};

export const totalPipelineRunTasks = (executedPipeline: PipelineKind): number => {
  if (!executedPipeline) {
    return 0;
  }
  const totalTasks = (executedPipeline.spec?.tasks || []).length ?? 0;
  const finallyTasks = (executedPipeline.spec?.finally || []).length ?? 0;
  return totalTasks + finallyTasks;
};

export const getTaskStatus = (pipelinerun: PipelineRunKind, pipeline: PipelineKind): TaskStatus => {
  const totalTasks = totalPipelineRunTasks(pipeline);
  const plrTasks =
    pipelinerun && pipelinerun.status && pipelinerun.status.taskRuns
      ? Object.keys(pipelinerun.status.taskRuns)
      : [];
  const plrTaskLength = plrTasks.length;
  const skippedTaskLength = (pipelinerun?.status?.skippedTasks || []).length;
  const taskStatus: TaskStatus = {
    PipelineNotStarted: 0,
    Pending: 0,
    Running: 0,
    Succeeded: 0,
    Failed: 0,
    Cancelled: 0,
    Skipped: skippedTaskLength,
  };

  if (pipelinerun?.status?.taskRuns) {
    plrTasks.forEach((taskRun) => {
      const status = pipelineRunFilterReducer(pipelinerun.status.taskRuns[taskRun]);
      if (status === 'Succeeded' || status === 'Completed' || status === 'Complete') {
        taskStatus[runStatus.Succeeded]++;
      } else if (status === 'Running') {
        taskStatus[runStatus.Running]++;
      } else if (status === 'Failed') {
        taskStatus[runStatus.Failed]++;
      } else if (status === 'Cancelled') {
        taskStatus[runStatus.Cancelled]++;
      } else {
        taskStatus[runStatus.Pending]++;
      }
    });

    const pipelineRunHasFailure = taskStatus[runStatus.Failed] > 0;
    const pipelineRunIsCancelled = pipelineRunFilterReducer(pipelinerun) === runStatus.Cancelled;
    const unhandledTasks =
      totalTasks >= plrTaskLength ? totalTasks - plrTaskLength - skippedTaskLength : totalTasks;

    if (pipelineRunHasFailure || pipelineRunIsCancelled) {
      taskStatus[runStatus.Cancelled] += unhandledTasks;
    } else {
      taskStatus[runStatus.Pending] += unhandledTasks;
    }
  } else if (
    pipelinerun?.status?.conditions?.[0]?.status === 'False' ||
    pipelinerun?.spec.status === SucceedConditionReason.PipelineRunCancelled
  ) {
    taskStatus[runStatus.Cancelled] = totalTasks;
  } else if (pipelinerun?.spec.status === SucceedConditionReason.PipelineRunPending) {
    taskStatus[runStatus.Pending] += totalTasks;
  } else {
    taskStatus[runStatus.PipelineNotStarted]++;
  }
  return taskStatus;
};

export const getResourceModelFromTaskKind = (kind: string): K8sKind => {
  if (kind === ClusterTaskModel.kind) {
    return ClusterTaskModel;
  }
  if (kind === TaskModel.kind || kind === undefined) {
    return TaskModel;
  }
  return null;
};

export const getSafeTaskResourceKind = (kind: string): string =>
  (getResourceModelFromTaskKind(kind) || TaskModel).kind;

export const getResourceModelFromBindingKind = (kind: string): K8sKind => {
  if (kind === ClusterTriggerBindingModel.kind) {
    return ClusterTriggerBindingModel;
  }
  if (kind === TriggerBindingModel.kind || kind === undefined) {
    return TriggerBindingModel;
  }
  return null;
};

export const getSafeBindingResourceKind = (kind: string): string =>
  (getResourceModelFromBindingKind(kind) || TriggerBindingModel).kind;

export const getResourceModelFromTask = (task: PipelineTask): K8sKind => {
  const {
    taskRef: { kind },
  } = task;

  return getResourceModelFromTaskKind(kind);
};

export const pipelineRefExists = (pipelineRun: PipelineRunKind): boolean =>
  !!pipelineRun.spec.pipelineRef?.name;

export const getModelReferenceFromTaskKind = (kind: string): GroupVersionKind => {
  const model = getResourceModelFromTaskKind(kind);
  return referenceForModel(model);
};

export const countRunningTasks = (pipelineRun: PipelineRunKind): number => {
  const taskStatuses = getTaskStatus(pipelineRun, undefined);
  return taskStatuses.Running;
};

export const shouldHidePipelineRunStop = (pipelineRun: PipelineRunKind): boolean =>
  !(
    pipelineRun &&
    (countRunningTasks(pipelineRun) > 0 ||
      pipelineRunFilterReducer(pipelineRun) === runStatus.Running)
  );

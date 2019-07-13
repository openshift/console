import {
  chart_color_green_400 as successColor,
  chart_color_blue_300 as runningColor,
  global_danger_color_100 as failureColor,
  chart_color_blue_100 as pendingColor,
  chart_color_black_200 as skippedColor,
  chart_color_black_400 as cancelledColor,
} from '@patternfly/react-tokens';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { pipelineRunFilterReducer } from './pipeline-filter-reducer';

interface Metadata {
  name: string;
  namespace?: string;
}

export interface PropPipelineData {
  metadata: Metadata;
  latestRun?: PipelineRun;
}

interface StatusMessage {
  message: string;
  pftoken: { name: string; value: string; var: string };
}

export interface TaskStatus {
  Succeeded?: number;
  Running?: number;
  Failed?: number;
  Notstarted?: number;
  FailedToStart?: number;
}

export interface Resource {
  propsReferenceForRuns: string[];
  resources: FirehoseResource[];
}

export interface PipelineResource {
  name?: string;
  type?: string;
  resourceRef?: {
    name?: string;
  };
}

export interface Runs {
  data?: PipelineRun[];
}

export type KeyedRuns = { [key: string]: Runs };

export interface Pipeline extends K8sResourceKind {
  latestRun?: PipelineRun;
  spec?: {
    pipelineRef?: { name: string };
    params: Param[];
    resources: PipelineResource[];
    tasks: K8sResourceKind[];
  };
}

export interface PipelineRun extends K8sResourceKind {
  spec?: {
    pipelineRef?: { name: string };
    params: Param[];
    trigger: {
      type: string;
    };
    resources: PipelineResource[];
  };
  status?: {
    succeededCondition?: string;
    creationTimestamp?: string;
    conditions?: Condition[];
    startTime?: string;
    completionTime?: string;
    taskRuns?: K8sResourceKind[];
  };
}

export interface Condition {
  type: string;
  status: string;
  reason?: string;
}

export interface Param {
  input: string;
  output: string;
  resource?: object;
}

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
          kind: 'PipelineRun',
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

export const getLatestRun = (runs: Runs, field: string): PipelineRun => {
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
    latestRun = { ...latestRun, status: {} };
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
) => {
  if (propsReferenceForRuns) {
    propsReferenceForRuns.forEach(
      (reference, i) => (data[i].latestRun = getLatestRun(runs[reference], 'creationTimestamp')),
    );
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
      return { message: 'Succeded', pftoken: successColor };
    case runStatus.Failed:
      return { message: 'Failed', pftoken: failureColor };
    case runStatus.FailedToStart:
      return {
        message: 'PipelineRun Failed To Start',
        pftoken: failureColor,
      };
    case runStatus.Running:
      return { message: 'Running', pftoken: runningColor };
    case runStatus['In Progress']:
      return { message: 'Running', pftoken: runningColor };

    case runStatus.Skipped:
      return { message: 'Skipped', pftoken: skippedColor };
    case runStatus.Cancelled:
      return { message: 'Cancelled', pftoken: cancelledColor };
    case runStatus.Idle:
    case runStatus.Pending:
      return { message: 'Not Started Yet', pftoken: pendingColor };
    default:
      return { message: 'PipelineRun Not started Yet', pftoken: pendingColor };
  }
};

export const getTaskStatus = (pipelinerun: PipelineRun, pipeline: Pipeline): TaskStatus => {
  const totalTasks =
    pipeline && pipeline.spec && pipeline.spec.tasks ? pipeline.spec.tasks.length : 0;
  const plrTasks =
    pipelinerun && pipelinerun.status && pipelinerun.status.taskRuns
      ? Object.keys(pipelinerun.status.taskRuns)
      : [];
  const plrTaskLength = plrTasks.length;
  const taskStatus: TaskStatus = {};
  Object.keys(runStatus).forEach((key) => {
    taskStatus[key] = 0;
  });
  taskStatus[runStatus.Pending] =
    totalTasks >= plrTaskLength ? totalTasks - plrTaskLength : totalTasks;
  if (pipelinerun && pipelinerun.status && pipelinerun.status.taskRuns) {
    plrTasks.forEach((taskRun) => {
      const status = pipelineRunFilterReducer(pipelinerun.status.taskRuns[taskRun]);
      if (status === 'Succeeded' || status === 'Completed' || status === 'Complete') {
        taskStatus[runStatus.Succeeded]++;
      } else if (status === 'Running') {
        taskStatus[runStatus.Running]++;
      } else if (status === 'Failed') {
        taskStatus[runStatus.Failed]++;
      } else {
        taskStatus[runStatus.Pending]++;
      }
    });
  } else if (
    pipelinerun &&
    pipelinerun.status &&
    pipelinerun.status.conditions &&
    pipelinerun.status.conditions[0].status === 'False'
  ) {
    taskStatus[runStatus.FailedToStart]++;
  } else {
    taskStatus[runStatus.PipelineNotStarted]++;
  }
  return taskStatus;
};

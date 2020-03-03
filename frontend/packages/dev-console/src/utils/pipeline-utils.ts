import * as _ from 'lodash';
import { formatDuration } from '@console/internal/components/utils/datetime';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_WAITING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
} from '@console/internal/components/utils';
import {
  getLatestRun,
  Pipeline,
  PipelineRun,
  runStatus,
  PipelineParam,
  PipelineRunParam,
  PipelineTaskRef,
} from './pipeline-augment';
import { pipelineFilterReducer, pipelineRunStatus } from './pipeline-filter-reducer';

interface Resources {
  inputs?: Resource[];
  outputs?: Resource[];
}

interface Resource {
  name: string;
  resource?: string;
  from?: string[];
}

export interface ContainerStatus {
  name: string;
  lastState?: string;
  state?: {
    waiting?: Record<string, any>;
    terminated?: Record<string, any>;
    running?: Record<string, any>;
  };
}

export interface PipelineVisualizationTaskItem {
  name: string;
  resources?: Resources;
  params?: object;
  runAfter?: string[];
  taskRef: PipelineTaskRef;
}

export const TaskStatusClassNameMap = {
  'In Progress': 'is-running',
  Succeeded: 'is-done',
  Failed: 'is-error',
  Idle: 'is-idle',
};

export const conditions = {
  hasFromDependency: (task: PipelineVisualizationTaskItem): boolean =>
    task.resources &&
    task.resources.inputs &&
    task.resources.inputs.length > 0 &&
    !!task.resources.inputs[0].from,
  hasRunAfterDependency: (task: PipelineVisualizationTaskItem): boolean =>
    task.runAfter && task.runAfter.length > 0,
};

export enum ListFilterId {
  Running = 'Running',
  Failed = 'Failed',
  Succeeded = 'Succeeded',
  Cancelled = 'Cancelled',
}

export const ListFilterLabels = {
  [ListFilterId.Running]: 'Running',
  [ListFilterId.Failed]: 'Failed',
  [ListFilterId.Succeeded]: 'Complete',
  [ListFilterId.Cancelled]: 'Cancelled',
};

// to be used by both Pipeline and Pipelinerun visualisation
const sortTasksByRunAfterAndFrom = (
  tasks: PipelineVisualizationTaskItem[],
): PipelineVisualizationTaskItem[] => {
  // check and sort tasks by 'runAfter' and 'from' dependency
  const output = tasks;
  for (let i = 0; i < output.length; i++) {
    let flag = -1;
    if (conditions.hasRunAfterDependency(output[i])) {
      for (let j = 0; j < output.length; j++) {
        if (i < j && output[j].taskRef.name === output[i].runAfter[output[i].runAfter.length - 1]) {
          flag = j;
        }
      }
    } else if (conditions.hasFromDependency(output[i])) {
      for (let j = i + 1; j < output.length; j++) {
        if (output[j].taskRef.name === output[i].resources.inputs[0].from[0]) {
          flag = j;
        }
      }
    }
    if (flag > -1) {
      // swap with last matching task
      const temp = output[flag];
      output[flag] = output[i];
      output[i] = temp;
    }
  }
  return output;
};

/**
 * Appends the pipeline run status to each tasks in the pipeline.
 * @param pipeline
 * @param pipelineRun
 */
const appendPipelineRunStatus = (pipeline, pipelineRun) => {
  return _.map(pipeline.spec.tasks, (task) => {
    if (!pipelineRun.status) {
      return task;
    }
    if (pipelineRun.status && !pipelineRun.status.taskRuns) {
      return _.merge(task, { status: { reason: runStatus.Failed } });
    }
    const mTask = _.merge(task, {
      status: _.get(_.find(pipelineRun.status.taskRuns, { pipelineTaskName: task.name }), 'status'),
    });
    // append task duration
    if (mTask.status && mTask.status.completionTime && mTask.status.startTime) {
      const date =
        new Date(mTask.status.completionTime).getTime() -
        new Date(mTask.status.startTime).getTime();
      mTask.status.duration = formatDuration(date);
    }
    // append task status
    if (!mTask.status) {
      mTask.status = { reason: runStatus.Idle };
    } else if (mTask.status && mTask.status.conditions) {
      mTask.status.reason = pipelineRunStatus(mTask) || runStatus.Idle;
    }
    return mTask;
  });
};

export const getPipelineTasks = (
  pipeline: K8sResourceKind,
  pipelineRun: K8sResourceKind = {
    apiVersion: '',
    metadata: {},
    kind: 'PipelineRun',
  },
): PipelineVisualizationTaskItem[][] => {
  // Each unit in 'out' array is termed as stage | out = [stage1 = [task1], stage2 = [task2,task3], stage3 = [task4]]
  const out = [];
  if (!pipeline.spec || !pipeline.spec.tasks) {
    return out;
  }
  const taskList = appendPipelineRunStatus(pipeline, pipelineRun);
  // Step 1: Sort Tasks to get in correct order
  const tasks = sortTasksByRunAfterAndFrom(taskList);

  // Step 2: Push all nodes without any dependencies in different stages
  tasks.forEach((task) => {
    if (!conditions.hasFromDependency(task) && !conditions.hasRunAfterDependency(task)) {
      if (out.length === 0) {
        out.push([]);
      }
      out[0].push(task);
    }
  });

  // Step 3: Push nodes with 'from' dependency and stack similar tasks in a stage
  tasks.forEach((task) => {
    if (!conditions.hasRunAfterDependency(task) && conditions.hasFromDependency(task)) {
      let flag = out.length - 1;
      for (let i = 0; i < out.length; i++) {
        for (const t of out[i]) {
          if (
            t.taskRef.name === task.resources.inputs[0].from[0] ||
            t.name === task.resources.inputs[0].from[0]
          ) {
            flag = i;
          }
        }
      }
      const nextToFlag = out[flag + 1] ? out[flag + 1] : null;
      if (
        nextToFlag &&
        nextToFlag[0] &&
        nextToFlag[0].resources &&
        nextToFlag[0].resources.inputs &&
        nextToFlag[0].resources.inputs[0] &&
        nextToFlag[0].resources.inputs[0].from &&
        nextToFlag[0].resources.inputs[0].from[0] &&
        nextToFlag[0].resources.inputs[0].from[0] === task.resources.inputs[0].from[0]
      ) {
        nextToFlag.push(task);
      } else {
        out.splice(flag + 1, 0, [task]);
      }
    }
  });

  // Step 4: Push nodes with 'runAfter' dependencies and stack similar tasks in a stage
  tasks.forEach((task) => {
    if (conditions.hasRunAfterDependency(task)) {
      let flag = out.length - 1;
      for (let i = 0; i < out.length; i++) {
        for (const t of out[i]) {
          if (t.taskRef.name === task.runAfter[0] || t.name === task.runAfter[0]) {
            flag = i;
          }
        }
      }
      const nextToFlag = out[flag + 1] ? out[flag + 1] : null;
      if (
        nextToFlag &&
        nextToFlag[0].runAfter &&
        nextToFlag[0].runAfter[0] &&
        nextToFlag[0].runAfter[0] === task.runAfter[0]
      ) {
        nextToFlag.push(task);
      } else {
        out.splice(flag + 1, 0, [task]);
      }
    }
  });
  return out;
};

export const containerToLogSourceStatus = (container: ContainerStatus): string => {
  if (!container) {
    return LOG_SOURCE_WAITING;
  }
  const { state, lastState } = container;
  if (state.waiting && !_.isEmpty(lastState)) {
    return LOG_SOURCE_RESTARTING;
  }
  if (state.waiting) {
    return LOG_SOURCE_WAITING;
  }
  if (state.terminated) {
    return LOG_SOURCE_TERMINATED;
  }
  return LOG_SOURCE_RUNNING;
};

type CurrentPipelineStatus = {
  currentPipeline: Pipeline;
  status: string;
};

/**
 * Takes a pipeline and a series of matching pipeline runs and produces a current pipeline state.
 */
export const constructCurrentPipeline = (
  pipeline: Pipeline,
  pipelineRuns: PipelineRun[],
): CurrentPipelineStatus => {
  if (!pipeline || !pipelineRuns || pipelineRuns.length === 0) {
    // Not enough data to build the current state
    return null;
  }

  const latestRun = getLatestRun({ data: pipelineRuns }, 'creationTimestamp');

  if (!latestRun) {
    // Without the latestRun we will not have progress to show
    return null;
  }

  const currentPipeline: Pipeline = {
    ...pipeline,
    latestRun,
  };

  let status: string = pipelineFilterReducer(currentPipeline);
  if (status === '-') {
    status = runStatus.Pending;
  }

  return {
    currentPipeline,
    status,
  };
};

export const getPipelineRunParams = (pipelineParams: PipelineParam[]): PipelineRunParam[] => {
  return (
    pipelineParams &&
    pipelineParams.map((param) => ({
      name: param.name,
      value: param.default,
    }))
  );
};

export const pipelineRunDuration = (run: PipelineRun): string => {
  const startTime = _.get(run, ['status', 'startTime'], null);
  const completionTime = _.get(run, ['status', 'completionTime'], null);

  // Duration cannot be computed if start time is missing or a completed/failed pipeline has no end time
  if (!startTime || (!completionTime && pipelineRunStatus(run) !== 'Running')) {
    return '-';
  }
  const start = new Date(startTime).getTime();

  // For running pipelines duration must be current time - starttime.
  const duration = completionTime
    ? new Date(completionTime).getTime() - start
    : new Date().getTime() - start;
  return formatDuration(duration);
};

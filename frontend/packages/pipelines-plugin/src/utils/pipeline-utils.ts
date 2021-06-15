import * as _ from 'lodash';
import { formatPrometheusDuration } from '@console/internal/components/utils/datetime';
import {
  ContainerStatus,
  k8sUpdate,
  k8sGet,
  SecretKind,
  K8sResourceCommon,
  K8sKind,
  PersistentVolumeClaimKind,
} from '@console/internal/module/k8s';
import {
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_WAITING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
} from '@console/internal/components/utils';
import { ServiceAccountModel } from '@console/internal/models';
import { errorModal } from '@console/internal/components/modals/error-modal';
import { PIPELINE_SERVICE_ACCOUNT, SecretAnnotationId } from '../components/pipelines/const';
import { PipelineModalFormWorkspace } from '../components/pipelines/modals/common/types';
import {
  PipelineRunKind,
  PipelineRunParam,
  PipelineRunWorkspace,
  PipelineTask,
  PipelineKind,
  TaskRunKind,
  TektonParam,
} from '../types';
import { getLatestRun, runStatus } from './pipeline-augment';
import {
  pipelineRunFilterReducer,
  pipelineRunStatus,
  SucceedConditionReason,
} from './pipeline-filter-reducer';
import {
  PipelineRunModel,
  TaskRunModel,
  PipelineResourceModel,
  ConditionModel,
  ClusterTaskModel,
  TriggerTemplateModel,
  TriggerBindingModel,
  ClusterTriggerBindingModel,
  PipelineModel,
  TaskModel,
  EventListenerModel,
} from '../models';

interface ServiceAccountSecretNames {
  [name: string]: string;
}

export type ServiceAccountType = {
  secrets: ServiceAccountSecretNames[];
  imagePullSecrets: ServiceAccountSecretNames[];
} & K8sResourceCommon;

export const TaskStatusClassNameMap = {
  'In Progress': 'is-running',
  Succeeded: 'is-done',
  Failed: 'is-error',
  Idle: 'is-idle',
};

export const conditions = {
  hasFromDependency: (task: PipelineTask): boolean =>
    task.resources &&
    task.resources.inputs &&
    task.resources.inputs.length > 0 &&
    !!task.resources.inputs[0].from,
  hasRunAfterDependency: (task: PipelineTask): boolean => task.runAfter && task.runAfter.length > 0,
};

export enum ListFilterId {
  Running = 'Running',
  Failed = 'Failed',
  Succeeded = 'Succeeded',
  Cancelled = 'Cancelled',
  Other = '-',
}

export const ListFilterLabels = {
  [ListFilterId.Running]: 'Running',
  [ListFilterId.Failed]: 'Failed',
  [ListFilterId.Succeeded]: 'Succeeded',
  [ListFilterId.Cancelled]: 'Cancelled',
  [ListFilterId.Other]: 'Other',
};

export enum PipelineResourceListFilterId {
  Git = 'git',
  PullRequest = 'pullRequest',
  Image = 'image',
  Cluster = 'cluster',
  Storage = 'storage',
  CloudEvent = 'cloudEvent',
}

export const PipelineResourceListFilterLabels = {
  [PipelineResourceListFilterId.Git]: 'Git',
  [PipelineResourceListFilterId.PullRequest]: 'Pull Request',
  [PipelineResourceListFilterId.Image]: 'Image',
  [PipelineResourceListFilterId.Cluster]: 'Cluster',
  [PipelineResourceListFilterId.Storage]: 'Storage',
  [PipelineResourceListFilterId.CloudEvent]: 'Cloud Event',
};

/**
 * Appends the pipeline run status to each tasks in the pipeline.
 * @param pipeline
 * @param pipelineRun
 * @param isFinallyTasks
 */
export const appendPipelineRunStatus = (pipeline, pipelineRun, isFinallyTasks = false) => {
  const tasks = (isFinallyTasks ? pipeline.spec.finally : pipeline.spec.tasks) || [];

  return tasks.map((task) => {
    if (!pipelineRun.status) {
      return task;
    }
    if (!pipelineRun?.status?.taskRuns) {
      if (pipelineRun.spec.status === SucceedConditionReason.PipelineRunCancelled) {
        return _.merge(task, { status: { reason: runStatus.Cancelled } });
      }
      if (pipelineRun.spec.status === SucceedConditionReason.PipelineRunPending) {
        return _.merge(task, { status: { reason: runStatus.Idle } });
      }
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
      mTask.status.duration = formatPrometheusDuration(date);
    }
    // append task status
    if (!mTask.status) {
      mTask.status = { reason: runStatus.Idle };
    } else if (mTask.status && mTask.status.conditions) {
      mTask.status.reason = pipelineRunStatus(mTask) || runStatus.Idle;
    } else if (mTask.status && !mTask.status.reason) {
      mTask.status.reason = runStatus.Idle;
    }
    return mTask;
  });
};

export const getPipelineTasks = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind = {
    apiVersion: '',
    metadata: {},
    kind: 'PipelineRun',
    spec: {},
  },
): PipelineTask[][] => {
  // Each unit in 'out' array is termed as stage | out = [stage1 = [task1], stage2 = [task2,task3], stage3 = [task4]]
  const out = [];
  if (!pipeline.spec?.tasks || _.isEmpty(pipeline.spec.tasks)) {
    return out;
  }
  const taskList = appendPipelineRunStatus(pipeline, pipelineRun);

  // Step 1: Push all nodes without any dependencies in different stages
  taskList.forEach((task) => {
    if (!conditions.hasFromDependency(task) && !conditions.hasRunAfterDependency(task)) {
      if (out.length === 0) {
        out.push([]);
      }
      out[0].push(task);
    }
  });

  // Step 2: Push nodes with 'from' dependency and stack similar tasks in a stage
  taskList.forEach((task) => {
    if (!conditions.hasRunAfterDependency(task) && conditions.hasFromDependency(task)) {
      let flag = out.length - 1;
      for (let i = 0; i < out.length; i++) {
        for (const t of out[i]) {
          if (
            t.taskRef?.name === task.resources.inputs[0].from[0] ||
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

  // Step 3: Push nodes with 'runAfter' dependencies and stack similar tasks in a stage
  taskList.forEach((task) => {
    if (conditions.hasRunAfterDependency(task)) {
      let flag = out.length - 1;
      for (let i = 0; i < out.length; i++) {
        for (const t of out[i]) {
          if (t.taskRef?.name === task.runAfter[0] || t.name === task.runAfter[0]) {
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

export const getFinallyTasksWithStatus = (pipeline: PipelineKind, pipelineRun: PipelineRunKind) =>
  appendPipelineRunStatus(pipeline, pipelineRun, true);

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

export type LatestPipelineRunStatus = {
  latestPipelineRun: PipelineRunKind;
  status: string;
};

/**
 * Takes pipeline runs and produces a latest pipeline run state.
 */
export const getLatestPipelineRunStatus = (
  pipelineRuns: PipelineRunKind[],
): LatestPipelineRunStatus => {
  if (!pipelineRuns || pipelineRuns.length === 0) {
    // Not enough data to build the current state
    return { latestPipelineRun: null, status: runStatus.PipelineNotStarted };
  }

  const latestPipelineRun = getLatestRun({ data: pipelineRuns }, 'creationTimestamp');

  if (!latestPipelineRun) {
    // Without the latestRun we will not have progress to show
    return { latestPipelineRun: null, status: runStatus.PipelineNotStarted };
  }

  let status: string = pipelineRunFilterReducer(latestPipelineRun);
  if (status === '-') {
    status = runStatus.Pending;
  }

  return {
    latestPipelineRun,
    status,
  };
};

export const getPipelineRunParams = (pipelineParams: TektonParam[]): PipelineRunParam[] => {
  return (
    pipelineParams &&
    pipelineParams.map((param) => ({
      name: param.name,
      value: param.default,
    }))
  );
};

export const getPipelineRunWorkspaces = (
  pipelineWorkspaces: PipelineModalFormWorkspace[],
): PipelineRunWorkspace[] => {
  return (
    pipelineWorkspaces &&
    pipelineWorkspaces.map((workspace) => ({
      name: workspace.name,
      ...workspace.data,
    }))
  );
};

export const calculateRelativeTime = (startTime: string, completionTime?: string) => {
  const start = new Date(startTime).getTime();
  const end = completionTime ? new Date(completionTime).getTime() : new Date().getTime();
  const secondsAgo = (end - start) / 1000;
  const minutesAgo = secondsAgo / 60;
  const hoursAgo = minutesAgo / 60;

  if (minutesAgo > 90) {
    const count = Math.round(hoursAgo);
    return `about ${count} hours`;
  }
  if (minutesAgo > 45) {
    return 'about an hour';
  }
  if (secondsAgo > 90) {
    const count = Math.round(minutesAgo);
    return `about ${count} minutes`;
  }
  if (secondsAgo > 45) {
    return 'about a minute';
  }
  return 'a few seconds';
};

export const pipelineRunDuration = (run: PipelineRunKind | TaskRunKind): string => {
  const startTime = _.get(run, ['status', 'startTime'], null);
  const completionTime = _.get(run, ['status', 'completionTime'], null);

  // Duration cannot be computed if start time is missing or a completed/failed pipeline/task has no end time
  if (!startTime || (!completionTime && pipelineRunStatus(run) !== 'Running')) {
    return '-';
  }
  return calculateRelativeTime(startTime, completionTime);
};

export const updateServiceAccount = (
  secretName: string,
  originalServiceAccount: ServiceAccountType,
  updateImagePullSecrets: boolean,
): Promise<ServiceAccountType> => {
  const updatedServiceAccount = _.cloneDeep(originalServiceAccount);
  updatedServiceAccount.secrets = [...updatedServiceAccount.secrets, { name: secretName }];
  if (updateImagePullSecrets) {
    updatedServiceAccount.imagePullSecrets = [
      ...updatedServiceAccount.imagePullSecrets,
      { name: secretName },
    ];
  }
  return k8sUpdate(ServiceAccountModel, updatedServiceAccount);
};

export const associateServiceAccountToSecret = (
  secret: SecretKind,
  namespace: string,
  isImageSecret: boolean,
) => {
  k8sGet(ServiceAccountModel, PIPELINE_SERVICE_ACCOUNT, namespace)
    .then((serviceAccount) => {
      if (_.find(serviceAccount.secrets, (s) => s.name === secret.metadata.name) === undefined) {
        updateServiceAccount(secret.metadata.name, serviceAccount, isImageSecret);
      }
    })
    .catch((err) => {
      errorModal({ error: err.message });
    });
};

type KeyValuePair = {
  key: string;
  value: string;
};

const getAnnotationKey = (secretType: string, suffix: number) => {
  const annotationPrefix = 'tekton.dev';
  if (secretType === SecretAnnotationId.Git) {
    return `${annotationPrefix}/${SecretAnnotationId.Git}-${suffix}`;
  }
  if (secretType === SecretAnnotationId.Image) {
    return `${annotationPrefix}/${SecretAnnotationId.Image}-${suffix}`;
  }
  return null;
};

export const getSecretAnnotations = (
  annotation: KeyValuePair,
  existingAnnotations: { [key: string]: string } = {},
) => {
  let count = 0;
  let annotationKey = getAnnotationKey(annotation?.key, count);
  if (!annotationKey) {
    return existingAnnotations;
  }
  while (
    existingAnnotations[annotationKey] &&
    existingAnnotations[annotationKey] !== annotation?.value
  ) {
    annotationKey = getAnnotationKey(annotation?.key, ++count);
  }

  return { ...existingAnnotations, [annotationKey]: annotation?.value };
};

export const pipelinesTab = (kindObj: K8sKind) => {
  switch (kindObj.kind) {
    case PipelineModel.kind:
    case TaskModel.kind:
    case EventListenerModel.kind:
      return '';
    case PipelineRunModel.kind:
      return 'pipeline-runs';
    case PipelineResourceModel.kind:
      return 'pipeline-resources';
    case ConditionModel.kind:
      return 'conditions';
    case TaskRunModel.kind:
      return 'task-runs';
    case ClusterTaskModel.kind:
      return 'cluster-tasks';
    case TriggerTemplateModel.kind:
      return 'trigger-templates';
    case TriggerBindingModel.kind:
      return 'trigger-bindings';
    case ClusterTriggerBindingModel.kind:
      return 'cluster-trigger-bindings';
    default:
      return null;
  }
};

export const getMatchedPVCs = (
  pvcResources: PersistentVolumeClaimKind[],
  ownerResourceName: string,
  ownerResourceKind: string,
): PersistentVolumeClaimKind[] => {
  return pvcResources.filter((pvc) => {
    const { ownerReferences = [] } = pvc.metadata;

    return ownerReferences.some(
      (reference) => reference.name === ownerResourceName && reference.kind === ownerResourceKind,
    );
  });
};

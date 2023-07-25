import { formatPrometheusDuration } from '@openshift-console/plugin-shared/src/datetime/prometheus';
import i18next from 'i18next';
import * as _ from 'lodash';
import { errorModal } from '@console/internal/components/modals/error-modal';
import {
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_WAITING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
} from '@console/internal/components/utils';
import { ServiceAccountModel } from '@console/internal/models';
import {
  ContainerStatus,
  k8sUpdate,
  k8sGet,
  SecretKind,
  K8sResourceCommon,
  K8sKind,
  K8sResourceKind,
  PersistentVolumeClaimKind,
  K8sModel,
} from '@console/internal/module/k8s';
import {
  PIPELINE_SERVICE_ACCOUNT,
  SecretAnnotationId,
  TektonResourceLabel,
} from '../components/pipelines/const';
import { PipelineModalFormWorkspace } from '../components/pipelines/modals/common/types';
import { getDuration } from '../components/pipelines/pipeline-metrics/pipeline-metrics-utils';
import { EventListenerKind, TriggerTemplateKind } from '../components/pipelines/resource-types';
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
  RepositoryModel,
  PipelineModelV1Beta1,
  PipelineRunModelV1Beta1,
  TaskModelV1Beta1,
} from '../models';
import {
  ComputedStatus,
  PipelineRunKind,
  PipelineRunParam,
  PipelineRunWorkspace,
  PipelineTask,
  PipelineKind,
  TaskRunKind,
  TektonParam,
  TaskRunStatus,
  TaskKind,
} from '../types';
import { getLatestRun } from './pipeline-augment';
import {
  pipelineRunFilterReducer,
  pipelineRunStatus,
  SucceedConditionReason,
} from './pipeline-filter-reducer';

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
  [ListFilterId.Running]: i18next.t('pipelines-plugin~Running'),
  [ListFilterId.Failed]: i18next.t('pipelines-plugin~Failed'),
  [ListFilterId.Succeeded]: i18next.t('pipelines-plugin~Succeeded'),
  [ListFilterId.Cancelled]: i18next.t('pipelines-plugin~Cancelled'),
  [ListFilterId.Other]: i18next.t('pipelines-plugin~Other'),
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
export const appendPipelineRunStatus = (
  pipeline,
  pipelineRun,
  taskRuns: TaskRunKind[],
  isFinallyTasks = false,
) => {
  const tasks = (isFinallyTasks ? pipeline.spec.finally : pipeline.spec.tasks) || [];

  return tasks.map((task) => {
    if (!pipelineRun.status) {
      return task;
    }
    if (!taskRuns || taskRuns.length === 0) {
      if (pipelineRun.spec.status === SucceedConditionReason.PipelineRunCancelled) {
        return _.merge(task, { status: { reason: ComputedStatus.Cancelled } });
      }
      if (pipelineRun.spec.status === SucceedConditionReason.PipelineRunPending) {
        return _.merge(task, { status: { reason: ComputedStatus.Idle } });
      }
      return _.merge(task, { status: { reason: ComputedStatus.Failed } });
    }

    const taskRun = _.find(
      taskRuns,
      (tr) => tr.metadata.labels[TektonResourceLabel.pipelineTask] === task.name,
    );
    const taskStatus: TaskRunStatus = taskRun?.status;

    const mTask = _.merge(task, {
      status: pipelineRun?.status?.taskRuns
        ? _.get(_.find(pipelineRun.status.taskRuns, { pipelineTaskName: task.name }), 'status')
        : taskStatus,
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
      mTask.status = { reason: ComputedStatus.Pending };
    } else if (mTask.status && mTask.status.conditions) {
      mTask.status.reason = pipelineRunStatus(mTask) || ComputedStatus.Pending;
    } else if (mTask.status && !mTask.status.reason) {
      mTask.status.reason = ComputedStatus.Pending;
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
  taskRuns: TaskRunKind[],
): PipelineTask[][] => {
  // Each unit in 'out' array is termed as stage | out = [stage1 = [task1], stage2 = [task2,task3], stage3 = [task4]]
  const out = [];
  if (!pipeline.spec?.tasks || _.isEmpty(pipeline.spec.tasks)) {
    return out;
  }
  const taskList = appendPipelineRunStatus(pipeline, pipelineRun, taskRuns);

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

export const getFinallyTasksWithStatus = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
) => appendPipelineRunStatus(pipeline, pipelineRun, taskRuns, true);

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
    return { latestPipelineRun: null, status: ComputedStatus.PipelineNotStarted };
  }

  const latestPipelineRun = getLatestRun(pipelineRuns, 'creationTimestamp');

  if (!latestPipelineRun) {
    // Without the latestRun we will not have progress to show
    return { latestPipelineRun: null, status: ComputedStatus.PipelineNotStarted };
  }

  let status: string = pipelineRunFilterReducer(latestPipelineRun);
  if (status === '-') {
    status = ComputedStatus.Pending;
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

export const calculateDuration = (startTime: string, endTime?: string, long?: boolean) => {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : new Date().getTime();
  const durationInSeconds = (end - start) / 1000;
  return getDuration(durationInSeconds, long);
};

export const pipelineRunDuration = (run: PipelineRunKind | TaskRunKind): string => {
  const startTime = run?.status?.startTime ?? null;
  const completionTime = run?.status?.completionTime ?? null;

  // Duration cannot be computed if start time is missing or a completed/failed pipeline/task has no end time
  if (!startTime || (!completionTime && pipelineRunStatus(run) !== 'Running')) {
    return '-';
  }
  return calculateDuration(startTime, completionTime, true);
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
    case RepositoryModel.kind:
      return 'repositories';
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

export const getPipeline = (resource: K8sResourceKind, pipelines: PipelineKind[]): PipelineKind => {
  const pipeline = pipelines.find((p: PipelineKind) => p.metadata.name === resource.metadata.name);
  return pipeline;
};

export const getTriggerTemplates = (
  pipeline: PipelineKind,
  triggerTemplates: TriggerTemplateKind[],
): TriggerTemplateKind[] => {
  const triggerTemplate = triggerTemplates.filter(
    (tt: TriggerTemplateKind) =>
      !!tt.spec.resourcetemplates.find(
        (rt) => rt.spec.pipelineRef?.name === pipeline.metadata.name,
      ),
  );
  return triggerTemplate;
};

export const getEventListeners = (
  triggerTemplates: TriggerTemplateKind[],
  eventListeners: EventListenerKind[],
): EventListenerKind[] => {
  const resourceEventListeners = eventListeners.reduce((acc, et: EventListenerKind) => {
    const triggers = et.spec.triggers.filter((t) =>
      triggerTemplates.find((tt) => tt?.metadata.name === t?.template?.ref),
    );
    if (triggers.length > 0) {
      acc.push(et);
    }
    return acc;
  }, []);
  return resourceEventListeners;
};

export const returnValidPipelineModel = (pipeline: PipelineKind): K8sModel => {
  if (pipeline.apiVersion === 'tekton.dev/v1beta1') {
    return PipelineModelV1Beta1;
  }
  return PipelineModel;
};

export const returnValidPipelineRunModel = (pipelineRun: PipelineRunKind): K8sModel => {
  if (pipelineRun.apiVersion === 'tekton.dev/v1beta1') {
    return PipelineRunModelV1Beta1;
  }
  return PipelineRunModel;
};

export const returnValidTaskModel = (task: TaskKind): K8sModel => {
  if (task.apiVersion === 'tekton.dev/v1beta1') {
    return TaskModelV1Beta1;
  }
  return TaskModel;
};

import { history, resourcePathFromModel } from '@console/internal/components/utils';
import { apiVersionForModel, referenceForModel } from '@console/internal/module/k8s';
import { ClusterTaskModel, PipelineModel } from '../../../models';
import {
  Pipeline,
  PipelineResourceTask,
  PipelineResourceTaskParam,
  PipelineTask,
  PipelineTaskParam,
  PipelineTaskRef,
} from '../../../utils/pipeline-augment';
import { getTaskParameters } from '../resource-utils';
import { TASK_ERROR_STRINGS, TASK_INCOMPLETE_ERROR_MESSAGE, TaskErrorType } from './const';
import {
  PipelineBuilderFormExistingPipelineValues,
  PipelineBuilderFormikValues,
  ResourceTaskStatus,
  TaskErrorList,
} from './types';

export const getErrorMessage = (errorMap: TaskErrorList) => (taskIdx: number): string => {
  const taskErrors = errorMap[taskIdx];
  if (!taskErrors) {
    return null;
  }

  if (taskErrors?.resources) {
    return TASK_ERROR_STRINGS[TaskErrorType.MISSING_RESOURCES];
  }
  if (taskErrors?.params) {
    return TASK_ERROR_STRINGS[TaskErrorType.MISSING_REQUIRED_PARAMS];
  }

  return TASK_INCOMPLETE_ERROR_MESSAGE;
};

export const findTask = (resourceTasks: ResourceTaskStatus, taskRef: PipelineTaskRef) => {
  if (!resourceTasks?.clusterTasks || !resourceTasks?.namespacedTasks) {
    return null;
  }

  if (taskRef.kind === ClusterTaskModel.kind) {
    return resourceTasks.clusterTasks.find((task) => task.metadata.name === taskRef.name);
  }
  return resourceTasks.namespacedTasks.find((task) => task.metadata.name === taskRef.name);
};

export const convertResourceParamsToTaskParams = (
  resource: PipelineResourceTask,
): PipelineTaskParam[] => {
  return getTaskParameters(resource).map((param) => ({
    name: param.name,
    value: param.default,
  }));
};

export const taskParamIsRequired = (param: PipelineResourceTaskParam): boolean => {
  return !('default' in param);
};

export const convertResourceToTask = (
  resource: PipelineResourceTask,
  runAfter?: string[],
): PipelineTask => {
  return {
    name: resource.metadata.name,
    runAfter,
    taskRef: {
      kind: resource.kind === ClusterTaskModel.kind ? ClusterTaskModel.kind : undefined,
      name: resource.metadata.name,
    },
    params: convertResourceParamsToTaskParams(resource),
  };
};

export const getPipelineURL = (namespace: string) => {
  return `/k8s/ns/${namespace}/${referenceForModel(PipelineModel)}`;
};

const removeListRunAfters = (task: PipelineTask, listIds: string[]): PipelineTask => {
  if (task?.runAfter && listIds.length > 0) {
    // Trim out any runAfters pointing at list nodes
    const runAfter = (task.runAfter || []).filter(
      (runAfterName) => !listIds.includes(runAfterName),
    );

    return {
      ...task,
      runAfter,
    };
  }

  return task;
};

const removeEmptyDefaultParams = (task: PipelineTask): PipelineTask => {
  if (task.params?.length > 0) {
    // Since we can submit, this param has a default; check for empty values and remove
    return {
      ...task,
      params: task.params.filter((param) => !!param.value),
    };
  }

  return task;
};

export const convertBuilderFormToPipeline = (
  formValues: PipelineBuilderFormikValues,
  namespace: string,
  existingPipeline?: Pipeline,
): Pipeline => {
  const { name, resources, params, tasks, listTasks } = formValues;
  const listIds = listTasks.map((listTask) => listTask.name);

  return {
    ...existingPipeline,
    apiVersion: apiVersionForModel(PipelineModel),
    kind: PipelineModel.kind,
    metadata: {
      ...existingPipeline?.metadata,
      name,
      namespace,
    },
    spec: {
      ...existingPipeline?.spec,
      params,
      resources,
      tasks: tasks.map((task) => removeEmptyDefaultParams(removeListRunAfters(task, listIds))),
    },
  };
};

export const convertPipelineToBuilderForm = (
  pipeline: Pipeline,
): PipelineBuilderFormExistingPipelineValues => {
  if (!pipeline) return null;

  const {
    metadata: { name },
    spec: { params = [], resources = [], tasks = [] },
  } = pipeline;

  return {
    name,
    params,
    resources,
    tasks,
    listTasks: [],
  };
};

export const goToYAML = (existingPipeline?: Pipeline, namespace?: string) => {
  history.push(
    existingPipeline
      ? `${resourcePathFromModel(
          PipelineModel,
          existingPipeline?.metadata?.name,
          existingPipeline?.metadata?.namespace,
        )}/yaml`
      : `${getPipelineURL(namespace)}/~new`,
  );
};

import {
  PipelineResource,
  PipelineResourceTask,
  PipelineTask,
  PipelineTaskParam,
  PipelineTaskResource,
} from '../../../utils/pipeline-augment';
import { getRandomChars } from '../../../utils/shared-submit-utils';
import { AddNodeDirection } from '../pipeline-topology/const';
import { TaskErrorType, UpdateOperationType } from './const';
import {
  CleanupResults,
  PipelineBuilderListTask,
  PipelineBuilderTaskBase,
  PipelineBuilderTaskGroup,
  TaskErrorMap,
  UpdateOperation,
  UpdateOperationAction,
  UpdateOperationAddData,
  UpdateOperationConvertToTaskData,
  UpdateOperationDeleteListTaskData,
  UpdateOperationRemoveTaskData,
  UpdateOperationUpdateTaskData,
  UpdateTaskParamData,
  UpdateTaskResourceData,
} from './types';
import { convertResourceToTask } from './utils';

const mapReplaceRelatedInOthers = <TaskType extends PipelineBuilderTaskBase>(
  taskName: string,
  relatedTaskName: string,
  iterationTask: TaskType,
): TaskType => {
  if (!iterationTask?.runAfter?.includes(relatedTaskName)) {
    return iterationTask;
  }

  const remainingRunAfters = iterationTask.runAfter.filter(
    (runAfterName) => runAfterName !== relatedTaskName,
  );

  return {
    ...iterationTask,
    runAfter: [...remainingRunAfters, taskName],
  };
};

const mapRemoveRelatedInOthers = <TaskType extends PipelineBuilderTaskBase>(
  taskName: string,
  iterationTask: TaskType,
): TaskType => {
  if (!iterationTask?.runAfter?.includes(taskName)) {
    return iterationTask;
  }

  return {
    ...iterationTask,
    runAfter: iterationTask.runAfter.filter((runAfterName) => runAfterName !== taskName),
  };
};

const mapStitchReplaceInOthers = <TaskType extends PipelineBuilderTaskBase>(
  removalTask: PipelineBuilderTaskBase,
  iterationTask: TaskType,
): TaskType => {
  if (!removalTask?.runAfter) {
    return mapRemoveRelatedInOthers<TaskType>(removalTask.name, iterationTask);
  }
  if (!iterationTask?.runAfter?.includes(removalTask.name)) {
    return iterationTask;
  }

  const updatedIterationTask = mapRemoveRelatedInOthers(removalTask.name, iterationTask);
  if (updatedIterationTask.runAfter.length > 0) {
    return updatedIterationTask;
  }

  return {
    ...updatedIterationTask,
    runAfter: removalTask.runAfter,
  };
};

const mapBeRelated = <TaskType extends PipelineBuilderTaskBase>(
  newTaskName: string,
  relatedTaskName: string,
  iterationTask: TaskType,
): TaskType => {
  if (iterationTask.name !== relatedTaskName) {
    return iterationTask;
  }

  return {
    ...iterationTask,
    runAfter: [newTaskName],
  };
};

const mapAddRelatedToOthers = <TaskType extends PipelineBuilderTaskBase>(
  taskName: string,
  relatedTaskName: string,
  iterationTask: TaskType,
): TaskType => {
  if (!iterationTask?.runAfter?.includes(relatedTaskName)) {
    return iterationTask;
  }

  return {
    ...iterationTask,
    runAfter: [...iterationTask.runAfter, taskName],
  };
};

// TODO: Can we use yup? Do we need this level of checking for errors?
const getErrors = (task: PipelineTask, resource: PipelineResourceTask): TaskErrorMap => {
  const resourceParams = resource?.spec?.params || [];
  const requiredParamNames = resourceParams
    .filter((param) => !param.default)
    .map((param) => param.name);
  const hasNonDefaultParams = task.params
    ?.filter(({ name }) => requiredParamNames.includes(name))
    ?.map(({ value }) => !value)
    .reduce((acc, missingDefault) => missingDefault || acc, false);

  const needsName = !task.name;

  const taskInputResources = task.resources?.inputs?.length || 0;
  const requiredInputResources = resource.spec?.resources?.inputs?.length || 0;
  const missingInputResources = requiredInputResources - taskInputResources > 0;

  const taskOutputResources = task.resources?.outputs?.length || 0;
  const requiredOutputResources = resource.spec?.resources?.outputs?.length || 0;
  const missingOutputResources = requiredOutputResources - taskOutputResources > 0;

  const errorListing: TaskErrorType[] = [];
  if (hasNonDefaultParams) {
    errorListing.push(TaskErrorType.MISSING_REQUIRED_PARAMS);
  }
  if (missingInputResources || missingOutputResources) {
    errorListing.push(TaskErrorType.MISSING_RESOURCES);
  }
  if (needsName) {
    errorListing.push(TaskErrorType.MISSING_NAME);
  }

  return { [task.name]: errorListing.length > 0 ? errorListing : null };
};

const addListNode: UpdateOperationAction<UpdateOperationAddData> = (tasks, listTasks, data) => {
  const { direction, relatedTask } = data;

  const newTaskName = `${direction}-${getRandomChars(6)}`;
  const relatedTaskName = relatedTask.name;

  switch (direction) {
    case AddNodeDirection.BEFORE:
      return {
        tasks: tasks.map((pipelineTask) =>
          mapBeRelated<PipelineTask>(newTaskName, relatedTaskName, pipelineTask),
        ),
        listTasks: [
          ...listTasks.map((listTask) =>
            mapBeRelated<PipelineBuilderListTask>(newTaskName, relatedTaskName, listTask),
          ),
          { name: newTaskName, runAfter: relatedTask.runAfter },
        ],
      };
    case AddNodeDirection.AFTER:
      return {
        tasks: tasks.map((pipelineTask) =>
          mapReplaceRelatedInOthers<PipelineTask>(newTaskName, relatedTaskName, pipelineTask),
        ),
        listTasks: [
          ...listTasks.map((listTask) =>
            mapReplaceRelatedInOthers<PipelineBuilderListTask>(
              newTaskName,
              relatedTaskName,
              listTask,
            ),
          ),
          { name: newTaskName, runAfter: [relatedTaskName] },
        ],
      };
    case AddNodeDirection.PARALLEL:
      return {
        tasks: tasks.map((pipelineTask) =>
          mapAddRelatedToOthers<PipelineTask>(newTaskName, relatedTaskName, pipelineTask),
        ),
        listTasks: [
          ...listTasks.map((listTask) =>
            mapAddRelatedToOthers<PipelineBuilderListTask>(newTaskName, relatedTaskName, listTask),
          ),
          { name: newTaskName, runAfter: relatedTask.runAfter },
        ],
      };
    default:
      throw new Error(`Invalid direction ${direction}`);
  }
};

const convertListToTask: UpdateOperationAction<UpdateOperationConvertToTaskData> = (
  tasks,
  listTasks,
  data,
) => {
  const { name, resource, runAfter } = data;

  const newPipelineTask: PipelineTask = convertResourceToTask(resource, runAfter);

  return {
    tasks: [
      ...tasks.map((pipelineTask) =>
        mapReplaceRelatedInOthers(newPipelineTask.name, name, pipelineTask),
      ),
      newPipelineTask,
    ],
    listTasks: listTasks
      .filter((n) => n.name !== name)
      .map((listTask) => mapReplaceRelatedInOthers(newPipelineTask.name, name, listTask)),
    errors: getErrors(newPipelineTask, resource),
  };
};

const removeAndUpdateTasks = <
  URT extends PipelineBuilderTaskBase,
  UT extends PipelineBuilderTaskBase
>(
  removalTaskName: string,
  updateAndRemoveTasks: URT[],
  updateOnlyTasks: UT[],
): { updateOnlyTasks: UT[]; updateAndRemoveTasks: URT[] } => {
  const removalTask = updateAndRemoveTasks.find((task) => task.name === removalTaskName);
  return {
    updateOnlyTasks: updateOnlyTasks.map((task) => mapStitchReplaceInOthers<UT>(removalTask, task)),
    updateAndRemoveTasks: updateAndRemoveTasks
      .filter((task) => task.name !== removalTaskName)
      .map((task) => mapStitchReplaceInOthers<URT>(removalTask, task)),
  };
};

const deleteListTask: UpdateOperationAction<UpdateOperationDeleteListTaskData> = (
  tasks,
  listTasks,
  data,
) => {
  const { listTaskName } = data;

  const { updateOnlyTasks, updateAndRemoveTasks } = removeAndUpdateTasks<
    PipelineBuilderListTask,
    PipelineTask
  >(listTaskName, listTasks, tasks);
  return {
    tasks: updateOnlyTasks,
    listTasks: updateAndRemoveTasks,
    errors: null,
  };
};

export const removeTask: UpdateOperationAction<UpdateOperationRemoveTaskData> = (
  tasks,
  listTasks,
  data,
) => {
  const { taskName } = data;

  const { updateOnlyTasks, updateAndRemoveTasks } = removeAndUpdateTasks<
    PipelineTask,
    PipelineBuilderListTask
  >(taskName, tasks, listTasks);
  return {
    tasks: updateAndRemoveTasks,
    listTasks: updateOnlyTasks,
    errors: { [taskName]: null },
  };
};

const applyResourceUpdate = (
  pipelineTask: PipelineTask,
  resources: UpdateTaskResourceData,
): PipelineTask => {
  const { resourceTarget, selectedPipelineResource, taskResourceName } = resources;

  const existingResources: PipelineResource[] = pipelineTask.resources?.[resourceTarget] || [];
  const filteredResources = existingResources.filter((resource: PipelineTaskResource) => {
    return resource.name !== taskResourceName;
  });

  return {
    ...pipelineTask,
    resources: {
      ...pipelineTask.resources,
      [resourceTarget]: [
        ...filteredResources,
        {
          name: taskResourceName,
          resource: selectedPipelineResource.name,
        },
      ],
    },
  };
};

const applyParamsUpdate = (
  pipelineTask: PipelineTask,
  params: UpdateTaskParamData,
): PipelineTask => {
  const { newValue, taskParamName } = params;

  return {
    ...pipelineTask,
    params: pipelineTask.params.map(
      (param): PipelineTaskParam => {
        if (param.name !== taskParamName) {
          return param;
        }

        return {
          ...param,
          value: newValue,
        };
      },
    ),
  };
};

const updateTask: UpdateOperationAction<UpdateOperationUpdateTaskData> = (
  tasks,
  listTasks,
  data,
) => {
  const { thisPipelineTask, taskResource, newName, params, resources } = data;

  const canRename = !!newName;

  const updatedResourceIndex = tasks.findIndex(
    (pipelineTask) => pipelineTask.name === thisPipelineTask.name,
  );
  const updatedTasks = tasks.map((pipelineTask) => {
    if (pipelineTask.name !== thisPipelineTask.name) {
      if (canRename) {
        return mapReplaceRelatedInOthers(newName, thisPipelineTask.name, pipelineTask);
      }
      return pipelineTask;
    }

    let updatedResource = pipelineTask;
    if (resources) {
      updatedResource = applyResourceUpdate(updatedResource, resources);
    }
    if (params) {
      updatedResource = applyParamsUpdate(updatedResource, params);
    }
    if (canRename) {
      updatedResource = {
        ...updatedResource,
        name: newName,
      };
    }

    return updatedResource;
  });
  const updatedResource = updatedTasks[updatedResourceIndex];

  return {
    tasks: updatedTasks,
    listTasks: canRename
      ? listTasks.map((listTask) =>
          mapReplaceRelatedInOthers(newName, thisPipelineTask.name, listTask),
        )
      : listTasks,
    errors: {
      [thisPipelineTask.name]: null,
      ...getErrors(updatedResource, taskResource),
    },
  };
};

export const applyChange = (
  taskGroup: PipelineBuilderTaskGroup,
  op: UpdateOperation,
): CleanupResults => {
  const { type, data } = op;
  const { tasks, listTasks } = taskGroup;

  switch (type) {
    case UpdateOperationType.ADD_LIST_TASK:
      return addListNode(tasks, listTasks, data as UpdateOperationAddData);
    case UpdateOperationType.CONVERT_LIST_TO_TASK:
      return convertListToTask(tasks, listTasks, data as UpdateOperationConvertToTaskData);
    case UpdateOperationType.DELETE_LIST_TASK:
      return deleteListTask(tasks, listTasks, data as UpdateOperationDeleteListTaskData);
    case UpdateOperationType.REMOVE_TASK:
      return removeTask(tasks, listTasks, data as UpdateOperationRemoveTaskData);
    case UpdateOperationType.UPDATE_TASK:
      return updateTask(tasks, listTasks, data as UpdateOperationUpdateTaskData);
    default:
      throw new Error(`Invalid update operation ${type}`);
  }
};

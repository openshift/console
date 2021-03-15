import * as _ from 'lodash';
import { getRandomChars } from '@console/shared';
import { TaskKind, PipelineTask, PipelineTaskParam, PipelineTaskResource } from '../../../types';
import { AddNodeDirection } from '../pipeline-topology/const';
import { getTaskParameters, getTaskResources } from '../resource-utils';
import { TaskErrorType, UpdateOperationType } from './const';
import {
  CleanupResults,
  PipelineBuilderListTask,
  PipelineBuilderTaskBase,
  PipelineBuilderTaskGroup,
  PipelineBuilderTaskGrouping,
  TaskErrorMap,
  UpdateOperation,
  UpdateOperationAction,
  UpdateOperationAddData,
  UpdateOperationConvertToFinallyTaskData,
  UpdateOperationConvertToTaskData,
  UpdateOperationDeleteListTaskData,
  UpdateOperationFixInvalidTaskListData,
  UpdateOperationRemoveTaskData,
  UpdateOperationUpdateTaskData,
  UpdateTaskParamData,
  UpdateTaskResourceData,
  UpdateTaskWorkspaceData,
} from './types';
import { convertResourceToTask, taskParamIsRequired, hasEmptyString } from './utils';

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
  let newRunAfter: string[] = removalTask.runAfter;
  if (updatedIterationTask.runAfter.length > 0) {
    newRunAfter = [...updatedIterationTask.runAfter, ...newRunAfter];
  }

  return {
    ...updatedIterationTask,
    runAfter: newRunAfter,
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
const getErrors = (task: PipelineTask, resource: TaskKind): TaskErrorMap => {
  const params = getTaskParameters(resource);
  const resourceParams = params || [];
  const requiredParamNames = resourceParams.filter(taskParamIsRequired).map((param) => param.name);
  const hasNonDefaultParams = task.params
    ?.filter(({ name }) => requiredParamNames.includes(name))
    ?.map(({ value }) => !value || (_.isArray(value) && hasEmptyString(value)))
    .reduce((acc, missingDefault) => missingDefault || acc, false);

  const needsName = !task.name;

  const resources = getTaskResources(resource);

  const taskInputResources = task.resources?.inputs?.length || 0;
  const requiredInputResources = (resources.inputs || []).filter((r) => !r?.optional).length;
  const missingInputResources = requiredInputResources - taskInputResources > 0;

  const taskOutputResources = task.resources?.outputs?.length || 0;
  const requiredOutputResources = (resources.outputs || []).filter((r) => !r?.optional).length;
  const missingOutputResources = requiredOutputResources - taskOutputResources > 0;

  const taskWorkspaces = resource.spec.workspaces;
  const missingWorkspaces =
    taskWorkspaces?.length > 0 && taskWorkspaces.length !== task.workspaces?.length;

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
  if (missingWorkspaces) {
    errorListing.push(TaskErrorType.MISSING_WORKSPACES);
  }

  return { [task.name]: errorListing.length > 0 ? errorListing : null };
};

const addListNode: UpdateOperationAction<UpdateOperationAddData> = (taskGrouping, data) => {
  const { direction, relatedTask } = data;

  const newTaskName = `${direction}-${getRandomChars(6)}`;
  const relatedTaskName = relatedTask.name;
  const { tasks, listTasks } = taskGrouping;
  switch (direction) {
    case AddNodeDirection.BEFORE:
      return {
        ...taskGrouping,
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
        ...taskGrouping,
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
        ...taskGrouping,
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

const getTaskNames = (tasks: PipelineTask[]) => tasks.map((t) => t.name);

const convertListToTask: UpdateOperationAction<UpdateOperationConvertToTaskData> = (
  taskGrouping,
  data,
) => {
  const { name, resource, runAfter } = data;
  const { tasks, listTasks, finallyTasks } = taskGrouping;
  const usedNames = getTaskNames([...tasks, ...finallyTasks]);
  const newPipelineTask: PipelineTask = convertResourceToTask(usedNames, resource, runAfter);
  return {
    ...taskGrouping,
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
const convertFinallyListToTask: UpdateOperationAction<UpdateOperationConvertToTaskData> = (
  taskGrouping,
  data,
) => {
  const { name, resource } = data;
  const { tasks, finallyTasks, finallyListTasks } = taskGrouping;
  const usedNames = getTaskNames([...tasks, ...finallyTasks]);
  const newPipelineTask: PipelineTask = convertResourceToTask(usedNames, resource);

  return {
    ...taskGrouping,
    finallyTasks: [
      ...finallyTasks.map((pipelineTask) =>
        mapReplaceRelatedInOthers(newPipelineTask.name, name, pipelineTask),
      ),
      newPipelineTask,
    ],
    finallyListTasks: finallyListTasks
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
  if (!removalTask) {
    return {
      updateAndRemoveTasks,
      updateOnlyTasks,
    };
  }
  return {
    updateOnlyTasks: updateOnlyTasks.map((task) => mapStitchReplaceInOthers<UT>(removalTask, task)),
    updateAndRemoveTasks: updateAndRemoveTasks
      .filter((task) => task.name !== removalTaskName)
      .map((task) => mapStitchReplaceInOthers<URT>(removalTask, task)),
  };
};

const deleteListTask: UpdateOperationAction<UpdateOperationDeleteListTaskData> = (
  taskGrouping,
  data,
) => {
  const { listTaskName } = data;
  const { tasks, listTasks, finallyTasks, finallyListTasks } = taskGrouping;
  const { updateOnlyTasks, updateAndRemoveTasks } = removeAndUpdateTasks<
    PipelineBuilderListTask,
    PipelineTask
  >(listTaskName, listTasks, tasks);
  const {
    updateOnlyTasks: updateFinallyTasks,
    updateAndRemoveTasks: updateFinallyListTasks,
  } = removeAndUpdateTasks<PipelineBuilderListTask, PipelineTask>(
    listTaskName,
    finallyListTasks,
    finallyTasks,
  );
  return {
    ...taskGrouping,
    tasks: updateOnlyTasks,
    listTasks: updateAndRemoveTasks,
    errors: null,
    finallyTasks: updateFinallyTasks,
    finallyListTasks: updateFinallyListTasks,
  };
};

export const removeTask: UpdateOperationAction<UpdateOperationRemoveTaskData> = (
  taskGrouping,
  data,
) => {
  const { taskName } = data;
  const { tasks, listTasks, finallyTasks, finallyListTasks } = taskGrouping;
  const { updateOnlyTasks, updateAndRemoveTasks } = removeAndUpdateTasks<
    PipelineTask,
    PipelineBuilderListTask
  >(taskName, tasks, listTasks);

  const { updateAndRemoveTasks: finallyUpdateAndRemoveTasks } = removeAndUpdateTasks<
    PipelineTask,
    PipelineBuilderListTask
  >(taskName, finallyTasks, finallyListTasks);

  return {
    ...taskGrouping,
    tasks: updateAndRemoveTasks,
    listTasks: updateOnlyTasks,
    finallyTasks: finallyUpdateAndRemoveTasks,
    errors: { [taskName]: null },
  };
};

const applyResourceUpdate = (
  pipelineTask: PipelineTask,
  resources: UpdateTaskResourceData,
): PipelineTask => {
  const { resourceTarget, selectedPipelineResource, taskResourceName } = resources;

  const existingResources: PipelineTaskResource[] = pipelineTask.resources?.[resourceTarget] || [];
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

export const applyParamsUpdate = (
  pipelineTask: PipelineTask,
  params: UpdateTaskParamData,
): PipelineTask => {
  const { newValue, taskParamName } = params;

  let foundParam = false;
  const changedParams =
    pipelineTask.params?.map(
      (param): PipelineTaskParam => {
        if (param.name !== taskParamName) {
          return param;
        }
        foundParam = true;
        return {
          ...param,
          value: newValue,
        };
      },
    ) || [];

  if (!foundParam) {
    changedParams.push({
      name: taskParamName,
      value: newValue,
    });
  }

  return {
    ...pipelineTask,
    params: changedParams,
  };
};

export const applyWorkspaceUpdate = (
  pipelineTask: PipelineTask,
  params: UpdateTaskWorkspaceData,
): PipelineTask => {
  const { workspaceName, selectedWorkspace } = params;
  const allWorkspaces = pipelineTask.workspaces || [];
  const existingWorkspaces = allWorkspaces.filter(({ name }) => name !== workspaceName);
  return {
    ...pipelineTask,
    workspaces: [...existingWorkspaces, { name: workspaceName, workspace: selectedWorkspace }],
  };
};

const updateTask: UpdateOperationAction<UpdateOperationUpdateTaskData> = (taskGrouping, data) => {
  const { thisPipelineTask, taskResource, newName, params, resources, workspaces } = data;
  const { tasks, listTasks, finallyTasks } = taskGrouping;
  const canRename = !!newName;
  const allTasks = [...tasks, ...finallyTasks];
  const updatedResourceIndex = allTasks.findIndex(
    (pipelineTask) => pipelineTask.name === thisPipelineTask.name,
  );

  const getUpdatedTasks = (updateTasks: PipelineTask[]): PipelineTask[] =>
    updateTasks.map((pipelineTask) => {
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
      if (workspaces) {
        updatedResource = applyWorkspaceUpdate(updatedResource, workspaces);
      }
      if (canRename) {
        updatedResource = {
          ...updatedResource,
          name: newName,
        };
      }

      return updatedResource;
    });

  const updatedTasks = getUpdatedTasks(tasks);
  const updatedFinallyTasks = getUpdatedTasks(finallyTasks);
  const updatedResource = [...updatedTasks, ...updatedFinallyTasks][updatedResourceIndex];

  return {
    ...taskGrouping,
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
    finallyTasks: updatedFinallyTasks,
  };
};

const fixInvalidListTask: UpdateOperationAction<UpdateOperationFixInvalidTaskListData> = (
  taskGrouping,
  data,
) => {
  const { existingName, resource, runAfter } = data;
  const { tasks, listTasks } = taskGrouping;
  const usedNames = getTaskNames(tasks);
  const newPipelineTask: PipelineTask = convertResourceToTask(usedNames, resource, runAfter);

  return {
    ...taskGrouping,
    tasks: [
      ...tasks
        .filter((pipelineTask) => pipelineTask.name !== existingName)
        .map((pipelineTask) =>
          mapReplaceRelatedInOthers(newPipelineTask.name, existingName, pipelineTask),
        ),
      newPipelineTask,
    ],
    listTasks,
    errors: getErrors(newPipelineTask, resource),
  };
};

const addFinallyListTask: UpdateOperationAction<UpdateOperationConvertToFinallyTaskData> = (
  taskGrouping,
  data,
) => {
  const { finallyListTasks } = taskGrouping;
  return {
    ...taskGrouping,
    finallyListTasks: [...finallyListTasks, { name: data.listTaskName }],
  };
};

export const applyChange = (
  taskGroup: PipelineBuilderTaskGroup,
  op: UpdateOperation,
): CleanupResults => {
  const { type, data } = op;
  const { tasks, listTasks, finallyTasks, finallyListTasks } = taskGroup;
  const taskGrouping: PipelineBuilderTaskGrouping = {
    tasks,
    listTasks,
    finallyTasks,
    finallyListTasks,
  };
  switch (type) {
    case UpdateOperationType.ADD_LIST_TASK:
      return addListNode(taskGrouping, data as UpdateOperationAddData);
    case UpdateOperationType.CONVERT_LIST_TO_TASK:
      return convertListToTask(taskGrouping, data as UpdateOperationConvertToTaskData);
    case UpdateOperationType.CONVERT_LIST_TO_FINALLY_TASK:
      return convertFinallyListToTask(taskGrouping, data as UpdateOperationConvertToTaskData);
    case UpdateOperationType.DELETE_LIST_TASK:
      return deleteListTask(taskGrouping, data as UpdateOperationDeleteListTaskData);
    case UpdateOperationType.REMOVE_TASK:
      return removeTask(taskGrouping, data as UpdateOperationRemoveTaskData);
    case UpdateOperationType.UPDATE_TASK:
      return updateTask(taskGrouping, data as UpdateOperationUpdateTaskData);
    case UpdateOperationType.FIX_INVALID_LIST_TASK:
      return fixInvalidListTask(taskGrouping, data as UpdateOperationFixInvalidTaskListData);
    case UpdateOperationType.ADD_FINALLY_LIST_TASK:
      return addFinallyListTask(taskGrouping, data as UpdateOperationConvertToFinallyTaskData);
    default:
      throw new Error(`Invalid update operation ${type}`);
  }
};

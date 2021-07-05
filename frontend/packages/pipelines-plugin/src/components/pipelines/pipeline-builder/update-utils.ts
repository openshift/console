import { getRandomChars } from '@console/dynamic-plugin-sdk';
import { PipelineTask } from '../../../types';
import { AddNodeDirection } from '../pipeline-topology/const';
import { UpdateOperationType } from './const';
import {
  CleanupResults,
  PipelineBuilderListTask,
  PipelineBuilderTaskBase,
  PipelineBuilderTaskGroup,
  PipelineBuilderTaskGrouping,
  UpdateOperation,
  UpdateOperationAction,
  UpdateOperationAddData,
  UpdateOperationConvertToFinallyTaskData,
  UpdateOperationConvertToTaskData,
  UpdateOperationDeleteListTaskData,
  UpdateOperationFixInvalidTaskListData,
  UpdateOperationRemoveTaskData,
  UpdateOperationRenameTaskData,
} from './types';
import {
  convertResourceToTask,
  mapAddRelatedToOthers,
  mapBeRelated,
  mapReplaceRelatedInOthers,
  mapStitchReplaceInOthers,
} from './utils';

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
  };
};

const renameTask: UpdateOperationAction<UpdateOperationRenameTaskData> = (taskGrouping, data) => {
  const { preChangePipelineTask, newName } = data;
  const { tasks, listTasks, finallyTasks } = taskGrouping;

  const getUpdatedTasks = (updateTasks: PipelineTask[]): PipelineTask[] =>
    updateTasks.map((pipelineTask) => {
      if (pipelineTask.name !== preChangePipelineTask.name) {
        // Not the task that is changing, rework runAfters that may include it
        return mapReplaceRelatedInOthers(newName, preChangePipelineTask.name, pipelineTask);
      }

      return {
        ...pipelineTask,
        name: newName,
      };
    });

  const updatedTasks = getUpdatedTasks(tasks);
  const updatedFinallyTasks = getUpdatedTasks(finallyTasks);

  return {
    ...taskGrouping,
    tasks: updatedTasks,
    listTasks: listTasks.map((listTask) =>
      mapReplaceRelatedInOthers(newName, preChangePipelineTask.name, listTask),
    ),
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
    case UpdateOperationType.RENAME_TASK:
      return renameTask(taskGrouping, data as UpdateOperationRenameTaskData);
    case UpdateOperationType.FIX_INVALID_LIST_TASK:
      return fixInvalidListTask(taskGrouping, data as UpdateOperationFixInvalidTaskListData);
    case UpdateOperationType.ADD_FINALLY_LIST_TASK:
      return addFinallyListTask(taskGrouping, data as UpdateOperationConvertToFinallyTaskData);
    default:
      throw new Error(`Invalid update operation ${type}`);
  }
};

import { getRandomChars } from '@console/shared/src/utils';
import { PipelineTask } from '../../../utils/pipeline-augment';
import { AddNodeDirection } from '../pipeline-topology/const';
import { UpdateOperationType } from './const';
import {
  CleanupResults,
  PipelineBuilderListTask,
  PipelineBuilderTaskBase,
  PipelineBuilderTaskGroup,
  UpdateOperation,
  UpdateOperationAction,
  UpdateOperationAddData,
  UpdateOperationConvertToTaskData,
  UpdateOperationDeleteListTaskData,
  UpdateOperationFixInvalidTaskListData,
  UpdateOperationRemoveTaskData,
  UpdateOperationUpdateTaskData,
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
  };
};

const updateTask: UpdateOperationAction<UpdateOperationUpdateTaskData> = (
  tasks,
  listTasks,
  data,
) => {
  const { oldName, newName } = data;

  return {
    tasks: tasks.map((pipelineTask) => {
      if (pipelineTask.name !== oldName) {
        return mapReplaceRelatedInOthers(newName, oldName, pipelineTask);
      }

      return {
        ...pipelineTask,
        name: newName,
      };
    }),
    listTasks: listTasks.map((listTask) => mapReplaceRelatedInOthers(newName, oldName, listTask)),
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
  };
};

const fixInvalidListTask: UpdateOperationAction<UpdateOperationFixInvalidTaskListData> = (
  tasks,
  listTasks,
  data,
) => {
  const { existingName, resource, runAfter } = data;

  const newPipelineTask: PipelineTask = convertResourceToTask(resource, runAfter);

  return {
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
    case UpdateOperationType.UPDATE_TASK:
      return updateTask(tasks, listTasks, data as UpdateOperationUpdateTaskData);
    case UpdateOperationType.FIX_INVALID_LIST_TASK:
      return fixInvalidListTask(tasks, listTasks, data as UpdateOperationFixInvalidTaskListData);
    case UpdateOperationType.REMOVE_TASK:
      return removeTask(tasks, listTasks, data as UpdateOperationRemoveTaskData);
    default:
      throw new Error(`Invalid update operation ${type}`);
  }
};

import * as React from 'react';
import { k8sList } from '@console/internal/module/k8s';
import { ClusterTaskModel, TaskModel } from '../../../models';
import {
  PipelineParam,
  PipelineResourceTask,
  PipelineTask,
  PipelineTaskRef,
} from '../../../utils/pipeline-augment';
import { PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';
import { AddNodeDirection } from '../pipeline-topology/const';
import {
  PipelineBuilderTaskNodeModel,
  PipelineMixedNodeModel,
  PipelineTaskListNodeModel,
} from '../pipeline-topology/types';
import {
  createInvalidTaskListNode,
  createTaskListNode,
  handleParallelToParallelNodes,
  tasksToBuilderNodes,
} from '../pipeline-topology/utils';
import {
  PipelineBuilderTaskGroup,
  SelectTaskCallback,
  ResourceTaskStatus,
  UpdateOperationAddData,
  UpdateOperationConvertToTaskData,
  UpdateOperationFixInvalidTaskListData,
  UpdateTasksCallback,
  TaskErrorList,
} from './types';
import { UpdateOperationType } from './const';
import { convertResourceParamsToTaskParams, findTask, getErrorMessage } from './utils';
import { getTaskParameters } from '../resource-utils';

type OnLoadCallback = (err: string, data?: { type: string; tasks: PipelineResourceTask[] }) => void;
export const useTasks = (
  resourceTasks: ResourceTaskStatus,
  namespace: string,
  onLoad: OnLoadCallback,
) => {
  React.useEffect(() => {
    let ignore = false;
    if (!resourceTasks.errorMsg) {
      if (!resourceTasks.namespacedTasks) {
        k8sList(TaskModel, { ns: namespace })
          .then((tasks: PipelineResourceTask[]) => {
            if (ignore) {
              return;
            }
            onLoad(null, { type: 'namespacedTasks', tasks });
          })
          .catch(() => {
            if (ignore) {
              return;
            }
            onLoad('Failed to load namespace Tasks.');
          });
      }

      if (!resourceTasks.clusterTasks) {
        k8sList(ClusterTaskModel)
          .then((tasks: PipelineResourceTask[]) => {
            if (ignore) {
              return;
            }
            onLoad(null, { type: 'clusterTasks', tasks });
          })
          .catch(() => {
            if (ignore) {
              return;
            }
            onLoad('Failed to load ClusterTasks.');
          });
      }
    }

    return () => {
      ignore = true;
    };
  }, [namespace, resourceTasks, onLoad]);
};

export const useSmartLoadTasks = (
  resourceTasks: ResourceTaskStatus,
  namespace: string,
  setFieldValue,
  setStatus,
  isExistingPipeline: boolean,
  currentTasks: PipelineTask[],
) => {
  const balanceTasks = React.useCallback(
    (tasks: PipelineResourceTask[]) => {
      if (!isExistingPipeline) {
        // No need to balance tasks when it's a fresh build
        return;
      }

      // Find the related tasks that need balancing
      const tasksToBalance = currentTasks.reduce((acc, pipelineTask, formikIndex) => {
        const resourceTask = tasks.find((task) => {
          const matchName = task.metadata?.name === pipelineTask.taskRef.name;
          const matchKind = task.kind === pipelineTask.taskRef.kind;
          return matchName && matchKind;
        });
        const hasMissingParams =
          !!resourceTask && pipelineTask?.params?.length !== getTaskParameters(resourceTask).length;

        if (!hasMissingParams) {
          return acc;
        }

        return [
          ...acc,
          {
            formikIndex,
            resourceTask,
            pipelineTask,
          },
        ];
      }, []);
      if (tasksToBalance.length === 0) {
        return;
      }

      // Balance the tasks missing params
      tasksToBalance.forEach(({ formikIndex, resourceTask, pipelineTask }) => {
        const resourceParams = convertResourceParamsToTaskParams(resourceTask);
        const params: PipelineParam[] = resourceParams.map((resourceParam) => {
          const pipelineParam = pipelineTask.params.find(({ name }) => name === resourceParam.name);
          return pipelineParam || resourceParam;
        });

        const updatedTask = {
          ...pipelineTask,
          params,
        };
        setFieldValue(`tasks.${formikIndex}`, updatedTask);
      });
    },
    [setFieldValue, isExistingPipeline, currentTasks],
  );
  const onLoad = React.useCallback<OnLoadCallback>(
    (err, { type, tasks }) => {
      if (err) {
        setStatus({ taskLoadError: err });
        return;
      }
      setFieldValue(type, tasks);
      balanceTasks(tasks);
    },
    [setStatus, setFieldValue, balanceTasks],
  );

  useTasks(resourceTasks, namespace, onLoad);
};

export const useNodes = (
  namespace: string,
  onTaskSelection: SelectTaskCallback,
  onUpdateTasks: UpdateTasksCallback,
  taskGroup: PipelineBuilderTaskGroup,
  tasksInError: TaskErrorList,
  resourceTasks: ResourceTaskStatus,
): PipelineMixedNodeModel[] => {
  const resourceTasksRef = React.useRef(resourceTasks);
  resourceTasksRef.current = resourceTasks;
  const taskGroupRef = React.useRef(taskGroup);
  taskGroupRef.current = taskGroup;

  const getTask = (taskRef: PipelineTaskRef) => findTask(resourceTasksRef.current, taskRef);
  const onNewListNode = (task: PipelineVisualizationTaskItem, direction: AddNodeDirection) => {
    const data: UpdateOperationAddData = { direction, relatedTask: task };
    onUpdateTasks(taskGroupRef.current, { type: UpdateOperationType.ADD_LIST_TASK, data });
  };
  const onNewTask = (resource: PipelineResourceTask, name: string, runAfter?: string[]) => {
    const data: UpdateOperationConvertToTaskData = { resource, name, runAfter };
    onUpdateTasks(taskGroupRef.current, { type: UpdateOperationType.CONVERT_LIST_TO_TASK, data });
  };

  // TODO: Fix id collisions then remove this utility; we shouldn't need to trim the tasks
  const noDuplicates = (resource: PipelineResourceTask) =>
    !taskGroupRef.current.tasks.find((pt) => pt.name === resource.metadata.name);
  const newListNode = (
    name: string,
    runAfter?: string[],
    firstTask?: boolean,
  ): PipelineTaskListNodeModel =>
    createTaskListNode(name, {
      namespaceTaskList: resourceTasksRef.current.namespacedTasks?.filter(noDuplicates),
      clusterTaskList: resourceTasksRef.current.clusterTasks?.filter(noDuplicates),
      onNewTask: (resource: PipelineResourceTask) => {
        onNewTask(resource, name, runAfter);
      },
      onRemoveTask: firstTask
        ? null
        : () => {
            onUpdateTasks(taskGroupRef.current, {
              type: UpdateOperationType.DELETE_LIST_TASK,
              data: { listTaskName: name },
            });
          },
      task: {
        name,
        runAfter: runAfter || [],
      },
    });
  const soloTask = (name = 'initial-node') => newListNode(name, undefined, true);
  const newInvalidListNode = (name: string, runAfter?: string[]): PipelineTaskListNodeModel =>
    createInvalidTaskListNode(name, {
      namespaceTaskList: resourceTasksRef.current.namespacedTasks?.filter(noDuplicates),
      clusterTaskList: resourceTasksRef.current.clusterTasks?.filter(noDuplicates),
      onNewTask: (resource: PipelineResourceTask) => {
        const data: UpdateOperationFixInvalidTaskListData = {
          existingName: name,
          resource,
          runAfter,
        };

        onUpdateTasks(taskGroupRef.current, {
          type: UpdateOperationType.FIX_INVALID_LIST_TASK,
          data,
        });
      },
      onRemoveTask: () => {
        onUpdateTasks(taskGroupRef.current, {
          type: UpdateOperationType.REMOVE_TASK,
          data: { taskName: name },
        });
      },
      task: {
        name,
        runAfter: runAfter || [],
      },
    });

  const invalidTaskList = taskGroup.tasks.filter((task) => !getTask(task.taskRef));
  const validTaskList = taskGroup.tasks.filter((task) => !!getTask(task.taskRef));

  const invalidTaskListNodes: PipelineTaskListNodeModel[] = invalidTaskList.map((task) =>
    newInvalidListNode(task.name, task.runAfter),
  );
  const taskNodes: PipelineBuilderTaskNodeModel[] =
    validTaskList.length > 0
      ? tasksToBuilderNodes(
          validTaskList,
          onNewListNode,
          (task) => onTaskSelection(task, getTask(task.taskRef)),
          getErrorMessage(tasksInError),
          taskGroup.highlightedIds,
        )
      : [];
  const taskListNodes: PipelineTaskListNodeModel[] =
    taskGroup.tasks.length === 0 && taskGroup.listTasks.length <= 1
      ? [soloTask(taskGroup.listTasks[0]?.name)]
      : taskGroup.listTasks.map((listTask) => newListNode(listTask.name, listTask.runAfter));

  return handleParallelToParallelNodes([...taskNodes, ...taskListNodes, ...invalidTaskListNodes]);
};

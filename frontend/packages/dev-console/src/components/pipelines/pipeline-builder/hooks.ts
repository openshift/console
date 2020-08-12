import * as React from 'react';
import * as _ from 'lodash';
import { k8sList } from '@console/internal/module/k8s';
import { ClusterTaskModel, TaskModel } from '../../../models';
import {
  PipelineResource,
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
  TaskErrorMap,
  UpdateErrors,
  UpdateOperationAddData,
  UpdateOperationConvertToTaskData,
  UpdateOperationFixInvalidTaskListData,
  UpdateTasksCallback,
} from './types';
import { nodeTaskErrors, TaskErrorType, UpdateOperationType } from './const';
import { getErrorMessage } from './utils';

type UseTasks = {
  namespacedTasks: PipelineResourceTask[] | null;
  clusterTasks: PipelineResourceTask[] | null;
  errorMsg?: string;
};
export const useTasks = (namespace?: string): UseTasks => {
  const [namespacedTasks, setNamespacedTasks] = React.useState<PipelineResourceTask[]>(null);
  const [clusterTasks, setClusterTasks] = React.useState<PipelineResourceTask[]>(null);
  const [loadErrorMsg, setLoadErrorMsg] = React.useState<string>(undefined);

  React.useEffect(() => {
    let ignore = false;
    if (loadErrorMsg) {
      return null;
    }

    if (!namespacedTasks) {
      if (!namespace) {
        setNamespacedTasks([]);
      } else {
        k8sList(TaskModel, { ns: namespace })
          .then((res: PipelineResourceTask[]) => {
            if (ignore) {
              return;
            }
            setNamespacedTasks(res);
          })
          .catch(() => {
            setLoadErrorMsg(`Failed to load namespace Tasks. ${loadErrorMsg || ''}`);
          });
      }
    }

    if (!clusterTasks) {
      k8sList(ClusterTaskModel)
        .then((res: PipelineResourceTask[]) => {
          if (ignore) {
            return;
          }
          setClusterTasks(res);
        })
        .catch(() => {
          setLoadErrorMsg(`Failed to load ClusterTasks. ${loadErrorMsg || ''}`);
        });
    }
    return () => {
      ignore = true;
    };
  }, [
    namespace,
    namespacedTasks,
    setNamespacedTasks,
    clusterTasks,
    setClusterTasks,
    setLoadErrorMsg,
    loadErrorMsg,
  ]);

  return {
    namespacedTasks,
    clusterTasks,
    errorMsg: loadErrorMsg,
  };
};

type UseNodes = {
  nodes: PipelineMixedNodeModel[];
  tasksCount: number;
  tasksLoaded: boolean;
  loadingTasksError?: string;
};
export const useNodes = (
  namespace: string,
  onTaskSelection: SelectTaskCallback,
  onUpdateTasks: UpdateTasksCallback,
  taskGroup: PipelineBuilderTaskGroup,
  tasksInError: TaskErrorMap,
): UseNodes => {
  const { clusterTasks, namespacedTasks, errorMsg } = useTasks(namespace);

  const getTask = (taskRef: PipelineTaskRef) => {
    if (taskRef.kind === ClusterTaskModel.kind) {
      return clusterTasks?.find((task) => task.metadata.name === taskRef.name);
    }
    return namespacedTasks?.find((task) => task.metadata.name === taskRef.name);
  };

  const taskGroupRef = React.useRef(taskGroup);
  taskGroupRef.current = taskGroup;

  const onNewListNode = (task: PipelineVisualizationTaskItem, direction: AddNodeDirection) => {
    const data: UpdateOperationAddData = { direction, relatedTask: task };
    onUpdateTasks(taskGroupRef.current, { type: UpdateOperationType.ADD_LIST_TASK, data });
  };
  const onNewTask = (resource: PipelineResourceTask, name: string, runAfter?: string[]) => {
    const data: UpdateOperationConvertToTaskData = { resource, name, runAfter };
    onUpdateTasks(taskGroupRef.current, { type: UpdateOperationType.CONVERT_LIST_TO_TASK, data });
  };

  const newListNode = (
    name: string,
    runAfter?: string[],
    firstTask?: boolean,
  ): PipelineTaskListNodeModel =>
    createTaskListNode(name, {
      namespaceTaskList: namespacedTasks,
      clusterTaskList: clusterTasks,
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
      namespaceTaskList: namespacedTasks,
      clusterTaskList: clusterTasks,
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
          getErrorMessage(nodeTaskErrors, tasksInError),
          taskGroup.highlightedIds,
        )
      : [];
  const taskListNodes: PipelineTaskListNodeModel[] =
    taskGroup.tasks.length === 0 && taskGroup.listTasks.length <= 1
      ? [soloTask(taskGroup.listTasks[0]?.name)]
      : taskGroup.listTasks.map((listTask) => newListNode(listTask.name, listTask.runAfter));

  const nodes: PipelineMixedNodeModel[] = handleParallelToParallelNodes([
    ...taskNodes,
    ...taskListNodes,
    ...invalidTaskListNodes,
  ]);

  const localTaskCount = namespacedTasks?.length || 0;
  const clusterTaskCount = clusterTasks?.length || 0;

  return {
    tasksCount: localTaskCount + clusterTaskCount,
    tasksLoaded: !!namespacedTasks && !!clusterTasks,
    loadingTasksError: errorMsg,
    nodes,
  };
};

export const useResourceValidation = (
  tasks: PipelineTask[],
  resourceValues: PipelineResource[],
  onError: UpdateErrors,
) => {
  const [previousErrorIds, setPreviousErrorIds] = React.useState([]);

  React.useEffect(() => {
    const resourceNames = resourceValues.map((r) => r.name);

    const errors = tasks.reduce((acc, task) => {
      const output = task.resources?.outputs || [];
      const input = task.resources?.inputs || [];
      const missingResources = [...output, ...input].filter(
        (r) => !resourceNames.includes(r.resource),
      );

      if (missingResources.length === 0) {
        return acc;
      }

      return {
        ...acc,
        [task.name]: [TaskErrorType.MISSING_RESOURCES],
      };
    }, {});

    if (!_.isEmpty(errors) || previousErrorIds.length > 0) {
      const outputErrors = previousErrorIds.reduce((acc, id) => {
        if (acc[id]) {
          // Error exists, leave it alone
          return acc;
        }

        // Error doesn't exist but we had it once, make sure it is cleared
        return {
          ...acc,
          [id]: null,
        };
      }, errors);

      const currentErrorIds = Object.keys(outputErrors).filter((id) => !!outputErrors[id]);
      if (!_.isEqual(currentErrorIds, previousErrorIds)) {
        setPreviousErrorIds(currentErrorIds);
      }
      onError(outputErrors);
    }
  }, [tasks, resourceValues, onError, previousErrorIds, setPreviousErrorIds]);
};

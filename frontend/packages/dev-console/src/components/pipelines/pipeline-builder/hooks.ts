import * as React from 'react';
import { k8sList } from '@console/internal/module/k8s';
import { ClusterTaskModel, TaskModel } from '../../../models';
import {
  PipelineResourceTask,
  PipelineTask,
  PipelineTaskRef,
} from '../../../utils/pipeline-augment';
import { PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';
import { getRandomChars } from '../pipeline-resource/pipelineResource-utils';
import { AddNodeDirection } from '../pipeline-topology/const';
import { PipelineMixedNodeModel, PipelineTaskListNode } from '../pipeline-topology/types';
import {
  createTaskListNode,
  handleParallelToParallelNodes,
  tasksToBuilderNodes,
} from '../pipeline-topology/utils';
import {
  SelectTaskCallback,
  SetTaskErrorCallback,
  TaskErrorMap,
  UpdateTaskCallback,
} from './types';
import { convertResourceToTask } from './utils';

type UseTasks = {
  namespacedTasks: PipelineResourceTask[] | null;
  clusterTasks: PipelineResourceTask[] | null;
  errorMsg?: string;
  getTask: (taskRef: PipelineTaskRef) => PipelineResourceTask;
};
export const useTasks = (namespace?: string, taskNames?: string[]): UseTasks => {
  const [namespacedTasks, setNamespacedTasks] = React.useState<PipelineResourceTask[]>(null);
  const [clusterTasks, setClusterTasks] = React.useState<PipelineResourceTask[]>(null);
  const [loadErrorMsg, setLoadErrorMsg] = React.useState<string>(undefined);

  React.useEffect(() => {
    let ignore = false;
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

  const includedValues = (resource: PipelineResourceTask) =>
    !taskNames?.includes(resource.metadata.name);

  return {
    namespacedTasks: namespacedTasks?.filter(includedValues),
    clusterTasks: clusterTasks?.filter(includedValues),
    errorMsg: loadErrorMsg,
    getTask: (taskRef) => {
      if (taskRef.kind === ClusterTaskModel.kind) {
        return clusterTasks.find((task) => task.metadata.name === taskRef.name);
      }
      return namespacedTasks.find((task) => task.metadata.name === taskRef.name);
    },
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
  onSetError: SetTaskErrorCallback,
  onTaskSelection: SelectTaskCallback,
  onUpdateTasks: UpdateTaskCallback,
  pipelineTasks: PipelineTask[],
  tasksInError: TaskErrorMap,
): UseNodes => {
  const { clusterTasks, namespacedTasks, errorMsg, getTask } = useTasks(
    namespace,
    pipelineTasks.map((plTask) => plTask.name),
  );
  const [listNodes, setListNodes] = React.useState<PipelineTaskListNode[]>([]);

  const pipelineTaskList = React.useRef(pipelineTasks);
  pipelineTaskList.current = pipelineTasks;

  const newListNode = (name: string, runAfter?: string[]): PipelineTaskListNode =>
    createTaskListNode(name, {
      namespaceTaskList: namespacedTasks,
      clusterTaskList: clusterTasks,
      onNewTask: (resource: PipelineResourceTask) => {
        const newPipelineTask: PipelineTask = convertResourceToTask(resource, runAfter);
        onUpdateTasks([
          ...pipelineTaskList.current.map((task) => {
            if (!task.runAfter?.includes(name)) {
              return task;
            }
            return {
              ...task,
              runAfter: task.runAfter.map((taskName) => {
                if (taskName === name) {
                  return resource.metadata.name;
                }
                return taskName;
              }),
            };
          }),
          newPipelineTask,
        ]);
        setListNodes(listNodes.filter((n) => n.id !== name));

        const hasNonDefaultParams = newPipelineTask.params
          ?.map(({ value }) => !value)
          .reduce((acc, missingDefault) => missingDefault || acc, false);
        const inputResourceCount = resource.spec?.inputs?.resources?.length || 0;
        const outputResourceCount = resource.spec?.outputs?.resources?.length || 0;
        const totalResourceCount = inputResourceCount + outputResourceCount;

        if (hasNonDefaultParams || totalResourceCount > 0) {
          onSetError(
            newPipelineTask.name,
            inputResourceCount,
            outputResourceCount,
            hasNonDefaultParams,
          );
        }
      },
      task: {
        name,
        runAfter: runAfter || [],
      },
    });

  const onNewListNode = (task: PipelineVisualizationTaskItem, direction: AddNodeDirection) => {
    let newNode: PipelineTaskListNode;
    switch (direction) {
      case AddNodeDirection.AFTER: {
        const taskName = `new-after-node-${getRandomChars(6)}`;

        onUpdateTasks(
          pipelineTaskList.current.map((pipelineTask) => {
            if (!pipelineTask?.runAfter?.includes(task.name)) {
              return pipelineTask;
            }

            const remainingRunAfters = (pipelineTask.runAfter || []).filter(
              (runAfterName) => runAfterName !== task.name,
            );

            return {
              ...pipelineTask,
              runAfter: [...remainingRunAfters, taskName],
            };
          }),
        );
        newNode = newListNode(taskName, [task.name]);
        break;
      }
      case AddNodeDirection.BEFORE: {
        const taskName = `new-before-node-${getRandomChars(6)}`;
        const pipelineMap: { [name: string]: PipelineTask } = pipelineTaskList.current.reduce(
          (map, pipelineTask) => ({ ...map, [pipelineTask.name]: pipelineTask }),
          {},
        );

        const runAfterItem = pipelineMap[task.name];
        const existingRunAfters = runAfterItem.runAfter || [];
        pipelineMap[task.name] = {
          ...pipelineMap[task.name],
          runAfter: [taskName],
        };

        newNode = newListNode(taskName, existingRunAfters);
        onUpdateTasks(Object.values(pipelineMap));
        break;
      }
      case AddNodeDirection.PARALLEL: {
        const taskName = `new-parallel-node-${getRandomChars(6)}`;
        const pipelineMap: { [name: string]: PipelineTask } = pipelineTaskList.current.reduce(
          (map, pipelineTask) => ({ ...map, [pipelineTask.name]: pipelineTask }),
          {},
        );

        const runParallelItem = pipelineMap[task.name];
        const myRunAfters: string[] = runParallelItem.runAfter || [];
        onUpdateTasks(
          pipelineTaskList.current.map((pipelineTask) => {
            const currentRunAfters = pipelineTask?.runAfter || [];
            if (!currentRunAfters.includes(runParallelItem.name)) {
              return pipelineTask;
            }

            return {
              ...pipelineTask,
              runAfter: [...currentRunAfters, taskName],
            };
          }),
        );

        newNode = newListNode(taskName, myRunAfters);
        break;
      }
      default:
        throw new Error(`Invalid direction ${direction}`);
    }
    setListNodes([...listNodes, newNode]);
  };

  const existingNodes: PipelineMixedNodeModel[] =
    pipelineTasks.length > 0
      ? tasksToBuilderNodes(pipelineTasks, tasksInError, onNewListNode, (task) =>
          onTaskSelection(task, getTask(task.taskRef)),
        )
      : [newListNode('initial-node')];

  const nodes: PipelineMixedNodeModel[] = handleParallelToParallelNodes([
    ...existingNodes,
    ...listNodes,
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

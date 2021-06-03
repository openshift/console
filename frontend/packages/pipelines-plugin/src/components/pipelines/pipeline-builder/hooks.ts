import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getRandomChars } from '@console/shared';
import { useFormikContext, FormikTouched } from 'formik';
import { referenceForModel } from '@console/internal/module/k8s';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ClusterTaskModel, TaskModel } from '../../../models';
import { PipelineTask, TaskKind } from '../../../types';
import { AddNodeDirection } from '../pipeline-topology/const';
import {
  PipelineBuilderTaskNodeModel,
  PipelineMixedNodeModel,
  PipelineTaskListNodeModel,
} from '../pipeline-topology/types';
import {
  createBuilderFinallyNode,
  createInvalidTaskListNode,
  createTaskListNode,
  getFinallyTaskHeight,
  getFinallyTaskWidth,
  getLastRegularTasks,
  handleParallelToParallelNodes,
  tasksToBuilderNodes,
} from '../pipeline-topology/utils';
import {
  PipelineBuilderFormikValues,
  PipelineBuilderTaskResources,
  PipelineBuilderTaskGroup,
  SelectTaskCallback,
  UpdateOperationAddData,
  UpdateOperationConvertToFinallyTaskData,
  UpdateOperationConvertToTaskData,
  UpdateOperationFixInvalidTaskListData,
  UpdateTasksCallback,
  BuilderTasksErrorGroup,
  TaskErrors,
} from './types';
import { UpdateOperationType } from './const';
import { findTask, getTopLevelErrorMessage } from './utils';

export const useFormikFetchAndSaveTasks = (namespace: string, validateForm: () => void) => {
  const { t } = useTranslation();
  const { setFieldValue, setStatus } = useFormikContext<PipelineBuilderFormikValues>();

  const { namespacedTasks, clusterTasks } = useK8sWatchResources<{
    namespacedTasks: TaskKind[];
    clusterTasks: TaskKind[];
  }>({
    namespacedTasks: {
      kind: referenceForModel(TaskModel),
      isList: true,
      namespace,
    },
    clusterTasks: {
      kind: referenceForModel(ClusterTaskModel),
      isList: true,
      namespaced: false,
    },
  });
  const namespacedTaskData = namespacedTasks.loaded ? namespacedTasks.data : null;
  const clusterTaskData = clusterTasks.loaded ? clusterTasks.data : null;

  React.useEffect(() => {
    if (namespacedTaskData) {
      setFieldValue('taskResources.namespacedTasks', namespacedTaskData, false);
    }
    if (clusterTaskData) {
      setFieldValue('taskResources.clusterTasks', clusterTaskData, false);
    }
    const tasksLoaded = !!namespacedTaskData && !!clusterTaskData;
    setFieldValue('taskResources.tasksLoaded', tasksLoaded, false);
    if (tasksLoaded) {
      // Wait for Formik to fully understand the set values (thread end) and then validate again
      setTimeout(() => validateForm(), 0);
    }
  }, [setFieldValue, namespacedTaskData, clusterTaskData, validateForm]);

  const error = namespacedTasks.loadError || clusterTasks.loadError;
  React.useEffect(() => {
    if (!error) return;

    setStatus({
      taskLoadingError: t('pipelines-plugin~Failed to load Tasks. {{error}}', { error }),
    });
  }, [t, setStatus, error]);
};

const useConnectFinally = (
  namespace,
  nodes,
  taskGroup: PipelineBuilderTaskGroup,
  onTaskSelection: SelectTaskCallback,
  onUpdateTasks: UpdateTasksCallback,
  taskResources: PipelineBuilderTaskResources,
  tasksInError: TaskErrors,
): PipelineMixedNodeModel => {
  const { clusterTasks, namespacedTasks } = taskResources;
  const taskGroupRef = React.useRef(taskGroup);
  taskGroupRef.current = taskGroup;
  const addNewFinallyListNode = () => {
    const data: UpdateOperationConvertToFinallyTaskData = {
      listTaskName: `finally-list-${getRandomChars(6)}`,
    };
    onUpdateTasks(taskGroupRef.current, { type: UpdateOperationType.ADD_FINALLY_LIST_TASK, data });
  };

  const convertListToFinallyTask = (resource: TaskKind, name: string) => {
    const data: UpdateOperationConvertToTaskData = { resource, name };
    onUpdateTasks(taskGroupRef.current, {
      type: UpdateOperationType.CONVERT_LIST_TO_FINALLY_TASK,
      data,
    });
  };
  const allTasksLength = taskGroup.finallyTasks.length + taskGroup.finallyListTasks.length;
  const finallyNodeName = `finally-node-${taskGroup.finallyTasks.length}-${taskGroup.finallyListTasks.length}`;
  const regularRunAfters = getLastRegularTasks(nodes);

  return createBuilderFinallyNode(
    getFinallyTaskHeight(allTasksLength, false),
    getFinallyTaskWidth(allTasksLength),
  )(finallyNodeName, {
    isFinallyTask: true,
    namespace,
    namespaceTaskList: namespacedTasks,
    clusterTaskList: clusterTasks,
    task: {
      isFinallyTask: true,
      name: finallyNodeName,
      runAfter: regularRunAfters,
      addNewFinallyListNode,
      finallyTasks: taskGroup.finallyTasks.map((ft, idx) => ({
        ...ft,
        onTaskSelection: () => onTaskSelection(ft, findTask(taskResources, ft), true),
        error: getTopLevelErrorMessage(tasksInError)(idx),
        selected: taskGroup.highlightedIds.includes(ft.name),
        disableTooltip: true,
      })),
      finallyListTasks: taskGroup.finallyListTasks.map((flt) => ({
        ...flt,
        convertList: (resource: TaskKind) => convertListToFinallyTask(resource, flt.name),
        onRemoveTask: () => {
          onUpdateTasks(taskGroupRef.current, {
            type: UpdateOperationType.DELETE_LIST_TASK,
            data: { listTaskName: flt.name },
          });
        },
      })),
    },
  });
};

export const useNodes = (
  onTaskSelection: SelectTaskCallback,
  onUpdateTasks: UpdateTasksCallback,
  taskGroup: PipelineBuilderTaskGroup,
  taskResources: PipelineBuilderTaskResources,
  tasksInError: BuilderTasksErrorGroup,
): PipelineMixedNodeModel[] => {
  const { clusterTasks, namespacedTasks } = taskResources;

  const taskGroupRef = React.useRef(taskGroup);
  taskGroupRef.current = taskGroup;

  const onNewListNode = (task: PipelineTask, direction: AddNodeDirection) => {
    const data: UpdateOperationAddData = { direction, relatedTask: task };
    onUpdateTasks(taskGroupRef.current, { type: UpdateOperationType.ADD_LIST_TASK, data });
  };
  const onNewTask = (resource: TaskKind, name: string, runAfter?: string[]) => {
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
      onNewTask: (resource: TaskKind) => {
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
      onNewTask: (resource: TaskKind) => {
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

  const invalidTaskList = taskGroup.tasks.filter((task) => !findTask(taskResources, task));
  const validTaskList = taskGroup.tasks.filter((task) => !!findTask(taskResources, task));

  const invalidTaskListNodes: PipelineTaskListNodeModel[] = invalidTaskList.map((task) =>
    newInvalidListNode(task.name, task.runAfter),
  );
  const taskNodes: PipelineBuilderTaskNodeModel[] =
    validTaskList.length > 0
      ? tasksToBuilderNodes(
          validTaskList,
          onNewListNode,
          (task) => onTaskSelection(task, findTask(taskResources, task), false),
          getTopLevelErrorMessage(tasksInError.tasks),
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

  const finallyNode = useConnectFinally(
    'namespace', // why is this needed?
    nodes,
    taskGroup,
    onTaskSelection,
    onUpdateTasks,
    taskResources,
    tasksInError.finally,
  );

  return [...nodes, finallyNode];
};

const touchTaskWorkspaces = (task: PipelineTask): FormikTouched<PipelineTask> => ({
  workspaces: task.workspaces?.map(() => ({ workspace: true })),
});

const touchTaskResources = (task: PipelineTask): FormikTouched<PipelineTask> => ({
  resources: {
    inputs: task.resources?.inputs?.map(() => ({ resource: true })),
    outputs: task.resources?.outputs?.map(() => ({ resource: true })),
  },
});

export const useExplicitPipelineTaskTouch = () => {
  const { setTouched, touched, values } = useFormikContext<PipelineBuilderFormikValues>();
  const workspacesTouched = !!touched.formData?.workspaces;
  const resourcesTouched = !!touched.formData?.resources;

  React.useEffect(() => {
    if (workspacesTouched) {
      setTouched({
        formData: {
          tasks: values.formData?.tasks?.map(touchTaskWorkspaces),
          finallyTasks: values.formData?.finallyTasks?.map(touchTaskWorkspaces),
        },
      });
    }
    if (resourcesTouched) {
      setTouched({
        formData: {
          tasks: values.formData?.tasks?.map(touchTaskResources),
          finallyTasks: values.formData?.finallyTasks?.map(touchTaskResources),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspacesTouched, resourcesTouched]);
};

import * as React from 'react';
import { useFormikContext, FormikTouched } from 'formik';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { getRandomChars } from '@console/shared';
import { ClusterTaskModel, TaskModel } from '../../../models';
import { PipelineTask, TaskKind } from '../../../types';
import { AddNodeDirection } from '../pipeline-topology/const';
import {
  PipelineBuilderTaskNodeModel,
  PipelineMixedNodeModel,
  PipelineTaskListNodeModel,
  PipelineTaskLoadingNodeModel,
} from '../pipeline-topology/types';
import {
  createBuilderFinallyNode,
  createInvalidTaskListNode,
  createLoadingNode,
  createTaskListNode,
  getFinallyTaskHeight,
  getFinallyTaskWidth,
  getLastRegularTasks,
  handleParallelToParallelNodes,
  tasksToBuilderNodes,
} from '../pipeline-topology/utils';
import { UpdateOperationType } from './const';
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
  TaskSearchCallback,
  BuilderTasksErrorGroup,
  TaskErrors,
  UpdateOperationConvertToLoadingTaskData,
} from './types';
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
  onTaskSearch: TaskSearchCallback,
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

  const onNewInstallingTask = (
    resource: TaskKind,
    name: string,
    isFinallyTask: boolean,
    runAfter?: string[],
  ) => {
    const data: UpdateOperationConvertToLoadingTaskData = {
      resource,
      name,
      runAfter,
      isFinallyTask,
    };
    onUpdateTasks(taskGroupRef.current, { type: UpdateOperationType.ADD_LOADING_TASK, data });
  };

  const convertListToFinallyTask = (resource: TaskKind, name: string) => {
    const data: UpdateOperationConvertToTaskData = { resource, name };
    onUpdateTasks(taskGroupRef.current, {
      type: UpdateOperationType.CONVERT_LIST_TO_FINALLY_TASK,
      data,
    });
  };
  const convertInvalidListToFinallyTask = (resource: TaskKind, name: string) => {
    const data: UpdateOperationFixInvalidTaskListData = {
      existingName: name,
      resource,
      runAfter: [],
    };

    onUpdateTasks(taskGroupRef.current, {
      type: UpdateOperationType.FIX_INVALID_FINALLY_LIST_TASK,
      data,
    });
  };

  const finallyLoadingTasks = taskGroup.loadingTasks.filter((lt) => lt.isFinallyTask);
  const finallyValidTasks = taskGroup.finallyTasks.filter(
    (task) => !!findTask(taskResources, task),
  );
  const finallyInvalidTasks = taskGroup.finallyTasks.filter(
    (task) => !findTask(taskResources, task),
  );

  const allTasksLength =
    taskGroup.finallyTasks.length + taskGroup.finallyListTasks.length + finallyLoadingTasks.length;
  const finallyNodeName = `finally-node-${taskGroup.finallyTasks.length}-${taskGroup.finallyListTasks.length}`;
  const regularRunAfters = getLastRegularTasks(nodes);

  const getInvalidFinallyListTaskData = (task) => ({
    ...task,
    convertList: (resource: TaskKind) =>
      resource.kind
        ? convertInvalidListToFinallyTask(resource, task.name)
        : onNewInstallingTask(resource, task.name, true, regularRunAfters),
    onRemoveTask: () => {
      onUpdateTasks(taskGroupRef.current, {
        type: UpdateOperationType.REMOVE_TASK,
        data: { taskName: task.name },
      });
    },
  });

  const getFinallyListTaskData = (task) => ({
    ...task,
    convertList: (resource: TaskKind) =>
      resource.kind
        ? convertListToFinallyTask(resource, task.name)
        : onNewInstallingTask(resource, task.name, true, regularRunAfters),
    onRemoveTask: () => {
      onUpdateTasks(taskGroupRef.current, {
        type: UpdateOperationType.DELETE_LIST_TASK,
        data: { listTaskName: task.name },
      });
    },
  });

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
      onTaskSearch,
      finallyTasks: finallyValidTasks.map((ft, idx) => ({
        ...ft,
        onTaskSelection: () => onTaskSelection(ft, findTask(taskResources, ft), true),
        error: getTopLevelErrorMessage(tasksInError)(idx),
        selected: taskGroup.highlightedIds.includes(ft.name),
        disableTooltip: true,
      })),
      finallyLoadingTasks,
      finallyInvalidListTasks: finallyInvalidTasks.map((ivlt) =>
        getInvalidFinallyListTaskData(ivlt),
      ),
      finallyListTasks: taskGroup.finallyListTasks.map((flt) => getFinallyListTaskData(flt)),
    },
  });
};

export const useNodes = (
  onTaskSelection: SelectTaskCallback,
  onUpdateTasks: UpdateTasksCallback,
  onTaskSearch: TaskSearchCallback,
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

  const onNewInstallingTask = (resource: TaskKind, name: string, runAfter?: string[]) => {
    const data: UpdateOperationConvertToLoadingTaskData = {
      resource,
      name,
      runAfter,
      isFinallyTask: false,
    };
    onUpdateTasks(taskGroupRef.current, { type: UpdateOperationType.ADD_LOADING_TASK, data });
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
        resource.kind
          ? onNewTask(resource, name, runAfter)
          : onNewInstallingTask(resource, name, runAfter);
      },
      onTaskSearch,
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
        resource.kind
          ? onUpdateTasks(taskGroupRef.current, {
              type: UpdateOperationType.FIX_INVALID_LIST_TASK,
              data,
            })
          : onNewInstallingTask(resource, name, runAfter);
      },
      onTaskSearch,
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
  const newLoadingNode = (name: string, runAfter?: string[]): PipelineTaskLoadingNodeModel =>
    createLoadingNode(name, {
      isFinallyTask: false,
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
  const loadingTasks = taskGroup.loadingTasks.filter((lt) => !lt.isFinallyTask);
  const loadingNodes: PipelineTaskListNodeModel[] = loadingTasks.map((task) =>
    newLoadingNode(task.name, task.runAfter),
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
    taskGroup.tasks.length === 0 && taskGroup.listTasks.length <= 1 && loadingTasks.length === 0
      ? [soloTask(taskGroup.listTasks[0]?.name)]
      : taskGroup.listTasks.map((listTask) => newListNode(listTask.name, listTask.runAfter));

  const nodes: PipelineMixedNodeModel[] = handleParallelToParallelNodes([
    ...taskNodes,
    ...taskListNodes,
    ...invalidTaskListNodes,
    ...loadingNodes,
  ]);

  const finallyNode = useConnectFinally(
    'namespace', // why is this needed?
    nodes,
    taskGroup,
    onTaskSelection,
    onUpdateTasks,
    onTaskSearch,
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

export const useLoadingTaskCleanup = (
  onUpdateTasks: UpdateTasksCallback,
  taskGroup: PipelineBuilderTaskGroup,
) => {
  const { values } = useFormikContext<PipelineBuilderFormikValues>();

  React.useEffect(() => {
    const { loadingTasks } = values.formData;
    loadingTasks.map((task) => {
      const installedTask = values.taskResources.namespacedTasks.find(
        (nt) => nt.metadata.name === task?.taskRef.name,
      );
      if (installedTask) {
        const data: UpdateOperationConvertToTaskData = {
          resource: installedTask,
          name: task.name,
          runAfter: task.runAfter,
        };
        const updateOperationType = task.isFinallyTask
          ? UpdateOperationType.CONVERT_LOADING_TASK_TO_FINALLY_TASK
          : UpdateOperationType.CONVERT_LOADING_TASK_TO_TASK;
        onUpdateTasks(taskGroup, {
          type: updateOperationType,
          data,
        });
      }
      return task;
    });
  }, [values, onUpdateTasks, taskGroup]);
};

export const useCleanupOnFailure = (
  failedTasks: string[],
  onUpdateTasks: UpdateTasksCallback,
  taskGroup: PipelineBuilderTaskGroup,
) => {
  const { values } = useFormikContext<PipelineBuilderFormikValues>();
  React.useEffect(() => {
    const { loadingTasks } = values.formData;
    loadingTasks.map((task) => {
      if (failedTasks.includes(task?.taskRef.name)) {
        const data: UpdateOperationConvertToTaskData = {
          resource: task.resource,
          name: task.name,
          runAfter: task.runAfter,
        };
        const updateOperationType = task.isFinallyTask
          ? UpdateOperationType.CONVERT_LOADING_TASK_TO_FINALLY_TASK
          : UpdateOperationType.CONVERT_LOADING_TASK_TO_TASK;
        onUpdateTasks(taskGroup, {
          type: updateOperationType,
          data,
        });
      }
      return task;
    });
  }, [values, onUpdateTasks, taskGroup, failedTasks]);
};

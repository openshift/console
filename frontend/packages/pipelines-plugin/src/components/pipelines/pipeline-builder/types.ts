import { FormikValues, FormikErrors } from 'formik';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import {
  PipelineTask,
  TektonParam,
  TektonResource,
  TaskKind,
  TektonWorkspace,
  WhenExpression,
} from '../../../types';
import { AddNodeDirection } from '../pipeline-topology/const';
// eslint-disable-next-line import/no-cycle
import { UpdateOperationType } from './const';

export type TaskType = 'tasks' | 'finallyTasks';

export type TaskErrors = FormikErrors<PipelineTask>[];
export type BuilderTasksErrorGroup = {
  tasks: TaskErrors;
  finally: TaskErrors;
};

export type CheckTaskErrorMessage = (taskIndex: number) => string | null;
export type GetErrorMessage = (errors: TaskErrors) => CheckTaskErrorMessage;

export type PipelineBuilderTaskBase = { name: string; runAfter?: string[] };

export type PipelineBuilderListTask = PipelineBuilderTaskBase;

export type PipelineBuilderTaskGrouping = {
  tasks: PipelineTask[];
  listTasks: PipelineBuilderListTask[];
  finallyTasks: PipelineTask[];
  finallyListTasks: PipelineBuilderListTask[];
};

export type PipelineBuilderTaskResources = {
  namespacedTasks: TaskKind[];
  clusterTasks: TaskKind[];
  tasksLoaded: boolean;
};

export type PipelineBuilderTaskGroup = PipelineBuilderTaskGrouping & {
  highlightedIds: string[];
};

export type PipelineBuilderFormValues = PipelineBuilderTaskGrouping & {
  name: string;
  params: TektonParam[];
  resources: TektonResource[];
  workspaces: TektonWorkspace[];
  when?: WhenExpression[];
};

export type PipelineBuilderFormYamlValues = {
  editorType: EditorType;
  yamlData: string;
  formData: PipelineBuilderFormValues;
  taskResources: PipelineBuilderTaskResources;
};

export type PipelineBuilderFormikValues = FormikValues & PipelineBuilderFormYamlValues;

export type NameErrorStatus = { nameError: string; errorMessage: string };
export type PipelineBuilderFormikStatus = {
  submitError?: string;
  /** @see STATUS_KEY_NAME_ERROR */
  taskError?: { [path: string]: NameErrorStatus };
};

export type SelectedBuilderTask = {
  resource: TaskKind;
  taskIndex: number;
  isFinallyTask: boolean;
};

export type SelectTaskCallback = (
  task: PipelineTask,
  taskResource: TaskKind,
  isFinallyTask: boolean,
) => void;

export type UpdateOperation<D extends UpdateOperationBaseData = UpdateOperationBaseData> = {
  type: UpdateOperationType;
  data: D;
};

export type UpdateTasksCallback = (
  taskGroup: PipelineBuilderTaskGroup,
  op: UpdateOperation,
) => void;

type UpdateOperationBaseData = {};

export type UpdateOperationAddData = UpdateOperationBaseData & {
  direction: AddNodeDirection;
  relatedTask: PipelineTask;
};
export type UpdateOperationConvertToTaskData = UpdateOperationBaseData & {
  name: string;
  resource: TaskKind;
  runAfter?: string[];
};
export type UpdateOperationConvertToFinallyTaskData = {
  listTaskName: string;
};
export type UpdateOperationFixInvalidTaskListData = UpdateOperationBaseData & {
  existingName: string;
  resource: TaskKind;
  runAfter?: string[];
};
export type UpdateOperationDeleteListTaskData = UpdateOperationBaseData & {
  listTaskName: string;
};
export type UpdateOperationRemoveTaskData = UpdateOperationBaseData & {
  taskName: string;
};

export type UpdateOperationRenameTaskData = UpdateOperationBaseData & {
  preChangePipelineTask: PipelineTask;
  newName: string;
};

export type CleanupResults = {
  tasks: PipelineTask[];
  listTasks: PipelineBuilderListTask[];
  finallyTasks: PipelineTask[];
  finallyListTasks: PipelineBuilderListTask[];
};

export type UpdateOperationAction<D extends UpdateOperationBaseData> = (
  taskGrouping: PipelineBuilderTaskGrouping,
  data: D,
) => CleanupResults;

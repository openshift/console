import { FormikValues } from 'formik';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import {
  PipelineTask,
  TektonParam,
  TektonResource,
  PipelineWorkspace,
  TaskKind,
} from '../../../types';
import { PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';
import { AddNodeDirection } from '../pipeline-topology/const';
// eslint-disable-next-line import/no-cycle
import { TaskErrorType, UpdateOperationType } from './const';

export type UpdateErrors = (errors?: TaskErrorMap) => void;

export type PipelineBuilderTaskBase = { name: string; runAfter?: string[] };

export type PipelineBuilderListTask = PipelineBuilderTaskBase;

export type PipelineBuilderTaskGrouping = {
  tasks: PipelineTask[];
  listTasks: PipelineBuilderListTask[];
  finallyTasks: PipelineTask[];
  finallyListTasks: PipelineBuilderListTask[];
};

export type PipelineBuilderTaskGroup = PipelineBuilderTaskGrouping & {
  highlightedIds: string[];
};

export type PipelineBuilderFormValues = PipelineBuilderTaskGrouping & {
  name: string;
  params: TektonParam[];
  resources: TektonResource[];
  workspaces: PipelineWorkspace[];
};

export type PipelineBuilderFormYamlValues = {
  editorType: EditorType;
  yamlData: string;
  formData: PipelineBuilderFormValues;
};

export type PipelineBuilderFormikValues = FormikValues & PipelineBuilderFormYamlValues;

export type SelectedBuilderTask = {
  resource: TaskKind;
  taskIndex: number;
  isFinallyTask: boolean;
};

export type TaskErrorMap = {
  [pipelineInErrorName: string]: TaskErrorType[];
};

export type SelectTaskCallback = (
  task: PipelineVisualizationTaskItem,
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
  relatedTask: PipelineVisualizationTaskItem;
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

export type ResourceTarget = 'inputs' | 'outputs';
export type UpdateTaskResourceData = {
  resourceTarget: ResourceTarget;
  selectedPipelineResource: TektonResource;
  taskResourceName: string;
};
export type UpdateTaskWorkspaceData = {
  workspaceName: string;
  selectedWorkspace: string;
};
export type UpdateTaskParamData = {
  newValue: string;
  taskParamName: string;
};
export type UpdateOperationUpdateTaskData = UpdateOperationBaseData & {
  // Task information
  thisPipelineTask: PipelineTask;
  taskResource: TaskKind;

  // Change information
  newName?: string;
  params?: UpdateTaskParamData;
  resources?: UpdateTaskResourceData;
  workspaces?: UpdateTaskWorkspaceData;
};

export type CleanupResults = {
  tasks: PipelineTask[];
  listTasks: PipelineBuilderListTask[];
  finallyTasks: PipelineTask[];
  finallyListTasks: PipelineBuilderListTask[];
  errors?: TaskErrorMap;
};

export type UpdateOperationAction<D extends UpdateOperationBaseData> = (
  taskGrouping: PipelineBuilderTaskGrouping,
  data: D,
) => CleanupResults;

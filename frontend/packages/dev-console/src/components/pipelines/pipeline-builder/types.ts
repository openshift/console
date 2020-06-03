import { FormikValues } from 'formik';
import {
  PipelineParam,
  PipelineResource,
  PipelineResourceTask,
  PipelineTask,
} from '../../../utils/pipeline-augment';
import { PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';
import { AddNodeDirection } from '../pipeline-topology/const';
import { TaskErrorType, UpdateOperationType } from './const';

export type UpdateErrors = (errors?: TaskErrorMap) => void;

export type PipelineBuilderTaskBase = { name: string; runAfter?: string[] };

export type PipelineBuilderListTask = PipelineBuilderTaskBase;

export type PipelineBuilderTaskGrouping = {
  tasks: PipelineTask[];
  listTasks: PipelineBuilderListTask[];
};

export type PipelineBuilderTaskGroup = PipelineBuilderTaskGrouping & {
  highlightedIds: string[];
};

export type PipelineBuilderFormValues = PipelineBuilderTaskGrouping & {
  name: string;
  params: PipelineParam[];
  resources: PipelineResource[];
};

export type PipelineBuilderFormikValues = FormikValues & PipelineBuilderFormValues;

export type SelectedBuilderTask = {
  resource: PipelineResourceTask;
  taskIndex: number;
};

export type TaskErrorMap = {
  [pipelineInErrorName: string]: TaskErrorType[];
};

export type SelectTaskCallback = (
  task: PipelineVisualizationTaskItem,
  taskResource: PipelineResourceTask,
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
  resource: PipelineResourceTask;
  runAfter?: string[];
};
export type UpdateOperationFixInvalidTaskListData = UpdateOperationBaseData & {
  existingName: string;
  resource: PipelineResourceTask;
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
  selectedPipelineResource: PipelineResource;
  taskResourceName: string;
};
export type UpdateTaskParamData = {
  newValue: string;
  taskParamName: string;
};
export type UpdateOperationUpdateTaskData = UpdateOperationBaseData & {
  // Task information
  thisPipelineTask: PipelineTask;
  taskResource: PipelineResourceTask;

  // Change information
  newName?: string;
  params?: UpdateTaskParamData;
  resources?: UpdateTaskResourceData;
};

export type CleanupResults = {
  tasks: PipelineTask[];
  listTasks: PipelineBuilderListTask[];
  errors?: TaskErrorMap;
};

export type UpdateOperationAction<D extends UpdateOperationBaseData> = (
  tasks: PipelineTask[],
  listTasks: PipelineBuilderListTask[],
  data: D,
) => CleanupResults;

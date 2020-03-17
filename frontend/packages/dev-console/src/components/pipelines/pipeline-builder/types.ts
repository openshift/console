import { FormikErrors, FormikValues } from 'formik';
import {
  PipelineParam,
  PipelineResource,
  PipelineResourceTask,
  PipelineTask,
  PipelineTaskResources,
} from '../../../utils/pipeline-augment';
import { PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';
import { AddNodeDirection } from '../pipeline-topology/const';
import { UpdateOperationType } from './const';

export type ResourceTaskStatus = {
  namespacedTasks: PipelineResourceTask[] | null;
  clusterTasks: PipelineResourceTask[] | null;
  errorMsg?: string;
};

export type PipelineBuilderTaskBase = { name: string; runAfter?: string[] };

export type PipelineBuilderListTask = PipelineBuilderTaskBase;

/** Generic Builder visualization data */
export type PipelineBuilderTaskGrouping = {
  tasks: PipelineTask[];
  listTasks: PipelineBuilderListTask[];
};

/** Values derived from an existing Pipeline */
export type PipelineBuilderFormExistingPipelineValues = PipelineBuilderTaskGrouping & {
  name: string;
  params: PipelineParam[];
  resources: PipelineResource[];
};

/** Values for the Form as a state */
export type PipelineBuilderFormValues = PipelineBuilderFormExistingPipelineValues & {
  namespacedTasks: PipelineResourceTask[];
  clusterTasks: PipelineResourceTask[];
};

export type PipelineBuilderTaskGroup = PipelineBuilderTaskGrouping & {
  highlightedIds: string[];
};

export type PipelineBuilderFormikValues = FormikValues & PipelineBuilderFormValues;

export type SelectedBuilderTask = {
  resource: PipelineResourceTask;
  taskIndex: number;
};

type ErrorPipelineTask = FormikErrors<PipelineTask> & {
  // Resources can be in error in their entirety (there are no default values when tasks are created)
  resources?: string | FormikErrors<PipelineTaskResources>;
};
export type TaskErrorList = ErrorPipelineTask[];

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

export type UpdateOperationUpdateTaskData = UpdateOperationBaseData & {
  oldName: string;
  newName: string;
};

export type CleanupResults = {
  tasks: PipelineTask[];
  listTasks: PipelineBuilderListTask[];
};

export type UpdateOperationAction<D extends UpdateOperationBaseData> = (
  tasks: PipelineTask[],
  listTasks: PipelineBuilderListTask[],
  data: D,
) => CleanupResults;

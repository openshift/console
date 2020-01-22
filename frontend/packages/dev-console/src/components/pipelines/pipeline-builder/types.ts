import { FormikValues } from 'formik';
import {
  PipelineParam,
  PipelineResource,
  PipelineResourceTask,
  PipelineTask,
} from '../../../utils/pipeline-augment';
import { PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';

export type PipelineBuilderFormValues = {
  name: string;
  params: PipelineParam[];
  resources: PipelineResource[];
  tasks: PipelineTask[];
};

export type PipelineBuilderFormikValues = FormikValues & PipelineBuilderFormValues;

export type SelectedBuilderTask = {
  resource: PipelineResourceTask;
  taskIndex: number;
};

export type TaskErrorMapData = {
  inputResourceCount: number;
  outputResourceCount: number;
  paramsMissingDefaults: boolean;
  message: string;
};
export type TaskErrorMap = {
  [pipelineInErrorName: string]: TaskErrorMapData;
};

export type SetTaskErrorCallback = (
  pipelineInErrorName: string,
  inputResourceCount: number,
  outputResourceCount: number,
  paramsMissingDefaults: boolean,
) => void;

export type SelectTaskCallback = (
  task: PipelineVisualizationTaskItem,
  taskResource: PipelineResourceTask,
) => void;
export type UpdateTaskCallback = (updatedTaskList: PipelineTask[]) => void;

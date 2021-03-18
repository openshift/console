// eslint-disable-next-line import/no-cycle
import { PipelineBuilderFormValues } from './types';

export const TASK_INCOMPLETE_ERROR_MESSAGE = 'Incomplete Task';

export enum UpdateOperationType {
  ADD_LIST_TASK,
  ADD_FINALLY_LIST_TASK,
  CONVERT_LIST_TO_TASK,
  CONVERT_LIST_TO_FINALLY_TASK,
  UPDATE_TASK,
  REMOVE_TASK,
  DELETE_LIST_TASK,
  FIX_INVALID_LIST_TASK,
}

export enum TaskErrorType {
  MISSING_REQUIRED_PARAMS = 'missingParams',
  MISSING_NAME = 'nameMissing',
  MISSING_RESOURCES = 'missingResources',
  MISSING_WORKSPACES = 'missingWorkspaces',
}

export const TASK_ERROR_STRINGS = {
  [TaskErrorType.MISSING_RESOURCES]: 'Missing Resources',
  [TaskErrorType.MISSING_REQUIRED_PARAMS]: 'Missing Parameters',
  [TaskErrorType.MISSING_NAME]: 'Task Name is Required',
  [TaskErrorType.MISSING_WORKSPACES]: 'Missing Workspaces',
};

export const nodeTaskErrors = [
  TaskErrorType.MISSING_REQUIRED_PARAMS,
  TaskErrorType.MISSING_RESOURCES,
  TaskErrorType.MISSING_WORKSPACES,
];

export const initialPipelineFormData: PipelineBuilderFormValues = {
  name: 'new-pipeline',
  params: [],
  resources: [],
  workspaces: [],
  tasks: [],
  listTasks: [],
  finallyTasks: [],
  finallyListTasks: [],
};

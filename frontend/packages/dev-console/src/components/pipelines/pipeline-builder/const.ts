export const TASK_INCOMPLETE_ERROR_MESSAGE = 'Incomplete Task';

export enum UpdateOperationType {
  ADD_LIST_TASK,
  CONVERT_LIST_TO_TASK,
  UPDATE_TASK,
  REMOVE_TASK,
  DELETE_LIST_TASK,
  FIX_INVALID_LIST_TASK,
}

export enum TaskErrorType {
  MISSING_REQUIRED_PARAMS = 'missingParams',
  MISSING_NAME = 'nameMissing',
  MISSING_RESOURCES = 'missingResources',
}

export const TASK_ERROR_STRINGS = {
  [TaskErrorType.MISSING_RESOURCES]: 'Missing Resources',
  [TaskErrorType.MISSING_REQUIRED_PARAMS]: 'Missing Parameters',
  [TaskErrorType.MISSING_NAME]: 'Task Name is Required',
};

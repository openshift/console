import i18n from 'i18next';
// eslint-disable-next-line import/no-cycle
import { PipelineBuilderFormValues } from './types';

export enum UpdateOperationType {
  ADD_LIST_TASK,
  ADD_FINALLY_LIST_TASK,
  CONVERT_LIST_TO_TASK,
  CONVERT_LIST_TO_FINALLY_TASK,
  RENAME_TASK,
  REMOVE_TASK,
  DELETE_LIST_TASK,
  FIX_INVALID_LIST_TASK,
}

export enum TaskErrorType {
  MISSING_REQUIRED_PARAMS = 'missingParams',
  MISSING_RESOURCES = 'missingResources',
  MISSING_WORKSPACES = 'missingWorkspaces',
  MISSING_REQUIRED_WHEN_EXPRESSIONS = 'missingWhenExpressions',
}

export const TASK_FIELD_ERROR_TYPE_MAPPING: { [key in TaskErrorType]: string[] } = {
  [TaskErrorType.MISSING_REQUIRED_PARAMS]: ['params'],
  [TaskErrorType.MISSING_RESOURCES]: ['resources'],
  [TaskErrorType.MISSING_WORKSPACES]: ['workspaces'],
  [TaskErrorType.MISSING_REQUIRED_WHEN_EXPRESSIONS]: ['when'],
};

export const TASK_ERROR_STRINGS: { [key in TaskErrorType]: string } = {
  [TaskErrorType.MISSING_REQUIRED_PARAMS]: i18n.t('pipelines-plugin~Missing Parameters'),
  [TaskErrorType.MISSING_RESOURCES]: i18n.t('pipelines-plugin~Missing Resources'),
  [TaskErrorType.MISSING_WORKSPACES]: i18n.t('pipelines-plugin~Missing Workspaces'),
  [TaskErrorType.MISSING_REQUIRED_WHEN_EXPRESSIONS]: i18n.t(
    'pipelines-plugin~Invalid When Expressions',
  ),
};

export enum WhenExpressionOperatorType {
  in = 'in',
  notin = 'notin',
}

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

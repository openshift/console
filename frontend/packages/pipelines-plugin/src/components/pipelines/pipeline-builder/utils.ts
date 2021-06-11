import * as _ from 'lodash';
import { apiVersionForModel, referenceForModel } from '@console/internal/module/k8s';
import { getRandomChars } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { PipelineModel, TaskModel } from '../../../models';
import {
  Pipeline,
  PipelineParam,
  PipelineResourceTask,
  PipelineTask,
} from '../../../utils/pipeline-augment';
import { removeEmptyDefaultFromPipelineParams } from '../detail-page-tabs/utils';
import { getTaskParameters } from '../resource-utils';
import { TASK_ERROR_STRINGS, TaskErrorType } from './const';
import { PipelineBuilderFormValues, PipelineBuilderFormYamlValues, TaskErrorMap } from './types';

export const getErrorMessage = (errorTypes: TaskErrorType[], errorMap: TaskErrorMap) => (
  taskName: string,
): string => {
  if (!taskName) {
    return TASK_ERROR_STRINGS[TaskErrorType.MISSING_NAME];
  }

  const errorList: TaskErrorType[] | undefined = errorMap?.[taskName];
  if (!errorList) return null;

  const hasRequestedError = errorList.filter((error) => errorTypes.includes(error));
  return hasRequestedError.length > 0 ? TASK_ERROR_STRINGS[hasRequestedError[0]] : null;
};

export const taskParamIsRequired = (param: PipelineParam): boolean => {
  return !('default' in param);
};

export const safeName = (reservedNames: string[], desiredName: string): string => {
  if (reservedNames.includes(desiredName)) {
    const newName = `${desiredName}-${getRandomChars(3)}`;
    if (reservedNames.includes(newName)) {
      return safeName(reservedNames, desiredName);
    }
    return newName;
  }
  return desiredName;
};

export const convertResourceToTask = (
  usedNames: string[],
  resource: PipelineResourceTask,
  runAfter?: string[],
): PipelineTask => {
  const kind = resource.kind ?? TaskModel.kind;
  return {
    name: safeName(usedNames, resource.metadata.name),
    runAfter,
    taskRef: {
      kind,
      name: resource.metadata.name,
    },
    params: getTaskParameters(resource).map((param) => ({
      name: param.name,
      value: param.default,
    })),
  };
};

export const getPipelineURL = (namespace: string) => {
  return `/k8s/ns/${namespace}/${referenceForModel(PipelineModel)}`;
};

const removeListRunAfters = (task: PipelineTask, listIds: string[]): PipelineTask => {
  if (task?.runAfter && listIds.length > 0) {
    // Trim out any runAfters pointing at list nodes
    const runAfter = (task.runAfter || []).filter(
      (runAfterName) => !listIds.includes(runAfterName),
    );

    return {
      ...task,
      runAfter,
    };
  }

  return task;
};

const removeEmptyDefaultParams = (task: PipelineTask): PipelineTask => {
  if (task.params?.length > 0) {
    // Since we can submit, this param has a default; check for empty values and remove
    return {
      ...task,
      params: task.params.filter((param) => !!param.value),
    };
  }

  return task;
};

export const convertBuilderFormToPipeline = (
  formValues: PipelineBuilderFormValues,
  namespace: string,
  existingPipeline?: Pipeline,
): Pipeline => {
  const { name, resources, params, tasks, listTasks, ...unhandledSpec } = formValues;
  const listIds = listTasks.map((listTask) => listTask.name);

  return {
    ...existingPipeline,
    apiVersion: apiVersionForModel(PipelineModel),
    kind: PipelineModel.kind,
    metadata: {
      ...existingPipeline?.metadata,
      name,
      namespace,
    },
    spec: {
      ...existingPipeline?.spec,
      ...unhandledSpec,
      params: removeEmptyDefaultFromPipelineParams(params),
      resources,
      tasks: tasks.map((task) => removeEmptyDefaultParams(removeListRunAfters(task, listIds))),
    },
  };
};

export const convertPipelineToBuilderForm = (pipeline: Pipeline): PipelineBuilderFormYamlValues => {
  if (!pipeline) return null;

  const {
    metadata: { name },
    spec: { params = [], resources = [], tasks = [] },
  } = pipeline;

  return {
    editorType: EditorType.Form,
    yamlData: '',
    formData: {
      name,
      params,
      resources,
      tasks,
      listTasks: [],
    },
  };
};

export const hasEmptyString = (arr: string[]) => _.find(arr, _.isEmpty) === '';

export const isFieldValid = (value: string | string[], dirty: boolean, emptyIsInvalid: boolean) =>
  dirty && emptyIsInvalid ? (_.isArray(value) ? !hasEmptyString(value) : !_.isEmpty(value)) : true;

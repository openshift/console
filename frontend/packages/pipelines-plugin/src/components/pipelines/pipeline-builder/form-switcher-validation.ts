import * as _ from 'lodash';
import { ValidationError } from 'yup';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { PipelineKind } from '../../../types';
import { initialPipelineFormData } from './const';
import { pipelineBuilderYAMLSchema } from './switch-to-form-validation-utils';
import { PipelineBuilderFormValues, PipelineBuilderTaskBase } from './types';
import { convertBuilderFormToPipeline } from './utils';
import { runAfterMatches } from './validation-utils';

export const getFormData = (
  formData: PipelineBuilderFormValues,
  yamlPipeline: PipelineKind,
): PipelineBuilderFormValues => {
  const { listTasks, finallyListTasks } = formData;
  const sanitizedListTasks: PipelineBuilderTaskBase[] = listTasks.map((listTask) => {
    const { name, runAfter: listRunAfter } = listTask;
    return {
      ...listTask,
      runAfter: listRunAfter
        ? listRunAfter.filter((r) => runAfterMatches(formData, [r], name))
        : [],
    };
  });
  const { finally: finallyTasks, ...specProps } = yamlPipeline.spec;
  const pipelineSpecProperties = _.omit(specProps, ['listTasks', 'finallyListTasks']);
  return {
    ...pipelineSpecProperties, // support & keep unknown values as well as whatever they may have changed that we use
    name: yamlPipeline.metadata?.name,
    finallyTasks,
    listTasks: sanitizedListTasks,
    finallyListTasks,
  } as PipelineBuilderFormValues;
};

export const validateFormData = (
  newFormData: PipelineBuilderFormValues,
  yamlPipeline: PipelineKind,
) =>
  pipelineBuilderYAMLSchema(newFormData).validate(yamlPipeline, {
    abortEarly: false,
    strict: true,
  });

export const safeOmit = (object: PipelineKind, path: string): PipelineKind => {
  // Check if it's a `path.to.array[#]`
  const match = path.match(/(.*)\[(\d+)\]$/);
  if (match) {
    const [, pathToArray, index] = match;
    if (pathToArray && index) {
      return _.update(object, pathToArray, (array) => {
        array.splice(index, 1);
        return array;
      });
    }
  }
  return _.omit(object, path);
};

export const getValidatedFormAndYaml = (
  formData: PipelineBuilderFormValues,
  error: ValidationError,
  yamlPipeline: PipelineKind,
): [PipelineBuilderFormValues, PipelineKind] => {
  const paths: string[] = error?.inner?.map((err) => err.path).filter((path) => !!path) || [];
  const validatedYamlData: PipelineKind = paths.reduce((acc, currPath) => {
    const pathComponents = currPath.split('.');
    const lastPathItem: string = pathComponents[pathComponents.length - 1];
    switch (lastPathItem) {
      case 'name': {
        const namePath = pathComponents.slice(0, pathComponents.length - 1).join('.');
        return safeOmit(acc, namePath);
      }
      default:
        return safeOmit(acc, currPath);
    }
  }, yamlPipeline);
  const validatedFormData: PipelineBuilderFormValues = getFormData(formData, validatedYamlData);
  return [validatedFormData, validatedYamlData];
};

const MAX_ERROR_FIXING_PATHS = 1;
export const handleSanitizeToFormError = async (
  formData: PipelineBuilderFormValues,
  error: ValidationError,
  yamlPipeline: PipelineKind,
  counter = 0,
): Promise<PipelineBuilderFormValues> => {
  if (counter > MAX_ERROR_FIXING_PATHS) {
    // Still invalid and we have reached our cap of retries, return nothing as we don't have a valid object
    return undefined;
  }

  const [validatedFormData, validatedYamlData] = getValidatedFormAndYaml(
    formData,
    error,
    yamlPipeline,
  );

  let errObj;
  try {
    await validateFormData(validatedFormData, validatedYamlData);
    errObj = undefined;
  } catch (err) {
    errObj = err;
  }

  if (!errObj) {
    return _.merge({}, initialPipelineFormData, validatedFormData);
  }

  return handleSanitizeToFormError(
    validatedFormData,
    errObj,
    validatedYamlData,
    errObj ? counter + 1 : counter,
  );
};

export const sanitizeToForm = async (
  formData: PipelineBuilderFormValues,
  yamlPipeline: PipelineKind,
): Promise<PipelineBuilderFormValues | (() => PipelineBuilderFormValues)> => {
  const newFormData: PipelineBuilderFormValues = getFormData(formData, yamlPipeline);
  try {
    await validateFormData(newFormData, yamlPipeline);
  } catch (error) {
    const safeReturn =
      (await handleSanitizeToFormError(newFormData, error, yamlPipeline)) || formData;
    return () => safeReturn;
  }
  return _.merge({}, initialPipelineFormData, newFormData);
};

export const sanitizeToYaml = (
  formData: PipelineBuilderFormValues,
  namespace: string,
  existingPipeline?: PipelineKind,
) =>
  safeJSToYAML(convertBuilderFormToPipeline(formData, namespace, existingPipeline), 'yamlData', {
    skipInvalid: true,
  });

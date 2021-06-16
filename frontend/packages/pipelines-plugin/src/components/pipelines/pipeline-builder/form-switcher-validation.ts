import * as _ from 'lodash';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { PipelineKind } from '../../../types';
import { initialPipelineFormData } from './const';
import { pipelineBuilderYAMLSchema } from './switch-to-form-validation-utils';
import { PipelineBuilderFormValues } from './types';
import { convertBuilderFormToPipeline } from './utils';

export const getFormData = (
  formData: PipelineBuilderFormValues,
  yamlPipeline: PipelineKind,
): PipelineBuilderFormValues => {
  const { finally: finallyTasks, ...specProps } = yamlPipeline.spec;
  const pipelineSpecProperties = _.omit(specProps, ['listTasks', 'finallyListTasks']);
  return {
    ...formData,
    ...pipelineSpecProperties, // support & keep unknown values as well as whatever they may have changed that we use
    name: yamlPipeline.metadata?.name,
    finallyTasks,
  };
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

export const handleSanitizeToFormError = async (
  formData: PipelineBuilderFormValues,
  error: any,
  yamlPipeline: PipelineKind,
): Promise<PipelineBuilderFormValues> => {
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
  const validatedFormData = getFormData(formData, validatedYamlData);
  try {
    await validateFormData(validatedFormData, validatedYamlData);
  } catch (err) {
    return undefined;
  }
  return _.merge({}, initialPipelineFormData, validatedFormData);
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

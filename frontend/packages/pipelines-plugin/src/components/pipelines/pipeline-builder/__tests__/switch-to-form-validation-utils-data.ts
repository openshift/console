import * as _ from 'lodash';
import { apiVersionForModel } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../../models';
import { PipelineKind } from '../../../../types/pipeline';
import { pipelineBuilderYAMLSchema } from '../switch-to-form-validation-utils';
import { PipelineBuilderFormValues } from '../types';
import { hasError } from './validation-utils-data';

export const yamlDataBasicPassState: PipelineKind = {
  apiVersion: apiVersionForModel(PipelineModel),
  kind: PipelineModel.kind,
  metadata: {
    name: 'initial-pipeline',
    namespace: 'ns',
  },
  spec: {
    params: [],
    resources: [],
    workspaces: [],
    tasks: [],
    finally: [],
  },
};

export const updateYAML = (path, data) =>
  path ? _.set(_.cloneDeep(yamlDataBasicPassState), path, data) : yamlDataBasicPassState;

export const withFormData = (formData: PipelineBuilderFormValues, path, data) =>
  pipelineBuilderYAMLSchema(formData).validate(updateYAML(path, data), {
    abortEarly: false,
    strict: true,
  });

export const hasMultipleErrors = (expectedErrors: { yupPath: string; errorMessage: string }[]) => (
  error,
) => {
  expectedErrors.forEach((errorObj) => hasError(errorObj.yupPath, errorObj.errorMessage)(error));
};

import * as _ from 'lodash';
import { apiVersionForModel } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../../models';
import { PipelineKind } from '../../../../types/pipeline';
import { pipelineBuilderYAMLSchema } from '../switch-to-form-validation-utils';
import { PipelineBuilderFormValues } from '../types';

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

export const hasError = (yupPath: string, errorMessage: string) => (error) => {
  if (!Array.isArray(error?.inner)) {
    // Not a yup validation object, do a bad comparison so the test echos it
    expect(error).toBe('Not a Yup Error, see following error message for the actual error.');
    return;
  }

  const errors: { path: string; message: string }[] = error.inner.map((err) => ({
    path: err.path,
    message: err.message,
  }));
  const expectedError = { path: yupPath, message: expect.stringContaining(errorMessage) };
  expect(errors).toEqual(expect.arrayContaining([expect.objectContaining(expectedError)]));
};

import * as _ from 'lodash';
import { initialPipelineFormData } from '../const';
import {
  getFormData,
  handleSanitizeToFormError,
  safeOmit,
  sanitizeToForm,
} from '../form-switcher-validation';
import { updateYAML, yamlDataBasicPassState } from './switch-to-form-validation-utils-data';
import { formDataBasicPassState } from './validation-utils-data';

describe('sanitizeToForm', () => {
  it('should return with formdata if the yamlPipeline provided is valid', async () => {
    const finalFormData = _.merge(
      {},
      initialPipelineFormData,
      getFormData(formDataBasicPassState, yamlDataBasicPassState),
    );
    const sanitizedFormData = await sanitizeToForm(formDataBasicPassState, yamlDataBasicPassState);
    expect(sanitizedFormData).toMatchObject(finalFormData);
  });

  it('should return a function returning sanitized formData if the yamlPipeline provided is invalid', async () => {
    const invalidYaml = updateYAML('spec.tasks', [
      { notName: 'test', taskRef: { name: 'external-task' } },
    ]);
    const sanitizedFormData = await sanitizeToForm(formDataBasicPassState, invalidYaml);
    const resultFromCallback = typeof sanitizedFormData === 'function' && sanitizedFormData();
    const expectedResultFromCallback = getFormData(formDataBasicPassState, yamlDataBasicPassState);
    expect(typeof sanitizedFormData).toEqual('function');
    expect(resultFromCallback).toMatchObject(expectedResultFromCallback);
  });
});

describe('handleSanitizeToFormError', () => {
  it('should remove the entire item, if the path has name at the end', async () => {
    const invalidYaml = updateYAML('spec.tasks', [
      { notName: 'test', taskRef: { name: 'external-task' } },
    ]);
    const error = { inner: [{ path: 'spec.tasks[0].name' }] };
    const finalFormData = getFormData(formDataBasicPassState, updateYAML('spec.tasks', []));
    const sanitizedFormData = await handleSanitizeToFormError(
      formDataBasicPassState,
      error,
      invalidYaml,
    );
    expect(sanitizedFormData).toMatchObject(finalFormData);
  });

  it('should remove the specific value on the path, if the path does not end with name', async () => {
    const tasks = [
      { name: 'task1', taskRef: { name: 'external-task1' } },
      { name: 'task2', taskRef: { name: 'external-task2' }, runAfter: ['task2'] },
    ];
    const invalidYaml = updateYAML('spec.tasks', tasks);
    const error = { inner: [{ path: 'spec.tasks[1].runAfter[0]' }] };
    const finalFormData = getFormData(formDataBasicPassState, updateYAML('spec.tasks', tasks));
    const sanitizedFormData = await handleSanitizeToFormError(
      formDataBasicPassState,
      error,
      invalidYaml,
    );
    expect(sanitizedFormData).toMatchObject(finalFormData);
  });

  it('should return undefined if the trimmed yaml fails validation', async () => {
    const tasks = [
      { name: 'task1', taskRef: { name: 'external-task1' } },
      { name: '2task', taskRef: { name: 'external-task2' }, runAfter: ['task1'] },
      { name: 'task3', taskRef: { name: 'external-task3' }, runAfter: ['2task'] },
    ];
    const invalidYaml = updateYAML('spec.tasks', tasks);
    const error = { inner: [{ path: 'spec.tasks[1].name' }] };
    const sanitizedFormData = await handleSanitizeToFormError(
      formDataBasicPassState,
      error,
      invalidYaml,
    );
    expect(sanitizedFormData).toBeUndefined();
  });
});

describe('safeOmit', () => {
  it('should omit the item and return a valid array if the path points to an array item', () => {
    const tasks = [
      { name: 'task1', taskRef: { name: 'external-task1' } },
      { name: 'task2', taskRef: { name: 'external-task2' }, runAfter: ['task1'] },
      { name: 'task3', taskRef: { name: 'external-task3' }, runAfter: ['task2'] },
    ];
    const object = updateYAML('spec.tasks', [...tasks]);
    const path = 'spec.tasks[1]';
    const trimmedObject = safeOmit(object, path);
    const expectedResult = updateYAML(
      'spec.tasks',
      tasks.filter((task) => task.name !== 'task2'),
    );
    expect(trimmedObject).toMatchObject(expectedResult);
  });

  it('should omit the item if the path points to an object property', () => {
    const object = updateYAML('metadata.name', 'new-pipeline');
    const path = 'metadata.name';
    const trimmedObject = safeOmit(object, path);
    const expectedResult = _.omit(object, 'metadata.name');
    expect(trimmedObject).toMatchObject(expectedResult);
  });
});

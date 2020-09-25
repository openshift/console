import { PipelineTask } from '../../../../utils/pipeline-augment';
import { applyParamsUpdate } from '../update-utils';
import { UpdateTaskParamData } from '../types';

describe('applyParamsUpdate', () => {
  it('change an existing task param', () => {
    const inputTask: PipelineTask = {
      name: 'pipeline-task',
      taskRef: {
        name: 'task',
      },
      params: [
        { name: 'EXISTING_TASK_PARAM', value: 'old value' },
        { name: 'ANOTHER_EXISTING_TASK_PARAM', value: 'ignored value' },
      ],
    };
    const params: UpdateTaskParamData = {
      newValue: 'new value',
      taskParamName: 'EXISTING_TASK_PARAM',
    };
    const updatedTask = applyParamsUpdate(inputTask, params);
    expect(updatedTask).not.toBe(inputTask);
    expect(updatedTask.params).not.toBe(inputTask.params);
    expect(updatedTask).toEqual({
      name: 'pipeline-task',
      taskRef: {
        name: 'task',
      },
      params: [
        { name: 'EXISTING_TASK_PARAM', value: 'new value' },
        { name: 'ANOTHER_EXISTING_TASK_PARAM', value: 'ignored value' },
      ],
    });
  });

  it('change a non-existing task param', () => {
    const inputTask: PipelineTask = {
      name: 'pipeline-task',
      taskRef: {
        name: 'task',
      },
      params: [{ name: 'ANOTHER_EXISTING_TASK_PARAM', value: 'ignored value' }],
    };
    const params: UpdateTaskParamData = {
      newValue: 'new value',
      taskParamName: 'NEW_TASK_PARAM',
    };
    const updatedTask = applyParamsUpdate(inputTask, params);
    expect(updatedTask).not.toBe(inputTask);
    expect(updatedTask.params).not.toBe(inputTask.params);
    expect(updatedTask).toEqual({
      name: 'pipeline-task',
      taskRef: {
        name: 'task',
      },
      params: [
        { name: 'ANOTHER_EXISTING_TASK_PARAM', value: 'ignored value' },
        { name: 'NEW_TASK_PARAM', value: 'new value' },
      ],
    });
  });

  it('change a non-existing task param in a task without any param', () => {
    const inputTask: PipelineTask = {
      name: 'pipeline-task',
      taskRef: {
        name: 'task',
      },
    };
    const params: UpdateTaskParamData = {
      newValue: 'new value',
      taskParamName: 'NEW_TASK_PARAM',
    };
    const updatedTask = applyParamsUpdate(inputTask, params);
    expect(updatedTask).not.toBe(inputTask);
    expect(updatedTask).toEqual({
      name: 'pipeline-task',
      taskRef: {
        name: 'task',
      },
      params: [{ name: 'NEW_TASK_PARAM', value: 'new value' }],
    });
  });
});

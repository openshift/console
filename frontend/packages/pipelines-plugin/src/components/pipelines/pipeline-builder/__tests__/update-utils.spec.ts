import { PipelineTask } from '../../../../types';
import { applyParamsUpdate, applyWorkspaceUpdate } from '../update-utils';
import { UpdateTaskParamData, UpdateTaskWorkspaceData } from '../types';

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

describe('applyWorkspaceUpdate', () => {
  it('changes an existing task workspace', () => {
    const inputTask: PipelineTask = {
      name: 'pipeline-task',
      taskRef: {
        name: 'task',
      },
      workspaces: [
        { name: 'EXISTING_TASK_WORKSPACE', workspace: 'workspace-01' },
        { name: 'ANOTHER_EXISTING_TASK_WORKSPACE', workspace: 'workspace-02' },
      ],
    };
    const workspaceData: UpdateTaskWorkspaceData = {
      workspaceName: 'ANOTHER_EXISTING_TASK_WORKSPACE',
      selectedWorkspace: 'workspace-03',
    };
    const updatedTask = applyWorkspaceUpdate(inputTask, workspaceData);
    expect(updatedTask).not.toBe(inputTask);
    expect(updatedTask).toEqual({
      name: 'pipeline-task',
      taskRef: {
        name: 'task',
      },
      workspaces: [
        { name: 'EXISTING_TASK_WORKSPACE', workspace: 'workspace-01' },
        { name: 'ANOTHER_EXISTING_TASK_WORKSPACE', workspace: 'workspace-03' },
      ],
    });
  });

  it('adds a new task workspace', () => {
    const inputTask: PipelineTask = {
      name: 'pipeline-task',
      taskRef: {
        name: 'task',
      },
      workspaces: [{ name: 'EXISTING_TASK_WORKSPACE', workspace: 'workspace-01' }],
    };
    const workspaceData: UpdateTaskWorkspaceData = {
      workspaceName: 'ANOTHER_EXISTING_TASK_WORKSPACE',
      selectedWorkspace: 'workspace-02',
    };
    const updatedTask = applyWorkspaceUpdate(inputTask, workspaceData);
    expect(updatedTask).not.toBe(inputTask);
    expect(updatedTask).toEqual({
      name: 'pipeline-task',
      taskRef: {
        name: 'task',
      },
      workspaces: [
        { name: 'EXISTING_TASK_WORKSPACE', workspace: 'workspace-01' },
        { name: 'ANOTHER_EXISTING_TASK_WORKSPACE', workspace: 'workspace-02' },
      ],
    });
  });
});

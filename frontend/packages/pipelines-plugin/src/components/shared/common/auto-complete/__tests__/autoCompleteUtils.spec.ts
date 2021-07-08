import { PipelineExampleNames, pipelineTestData } from '../../../../../test-data/pipeline-data';
import { resultTask } from '../../../../../test-data/task-data';
import { PipelineTask } from '../../../../../types';
import { PipelineBuilderTaskResources } from '../../../../pipelines/pipeline-builder/types';
import {
  paramToAutoComplete,
  taskToResult,
  taskToStatus,
  workspaceToAutoComplete,
} from '../autoCompleteUtils';

describe('autoCompleteUtils', () => {
  describe('paramToAutoComplete', () => {
    it('should return a valid param variable reference path', () => {
      expect(paramToAutoComplete({ name: 'test' })).toBe('params.test');
    });

    it('should not be impacted by other properties in the Param', () => {
      expect(paramToAutoComplete({ name: 'test', type: 'string' })).toBe('params.test');
      expect(paramToAutoComplete({ name: 'test', type: 'string', default: '' })).toBe(
        'params.test',
      );
      expect(paramToAutoComplete({ name: 'test', type: 'string', default: 'valid default' })).toBe(
        'params.test',
      );
      expect(paramToAutoComplete({ name: 'test', type: 'array', default: [''] })).toBe(
        'params.test',
      );
      expect(paramToAutoComplete({ name: 'test', type: 'array', default: ['one', 'two'] })).toBe(
        'params.test',
      );
    });
  });

  describe('workspaceToAutoComplete', () => {
    it('should return a valid workspace variable reference path', () => {
      expect(workspaceToAutoComplete({ name: 'workspace' })).toBe('workspaces.workspace.bound');
    });

    it('should not be impacted by other properties in the Workspace', () => {
      expect(workspaceToAutoComplete({ name: 'workspace', optional: false })).toBe(
        'workspaces.workspace.bound',
      );
      expect(workspaceToAutoComplete({ name: 'workspace', optional: true })).toBe(
        'workspaces.workspace.bound',
      );
    });
  });

  describe('taskToStatus', () => {
    it('should return a valid task status variable reference path', () => {
      const pipelineTask: PipelineTask =
        pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE].pipeline.spec.tasks[0];

      expect(taskToStatus(pipelineTask)).toBe('tasks.fetch-the-recipe.status');
    });

    it("should return a valid task status variable even if it's a taskSpec task", () => {
      const pipelineTask: PipelineTask =
        pipelineTestData[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].pipeline.spec.tasks[0];

      expect(taskToStatus(pipelineTask)).toBe('tasks.install-deps.status');
    });
  });

  describe('taskToResult', () => {
    const resources: PipelineBuilderTaskResources = {
      clusterTasks: [],
      namespacedTasks: [resultTask],
      tasksLoaded: true,
    };

    it('should handle nulls', () => {
      expect(taskToResult(null)(null)).toBe(null);
      expect(taskToResult(undefined)(undefined)).toBe(null);
      expect(taskToResult(resources)(null)).toBe(null);
    });

    it('should return null if the task is found but does not have results', () => {
      const task: PipelineTask =
        pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE].pipeline.spec.tasks[0];
      expect(taskToResult(resources)(task)).toBe(null);
    });

    it('should return null if the taskSpec is found but does not have results', () => {
      const task: PipelineTask =
        pipelineTestData[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].pipeline.spec.tasks[0];
      expect(taskToResult(resources)(task)).toBe(null);
    });

    it('should return an array of match results', () => {
      const task: PipelineTask =
        pipelineTestData[PipelineExampleNames.RESULTS].pipeline.spec.tasks[0];
      expect(taskToResult(resources)(task)).toEqual(['tasks.first-add.results.sum']);
    });
  });
});

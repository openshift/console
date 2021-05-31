import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { PipelineTask, TaskKind } from '../../../../types';
import { initialPipelineFormData } from '../const';
import { PipelineBuilderFormikValues, PipelineBuilderTaskBase } from '../types';
import {
  convertResourceToTask,
  findTask,
  findTaskFromFormikData,
  mapAddRelatedToOthers,
  mapBeRelated,
  mapRemoveRelatedInOthers,
  mapReplaceRelatedInOthers,
  mapStitchReplaceInOthers,
  safeName,
  removeEmptyFormFields,
} from '../utils';
import { externalTask, externalTaskWithVarietyParams } from './validation-utils-data';

describe('findTaskFromFormikData / findTask', () => {
  const createFormValues = (
    clusterTasks = [],
    namespacedTasks = [],
  ): PipelineBuilderFormikValues => {
    return {
      editorType: EditorType.Form,
      yamlData: '',
      formData: initialPipelineFormData,
      taskResources: {
        clusterTasks,
        namespacedTasks,
        tasksLoaded: clusterTasks.length > 0 || namespacedTasks.length > 0,
      },
    };
  };

  it('should decompose formik state & handle nulls', () => {
    const formValues = createFormValues();
    expect(findTaskFromFormikData(formValues, null)).toBe(null);
    expect(findTaskFromFormikData(formValues, { name: 'test' })).toBe(null);
    expect(findTaskFromFormikData(formValues, { name: 'test', taskRef: { name: 'test' } })).toBe(
      null,
    );
  });

  it('should handle fail states', () => {
    expect(findTask(null, null)).toBe(null);
    expect(
      findTask({ tasksLoaded: true, clusterTasks: [externalTask], namespacedTasks: [] }, null),
    ).toBe(null);
    expect(
      findTask(
        { tasksLoaded: true, clusterTasks: [externalTask], namespacedTasks: [] },
        { name: 'test', taskRef: { name: 'unavailable-task' } },
      ),
    ).toBe(undefined);
  });

  it('should be able to find a clusterTask', () => {
    const formValues = createFormValues([externalTask]);
    expect(
      findTask(formValues.taskResources, {
        name: 'test',
        taskRef: {
          name: externalTask.metadata.name,
          kind: externalTask.kind,
        },
      }),
    ).toBe(externalTask);
  });

  it('should be able to find a namespacedTask', () => {
    const namespacedTask = { ...externalTask, kind: 'Task' };
    const formValues = createFormValues([], [namespacedTask]);
    expect(
      findTask(formValues.taskResources, {
        name: 'test',
        taskRef: {
          name: namespacedTask.metadata.name,
          kind: namespacedTask.kind,
        },
      }),
    ).toBe(namespacedTask);
  });
});

describe('safeName', () => {
  it('should straight return with no reserved names', () => {
    expect(safeName([], 'test')).toBe('test');
    expect(safeName([], '')).toBe('');
  });

  it('should return when no reserved names match', () => {
    expect(safeName(['first'], 'unique')).toBe('unique');
    expect(safeName(['first', 'second'], 'unique')).toBe('unique');
  });

  it('should return a random 3 digit suffix if already in use', () => {
    expect(safeName(['in-use'], 'in-use')).toMatch(new RegExp('^in-use-[a-z0-9]{3}$'));
  });
});

describe('convertResourceToTask', () => {
  describe('task with param variety', () => {
    const result = convertResourceToTask([], externalTaskWithVarietyParams);

    it('should find the same amount of params that was given', () => {
      expect(result.params).toHaveLength(externalTaskWithVarietyParams.spec.params.length);
    });

    it('should not have a runAfter since it was not provided', () => {
      expect(result.runAfter).toBeUndefined();
    });

    it('should refer to the proper taskRef', () => {
      expect(result.taskRef).toEqual({
        name: externalTaskWithVarietyParams.metadata.name,
        kind: 'ClusterTask',
      });
    });

    result.params.forEach((param, idx) => {
      const source = externalTaskWithVarietyParams.spec.params[idx];

      describe(`Param "${source.name}"`, () => {
        it(`should have a typeof value equal to the same typeof default`, () => {
          expect(typeof param.value).toBe(typeof source.default);
        });

        if (source.default) {
          it(`should have a value for a default param`, () => {
            expect(param.value).toBe(source.default);
          });
        } else {
          it(`should have not have a value (required param) if it lacks a default`, () => {
            expect(param.value).toBeUndefined();
          });
        }
      });
    });
  });

  describe('namespacedTask with runAfter', () => {
    const resource: TaskKind = {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'Task',
      metadata: {
        name: 'example-task',
      },
      spec: {
        params: [],
        steps: [],
      },
    };
    const runAfter = ['first', 'second'];
    const result = convertResourceToTask([], resource, runAfter);

    it('should have a taskRef of a task', () => {
      expect(result.taskRef).toEqual({ name: 'example-task', kind: 'Task' });
    });

    it('should consist of the explicit runAfter that was given', () => {
      expect(result.runAfter).toBe(runAfter);
    });

    it('should match the params that was given', () => {
      expect(result.params).toHaveLength(resource.spec.params.length);
    });
  });
});

describe('runAfter Manipulation Utils', () => {
  describe('mapReplaceRelatedInOthers', () => {
    it('should handle nulls', () => {
      expect(mapReplaceRelatedInOthers(null, null, null)).toBe(null);
      const task1: PipelineBuilderTaskBase = { name: 'example-task' };
      expect(mapReplaceRelatedInOthers<PipelineBuilderTaskBase>(null, null, task1)).toBe(task1);
      const task2: PipelineBuilderTaskBase = { name: 'example-task', runAfter: [] };
      expect(mapReplaceRelatedInOthers<PipelineBuilderTaskBase>(null, null, task2)).toBe(task2);
      const task3: PipelineBuilderTaskBase = { name: 'example-task', runAfter: ['first'] };
      expect(mapReplaceRelatedInOthers<PipelineBuilderTaskBase>(null, null, task3)).toBe(task3);
    });

    it('should do nothing if there are no runAfters', () => {
      const task: PipelineBuilderTaskBase = { name: 'example-task' };
      expect(mapReplaceRelatedInOthers<PipelineBuilderTaskBase>('test', 'related-name', task)).toBe(
        task,
      );
    });

    it('should do nothing if the runAfters do not include the target', () => {
      const task: PipelineBuilderTaskBase = {
        name: 'example-task',
        runAfter: ['first', 'second'],
      };
      expect(
        mapReplaceRelatedInOthers<PipelineBuilderTaskBase>('new-name', 'replace-me', task),
      ).toBe(task);
    });

    it('should replace a related runAfter with a new runAfter', () => {
      const task: PipelineBuilderTaskBase = {
        name: 'example-task',
        runAfter: ['first', 'replace-me', 'second'],
      };
      const result = mapReplaceRelatedInOthers<PipelineBuilderTaskBase>(
        'new-name',
        'replace-me',
        task,
      );
      expect(result.runAfter).toEqual(expect.arrayContaining(['new-name']));
      expect(result.runAfter).not.toEqual(expect.arrayContaining(['replace-me']));
      expect(result.runAfter).toHaveLength(3);
    });
  });

  describe('mapRemoveRelatedInOthers', () => {
    it('should handle nulls', () => {
      expect(mapRemoveRelatedInOthers(null, null)).toBe(null);
      const task1: PipelineBuilderTaskBase = { name: 'example-task' };
      expect(mapRemoveRelatedInOthers<PipelineBuilderTaskBase>(null, task1)).toBe(task1);
      const task2: PipelineBuilderTaskBase = { name: 'example-task', runAfter: [] };
      expect(mapRemoveRelatedInOthers<PipelineBuilderTaskBase>(null, task2)).toBe(task2);
      const task3: PipelineBuilderTaskBase = { name: 'example-task', runAfter: ['first'] };
      expect(mapRemoveRelatedInOthers<PipelineBuilderTaskBase>(null, task3)).toBe(task3);
    });

    it('should do nothing if there are no runAfters', () => {
      const task: PipelineBuilderTaskBase = { name: 'example-task' };
      expect(mapRemoveRelatedInOthers<PipelineBuilderTaskBase>('test', task)).toBe(task);
    });

    it('should do nothing if the runAfters do not include the target', () => {
      const task: PipelineBuilderTaskBase = {
        name: 'example-task',
        runAfter: ['first', 'second'],
      };
      expect(mapRemoveRelatedInOthers<PipelineBuilderTaskBase>('remove-me', task)).toBe(task);
    });

    it('should remove a related runAfter if it matches', () => {
      const task: PipelineBuilderTaskBase = {
        name: 'example-task',
        runAfter: ['first', 'remove-me', 'second'],
      };
      const result = mapRemoveRelatedInOthers<PipelineBuilderTaskBase>('remove-me', task);
      expect(result.runAfter).not.toEqual(expect.arrayContaining(['remove-me']));
      expect(result.runAfter).toHaveLength(2);
    });
  });

  describe('mapStitchReplaceInOthers', () => {
    it('should handle nulls', () => {
      expect(mapStitchReplaceInOthers(null, null)).toBe(null);
      const task1: PipelineBuilderTaskBase = { name: 'example-task' };
      expect(mapStitchReplaceInOthers<PipelineBuilderTaskBase>(null, task1)).toBe(task1);
      expect(mapStitchReplaceInOthers<PipelineBuilderTaskBase>(task1, null)).toBe(null);
      const task2: PipelineBuilderTaskBase = { name: 'example-task', runAfter: [] };
      expect(mapStitchReplaceInOthers<PipelineBuilderTaskBase>(null, task2)).toBe(task2);
      expect(mapStitchReplaceInOthers<PipelineBuilderTaskBase>(task2, null)).toBe(null);
      const task3: PipelineBuilderTaskBase = { name: 'example-task', runAfter: ['first'] };
      expect(mapStitchReplaceInOthers<PipelineBuilderTaskBase>(null, task3)).toBe(task3);
      expect(mapStitchReplaceInOthers<PipelineBuilderTaskBase>(task3, null)).toBe(null);
    });

    it('should just remove if there are no runAfters in removalTask', () => {
      const target: PipelineBuilderTaskBase = { name: 'target' };
      const source: PipelineBuilderTaskBase = { name: 'source', runAfter: ['target'] };
      expect(mapStitchReplaceInOthers<PipelineBuilderTaskBase>(target, source)).toEqual({
        name: 'source',
        runAfter: [],
      });
    });

    it('should do nothing if the task is not in the runAfter', () => {
      const target: PipelineBuilderTaskBase = { name: 'not-the-target' };
      const source: PipelineBuilderTaskBase = { name: 'source', runAfter: ['target'] };
      expect(mapStitchReplaceInOthers<PipelineBuilderTaskBase>(target, source)).toBe(source);
    });

    it('should remove the task and consume the runAfters of the removalTask', () => {
      const target: PipelineBuilderTaskBase = { name: 'target', runAfter: ['first'] };
      const source: PipelineBuilderTaskBase = { name: 'source', runAfter: ['target'] };
      expect(mapStitchReplaceInOthers<PipelineBuilderTaskBase>(target, source)).toEqual({
        name: 'source',
        runAfter: ['first'],
      });
    });

    it('should remove the task and combine runAfters with the removalTask', () => {
      const target: PipelineBuilderTaskBase = { name: 'target', runAfter: ['first'] };
      const source: PipelineBuilderTaskBase = { name: 'source', runAfter: ['target', 'second'] };
      expect(mapStitchReplaceInOthers<PipelineBuilderTaskBase>(target, source)).toEqual({
        name: 'source',
        runAfter: expect.arrayContaining(['first', 'second']),
      });
    });

    it('should remove the task and combine runAfters with the removalTask (dupe runAfter)', () => {
      const target: PipelineBuilderTaskBase = { name: 'target', runAfter: ['first'] };
      const source: PipelineBuilderTaskBase = { name: 'source', runAfter: ['target', 'first'] };
      const result = mapStitchReplaceInOthers<PipelineBuilderTaskBase>(target, source);
      expect(result).toEqual({
        name: 'source',
        runAfter: expect.arrayContaining(['first']),
      });
      expect(result.runAfter).toHaveLength(1);
    });
  });

  describe('mapBeRelated', () => {
    it('should handle nulls', () => {
      expect(mapBeRelated(null, null, null)).toBe(null);
      const task: PipelineBuilderTaskBase = { name: 'task-name' };
      expect(mapBeRelated<PipelineBuilderTaskBase>(null, null, task)).toBe(task);
      expect(mapBeRelated<PipelineBuilderTaskBase>('test', null, task)).toBe(task);
      expect(mapBeRelated<PipelineBuilderTaskBase>(null, 'test', task)).toBe(task);
    });

    it('should add runAfter if matching name is provided', () => {
      const task: PipelineBuilderTaskBase = { name: 'task-name' };
      expect(mapBeRelated<PipelineBuilderTaskBase>('value', 'task-name', task)).toEqual({
        name: 'task-name',
        runAfter: ['value'],
      });
    });

    it('should replace runAfter if one exists when matching name is provided', () => {
      const task: PipelineBuilderTaskBase = { name: 'task-name', runAfter: ['will-be-removed'] };
      expect(mapBeRelated<PipelineBuilderTaskBase>('value', 'task-name', task)).toEqual({
        name: 'task-name',
        runAfter: ['value'],
      });
    });
  });

  describe('mapAddRelatedToOthers', () => {
    it('should handle nulls', () => {
      expect(mapAddRelatedToOthers<PipelineBuilderTaskBase>(null, null, null)).toBe(null);
      const task: PipelineBuilderTaskBase = { name: 'task-name' };
      expect(mapAddRelatedToOthers<PipelineBuilderTaskBase>(null, null, task)).toBe(task);
      expect(mapAddRelatedToOthers<PipelineBuilderTaskBase>('test', null, task)).toBe(task);
      expect(mapAddRelatedToOthers<PipelineBuilderTaskBase>(null, 'test', task)).toBe(task);
    });

    it('should do nothing if there are no runAfters', () => {
      const task: PipelineBuilderTaskBase = { name: 'task-name' };
      expect(mapAddRelatedToOthers<PipelineBuilderTaskBase>('test', 'test', task)).toBe(task);
      expect(mapAddRelatedToOthers<PipelineBuilderTaskBase>('task-name', 'task-name', task)).toBe(
        task,
      );
    });

    it('should do nothing if there is no matching name in the runAfters', () => {
      const task: PipelineBuilderTaskBase = { name: 'task-name', runAfter: ['not-found'] };
      expect(mapAddRelatedToOthers<PipelineBuilderTaskBase>('test', 'test', task)).toBe(task);
    });

    it('should add task name to runAfters if related name is found', () => {
      const task: PipelineBuilderTaskBase = { name: 'task-name', runAfter: ['to-be-found'] };
      const result = mapAddRelatedToOthers<PipelineBuilderTaskBase>(
        'new-value',
        'to-be-found',
        task,
      );
      expect(result).toEqual({
        name: 'task-name',
        runAfter: expect.arrayContaining(['to-be-found', 'new-value']),
      });
      expect(result.runAfter).toHaveLength(2);
    });
  });
});

describe('removeEmptyFormFields', () => {
  it('should not fail without any additional data', () => {
    const task: PipelineTask = {
      name: 'a-task',
    };
    const result = removeEmptyFormFields(task);
    expect(result).toEqual({
      name: 'a-task',
    });
  });

  it('should drop empty parameter values', () => {
    const task: PipelineTask = {
      name: 'a-task',
      params: [
        { name: 'required-param', value: 'required-value' },
        { name: 'optional-param', value: '' },
      ],
    };
    const result = removeEmptyFormFields(task);
    expect(result).toEqual({
      name: 'a-task',
      params: [{ name: 'required-param', value: 'required-value' }],
    });
  });

  it('should drop unlinked resources', () => {
    const task: PipelineTask = {
      name: 'a-task',
      resources: {
        inputs: [
          { name: 'required-in-resource', resource: 'pipeline-git-resource' },
          { name: 'optional-in-resource', resource: '' },
        ],
        outputs: [
          { name: 'required-out-resource', resource: 'pipeline-image-resource' },
          { name: 'optional-out-resource', resource: '' },
        ],
      },
    };
    const result = removeEmptyFormFields(task);
    expect(result).toEqual({
      name: 'a-task',
      resources: {
        inputs: [{ name: 'required-in-resource', resource: 'pipeline-git-resource' }],
        outputs: [{ name: 'required-out-resource', resource: 'pipeline-image-resource' }],
      },
    });
  });

  it('should drop unlinked workspaces', () => {
    const task: PipelineTask = {
      name: 'a-task',
      workspaces: [
        { name: 'required-workspace', workspace: 'pipeline-workspace' },
        { name: 'optional-workspace', workspace: '' },
      ],
    };
    const result = removeEmptyFormFields(task);
    expect(result).toEqual({
      name: 'a-task',
      workspaces: [{ name: 'required-workspace', workspace: 'pipeline-workspace' }],
    });
  });

  it('should drop all optional or unlinked parameters', () => {
    const task: PipelineTask = {
      name: 'a-task',
      params: [
        { name: 'required-param', value: 'required-value' },
        { name: 'optional-param', value: '' },
      ],
      resources: {
        inputs: [
          { name: 'required-in-resource', resource: 'pipeline-git-resource' },
          { name: 'optional-in-resource', resource: '' },
        ],
        outputs: [
          { name: 'required-out-resource', resource: 'pipeline-image-resource' },
          { name: 'optional-out-resource', resource: '' },
        ],
      },
      workspaces: [
        { name: 'required-workspace', workspace: 'pipeline-workspace' },
        { name: 'optional-workspace', workspace: '' },
      ],
    };
    const result = removeEmptyFormFields(task);
    expect(result).toEqual({
      name: 'a-task',
      params: [{ name: 'required-param', value: 'required-value' }],
      resources: {
        inputs: [{ name: 'required-in-resource', resource: 'pipeline-git-resource' }],
        outputs: [{ name: 'required-out-resource', resource: 'pipeline-image-resource' }],
      },
      workspaces: [{ name: 'required-workspace', workspace: 'pipeline-workspace' }],
    });
  });
});

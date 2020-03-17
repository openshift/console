import { pipelineTestData, PipelineExampleNames } from '../../../../test/pipeline-data';
import { ClusterTaskModel, PipelineModel } from '../../../../models';
import { Pipeline, PipelineResourceTaskParam } from '../../../../utils/pipeline-augment';
import { TASK_ERROR_STRINGS, TASK_INCOMPLETE_ERROR_MESSAGE, TaskErrorType } from '../const';
import {
  convertBuilderFormToPipeline,
  convertPipelineToBuilderForm,
  convertResourceToTask,
  findTask,
  getErrorMessage,
  getPipelineURL,
  taskParamIsRequired,
} from '../utils';
import {
  BUILDER_FORM_DATA_EXAMPLE,
  PIPELINE_REF_CLUSTER_TASK,
  PIPELINE_REF_REG_TASK,
  RESOURCE_TASKS,
  RESOURCE_TASKS_ERRORED,
  RESOURCES_TASKS_LOADING,
  TASK_ERRORS,
} from './utils-data';

describe('taskParamIsRequired properly detects what is required', () => {
  const structure: PipelineResourceTaskParam = {
    name: 'test-param',
    description: 'some description',
    type: 'string',
  };

  it('expect an empty param to result in needing a default', () => {
    expect(taskParamIsRequired({} as any)).toBe(true);
  });

  it('expect no default property to mean required', () => {
    expect(taskParamIsRequired(structure)).toBe(true);
  });

  it('expect a string default of a truthy value to mean not required', () => {
    expect(taskParamIsRequired({ ...structure, default: 'truthy' })).toBe(false);
  });

  it('expect an empty string default to mean not required', () => {
    expect(taskParamIsRequired({ ...structure, default: '' })).toBe(false);
  });

  it('expect an array default to always be not required', () => {
    expect(taskParamIsRequired({ ...structure, type: 'array', default: [] })).toBe(false);
  });
});

describe('getErrorMessage returns condensed errors', () => {
  it('expect no error for empty error list', () => {
    expect(getErrorMessage(TASK_ERRORS.NO_ERRORS)(42)).toBe(null);
  });

  it('expect resource error to give when all resource data is missing', () => {
    expect(getErrorMessage(TASK_ERRORS.RESOURCES_ALL_MISSING_ERROR)(0)).toBe(
      TASK_ERROR_STRINGS[TaskErrorType.MISSING_RESOURCES],
    );
  });

  it('expect param error to given when there is a missing required param', () => {
    expect(getErrorMessage(TASK_ERRORS.PARAMETERS_STRING_EMPTY)(0)).toBe(
      TASK_ERROR_STRINGS[TaskErrorType.MISSING_REQUIRED_PARAMS],
    );
  });

  it('expect param error to given when there is an array with a missing param', () => {
    expect(getErrorMessage(TASK_ERRORS.PARAMETERS_ARRAY_PARTIALLY_EMPTY)(0)).toBe(
      TASK_ERROR_STRINGS[TaskErrorType.MISSING_REQUIRED_PARAMS],
    );
  });

  it('expect resource error when given both a param and resource error', () => {
    expect(getErrorMessage(TASK_ERRORS.BOTH_PARAM_AND_RESOURCE_ERRORS)(0)).toBe(
      TASK_ERROR_STRINGS[TaskErrorType.MISSING_RESOURCES],
    );
  });

  it('expect to gracefully handle a generic error if something was uncaught', () => {
    expect(getErrorMessage([{ something: 'else' }] as any)(0)).toBe(TASK_INCOMPLETE_ERROR_MESSAGE);
  });

  it('expect to be able to report errors for other tasks', () => {
    expect(getErrorMessage([undefined, ...TASK_ERRORS.PARAMETERS_STRING_EMPTY])(0)).toBe(null);
  });
});

describe('findTask locates relevant tasks', () => {
  it('expect to get a regular Task when no taskRef kind is provided', () => {
    expect(findTask(RESOURCE_TASKS, PIPELINE_REF_REG_TASK)).toBe(RESOURCE_TASKS.namespacedTasks[0]);
  });

  it('expect to get a regular Task when giving a nonsensical kind value', () => {
    expect(findTask(RESOURCE_TASKS, { ...PIPELINE_REF_REG_TASK, kind: 'not-a-kind' })).toBe(
      RESOURCE_TASKS.namespacedTasks[0],
    );
  });

  it('expect to get nothing back if there are no matches for the name', () => {
    expect(findTask(RESOURCE_TASKS, { name: 'not-a-match' })).toBe(undefined);
  });

  it('expect to get nothing while the data is still loading', () => {
    expect(findTask(RESOURCES_TASKS_LOADING, PIPELINE_REF_REG_TASK)).toBe(null);
  });

  it('expect to get nothing if the data is errored out', () => {
    expect(findTask(RESOURCE_TASKS_ERRORED, PIPELINE_REF_REG_TASK)).toBe(null);
  });

  it('expect to get nothing if nothing is passed', () => {
    expect(findTask(null, null)).toBe(null);
  });

  it('expect to get a ClusterTask back if providing a matching name with the ClusterTask kind', () => {
    expect(findTask(RESOURCE_TASKS, PIPELINE_REF_CLUSTER_TASK)).toBe(
      RESOURCE_TASKS.clusterTasks[0],
    );
  });
});

describe('convertResourceToTask maps successfully', () => {
  const clusterTask = RESOURCE_TASKS.clusterTasks[0];
  const namespacedTask = RESOURCE_TASKS.namespacedTasks[0];

  it('expect to get the resource name as the Task name', () => {
    const pipelineTask = convertResourceToTask(clusterTask);
    expect(pipelineTask.name).toEqual(clusterTask.metadata.name);
  });

  it('expect to get the proper taskRef back to the resource', () => {
    const pipelineTask = convertResourceToTask(clusterTask);
    expect(pipelineTask.taskRef).toEqual({
      kind: ClusterTaskModel.kind,
      name: clusterTask.metadata.name,
    });
  });

  it('expect to get parameters back pre-filled with the resource default', () => {
    const pipelineTask = convertResourceToTask(clusterTask);
    expect(pipelineTask.params).toEqual([
      {
        name: 'BUILDER_IMAGE',
        value: 'quay.io/buildah/stable:v1.11.0',
      },
      {
        name: 'DOCKERFILE',
        value: './Dockerfile',
      },
      {
        name: 'TLSVERIFY',
        value: 'true',
      },
    ]);
  });

  it('expect to get an empty param value when there is no resource default', () => {
    const pipelineTask = convertResourceToTask(namespacedTask);
    expect(pipelineTask.params[1]).toEqual({
      name: 'required-param',
      value: undefined,
    });
  });
});

describe('getPipelineURL returns a link to the root of Pipelines', () => {
  it('expect to get the path to Pipelines', () => {
    expect(getPipelineURL('test-ns')).toBe('/k8s/ns/test-ns/tekton.dev~v1alpha1~Pipeline');
  });
});

describe('convertBuilderFormToPipeline returns a valid Pipeline', () => {
  describe('form properly converts to Pipeline', () => {
    const pipeline = convertBuilderFormToPipeline(BUILDER_FORM_DATA_EXAMPLE, 'test-ns');

    it('expect top-level properties to be there', () => {
      expect(pipeline.apiVersion).toBeDefined();
      expect(pipeline.kind).toBe(PipelineModel.kind);
      expect(pipeline.metadata).toBeDefined();
      expect(pipeline.spec).toBeDefined();
      expect(Object.keys(pipeline)).toHaveLength(4);
    });

    it('expect metadata to be properly populated', () => {
      expect(pipeline.metadata.name).toBe(BUILDER_FORM_DATA_EXAMPLE.name);
      expect(pipeline.metadata.namespace).toBe('test-ns');
    });

    it('expect spec to be properly populated', () => {
      expect(pipeline.spec.tasks).toHaveLength(BUILDER_FORM_DATA_EXAMPLE.tasks.length);
      // We trim empty params as they have a default
      expect(pipeline.spec.tasks[1].params).toHaveLength(0);
      // We remove list tasks from the run afters
      expect(pipeline.spec.tasks[0].runAfter).toHaveLength(0);
    });
  });

  describe('form properly converts to Pipeline with existing Pipeline', () => {
    const existingPipeline: Pipeline = {
      ...pipelineTestData[PipelineExampleNames.CLUSTER_PIPELINE].pipeline,
      latestRun: null, // just to show it will stay around
    };
    const newPipeline = convertBuilderFormToPipeline(
      BUILDER_FORM_DATA_EXAMPLE,
      'test-ns',
      existingPipeline,
    );

    it('expect top-level properties to be there', () => {
      expect(newPipeline.apiVersion).toBeDefined();
      expect(newPipeline.kind).toBe(PipelineModel.kind);
      expect(newPipeline.metadata).toBeDefined();
      expect(newPipeline.spec).toBeDefined();
      // Kept our top-level property
      expect(newPipeline.latestRun).toBe(null);
    });

    it('expect metadata to be properly populated', () => {
      expect(newPipeline.metadata.name).toBe(BUILDER_FORM_DATA_EXAMPLE.name);
      expect(newPipeline.metadata.namespace).toBe('test-ns');
      // Pre-existing label that should be carried over
      // TODO: When we upgrade to the latest Jest (25+), this should be .toHaveProperty(['...'])
      expect(newPipeline.metadata.labels['pipeline.openshift.io/runtime']).toBeDefined();
    });

    it('expect spec to be properly populated', () => {
      // Does not use tasks from the existingPipeline
      expect(newPipeline.spec.tasks).toHaveLength(BUILDER_FORM_DATA_EXAMPLE.tasks.length);
    });
  });
});

describe('convertPipelineToBuilderForm properly populates the commonality between Pipeline & form', () => {
  it('expect the form to be populated with relevant Pipeline items', () => {
    const existingPipeline = pipelineTestData[PipelineExampleNames.CLUSTER_PIPELINE].pipeline;
    const formValues = convertPipelineToBuilderForm(existingPipeline);
    expect(formValues.name).toBe(existingPipeline.metadata.name);
    expect(formValues.params).toEqual([]);
    expect(formValues.resources).toEqual([]);
    expect(formValues.tasks).toEqual(existingPipeline.spec.tasks);
    expect(formValues.listTasks).toEqual([]);
  });

  it('expect the form to not return if no Pipeline is provided', () => {
    expect(convertPipelineToBuilderForm(undefined)).toBe(null);
    expect(convertPipelineToBuilderForm(null)).toBe(null);
  });
});

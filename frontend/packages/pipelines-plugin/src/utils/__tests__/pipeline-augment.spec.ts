import * as _ from 'lodash';
import { referenceForModel, apiVersionForModel } from '@console/internal/module/k8s';
import { pipelineTestData, DataState, PipelineExampleNames } from '../../test-data/pipeline-data';
import { PipelineKind } from '../../types';
import {
  getResources,
  augmentRunsToData,
  getTaskStatus,
  TaskStatus,
  getRunStatusColor,
  runStatus,
  getResourceModelFromTask,
  pipelineRefExists,
  getPipelineFromPipelineRun,
  totalPipelineRunTasks,
  getResourceModelFromTaskKind,
  getResourceModelFromBindingKind,
  shouldHidePipelineRunStop,
} from '../pipeline-augment';
import {
  ClusterTaskModel,
  PipelineRunModel,
  TaskModel,
  PipelineModel,
  ClusterTriggerBindingModel,
  TriggerBindingModel,
} from '../../models';
import { testData } from './pipeline-augment-test-data';

describe('PipelineAugment test getResources create correct resources for firehose', () => {
  it('expect resources to be null for no data', () => {
    const resources = getResources(testData[0].data);
    expect(resources.resources).toBe(null);
    expect(resources.propsReferenceForRuns).toBe(null);
  });

  it('expect resources to be null for empty data array', () => {
    const resources = getResources(testData[1].data);
    expect(resources.resources).toBe(null);
    expect(resources.propsReferenceForRuns).toBe(null);
  });

  it('expect resources to be of length 1 and have the following properties & childprops', () => {
    const resources = getResources(testData[2].data);
    expect(resources.resources.length).toBe(1);
    expect(resources.resources[0].kind).toBe(referenceForModel(PipelineRunModel));
    expect(resources.resources[0].namespace).toBe(testData[2].data[0].metadata.namespace);
    expect(resources.propsReferenceForRuns.length).toBe(1);
  });

  it('expect resources to be of length 2 and have the following properties & childprops', () => {
    const resources = getResources(testData[3].data);
    expect(resources.resources.length).toBe(2);
    expect(resources.resources[0].kind).toBe(referenceForModel(PipelineRunModel));
    expect(resources.resources[1].kind).toBe(referenceForModel(PipelineRunModel));
    expect(resources.resources[0].namespace).toBe(testData[3].data[0].metadata.namespace);
    expect(resources.resources[0].namespace).toBe(testData[3].data[1].metadata.namespace);
    expect(resources.propsReferenceForRuns.length).toBe(2);
  });
});

describe('PipelineAugment test correct data is augmented', () => {
  it('expect additional resources to be correctly added using augmentRunsToData', () => {
    const newData = augmentRunsToData(
      testData[2].data,
      testData[2].propsReferenceForRuns,
      testData[2].keyedRuns,
    );
    expect(newData.length).toBe(1);
    expect(newData[0].latestRun.metadata.name).toBe(
      testData[2].keyedRuns.apple1Runs.data[0].metadata.name,
    );
  });

  it('expect additional resources to be added using latest run', () => {
    const newData = augmentRunsToData(
      testData[3].data,
      testData[3].propsReferenceForRuns,
      testData[3].keyedRuns,
    );
    expect(newData.length).toBe(2);
    expect(newData[0].latestRun.metadata.name).toBe(
      testData[3].keyedRuns.apple1Runs.data[1].metadata.name,
    );
    expect(newData[1].latestRun.metadata.name).toBe(
      testData[3].keyedRuns.apple2Runs.data[0].metadata.name,
    );
  });
});

describe('PipelineAugment test getRunStatusColor handles all runStatus values', () => {
  it('expect all but PipelineNotStarted to produce a non-default result', () => {
    // Verify that we cover colour states for all the runStatus values
    const failCase = 'PipelineNotStarted';
    const defaultCase = getRunStatusColor(runStatus[failCase]);
    const allOtherStatuses = Object.keys(runStatus)
      .filter((status) => status !== failCase)
      .map((status) => runStatus[status]);

    expect(allOtherStatuses).not.toHaveLength(0);
    allOtherStatuses.forEach((statusValue) => {
      const { message } = getRunStatusColor(statusValue);

      expect(defaultCase.message).not.toEqual(message);
    });
  });

  it('expect all status colors to return visible text to show as a descriptor of the colour', () => {
    const runStates = Object.values(runStatus);

    expect(runStates).not.toHaveLength(0);
    runStates.forEach((statusValue) => {
      const { message } = getRunStatusColor(statusValue);

      expect(message).not.toHaveLength(0);
    });
  });
});

describe('PipelineAugment test correct task status state is pulled from pipeline/pipelineruns', () => {
  it('expect no arguments to produce a net-zero result', () => {
    // Null check + showcasing we get at least 1 value out of the function
    const emptyTaskStatus = getTaskStatus(null, null);
    expect(emptyTaskStatus).toEqual({
      PipelineNotStarted: 1,
      Pending: 0,
      Running: 0,
      Succeeded: 0,
      Failed: 0,
      Cancelled: 0,
      Skipped: 0,
    });
  });

  const getExpectedTaskCount = (pipeline: PipelineKind): number =>
    pipeline.spec.tasks.length + (pipeline.spec.finally?.length || 0);
  const sumTaskStatuses = (status: TaskStatus): number =>
    Object.values(status).reduce((acc, v) => acc + v, 0);

  describe('Successfully completed Pipelines', () => {
    // Simply put, when a pipeline run is finished successfully, all tasks must have succeeded
    it('expect a simple pipeline to have task-count equal to Succeeded states', () => {
      const simpleTestData = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE];

      const expectedTaskCount = getExpectedTaskCount(simpleTestData.pipeline);
      const taskStatus = getTaskStatus(
        simpleTestData.pipelineRuns[DataState.SUCCESS],
        simpleTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(simpleTestData.pipeline);

      expect(taskStatus.Succeeded).toEqual(expectedTaskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });

    it('expect a complex pipeline to have task-count equal to Succeeded states', () => {
      const complexTestData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];

      const expectedTaskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.SUCCESS],
        complexTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(complexTestData.pipeline);

      expect(taskStatus.Succeeded).toEqual(expectedTaskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });

    it('expect a pipeline to consider finally tasks in task-count', () => {
      const finallyTestData = pipelineTestData[PipelineExampleNames.PIPELINE_WITH_FINALLY];

      const expectedTaskCount = getExpectedTaskCount(finallyTestData.pipeline);
      const taskStatus = getTaskStatus(
        finallyTestData.pipelineRuns[DataState.SUCCESS],
        finallyTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(finallyTestData.pipeline);

      expect(taskStatus.Succeeded).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });
  });

  describe('In Progress pipelines', () => {
    // There are various states to in progress, the status of a task is either:
    //  - completed (with some left)
    //  - currently running
    //  - waiting to start
    const sumInProgressTaskStatuses = (status: TaskStatus): number =>
      status.Succeeded + status.Running + status.Pending;

    it('expect a simple pipeline to have task-count equal to Pending, Running and Succeeded states', () => {
      const simpleTestData = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE];

      const expectedTaskCount = getExpectedTaskCount(simpleTestData.pipeline);
      const taskStatus = getTaskStatus(
        simpleTestData.pipelineRuns[DataState.IN_PROGRESS],
        simpleTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(simpleTestData.pipeline);

      expect(sumInProgressTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });

    it('expect a complex pipeline to have task-count equal to Pending, Running and Succeeded states', () => {
      const complexTestData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];

      const expectedTaskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.IN_PROGRESS],
        complexTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(complexTestData.pipeline);

      expect(sumInProgressTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });

    it('should not hide the pipelinerun stop action ', () => {
      const pipelineRun =
        pipelineTestData[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].pipelineRuns[
          DataState.IN_PROGRESS
        ];
      expect(shouldHidePipelineRunStop(pipelineRun)).toEqual(false);
    });

    it('should hide the pipelinerun stop action ', () => {
      const pipelineRun =
        pipelineTestData[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].pipelineRuns[
          DataState.SUCCESS
        ];
      expect(shouldHidePipelineRunStop(pipelineRun)).toEqual(true);
    });
  });

  describe('Failed / Cancelled pipelines', () => {
    // When a pipeline run fails or is cancelled - all not-started tasks are cancelled and any on-going tasks fail
    const sumFailedTaskStatus = (status: TaskStatus): number => status.Failed;
    const sumCancelledTaskStatus = (status: TaskStatus): number => status.Cancelled;
    const sumSuccededTaskStatus = (status: TaskStatus): number => status.Succeeded;
    const complexTestData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];

    it('expect a partial pipeline to have task-count equal to Failed and Cancelled states', () => {
      const partialTestData = pipelineTestData[PipelineExampleNames.PARTIAL_PIPELINE];

      const expectedTaskCount = getExpectedTaskCount(partialTestData.pipeline);
      const taskStatus = getTaskStatus(
        partialTestData.pipelineRuns[DataState.FAILED_BUT_COMPLETE],
        partialTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(partialTestData.pipeline);

      expect(sumFailedTaskStatus(taskStatus)).toEqual(0);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expectedTaskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });

    it(`expect correct task status for PipelineRun cancelled at beginning`, () => {
      const expected = { succeeded: 1, failed: 0, cancelled: 12 };
      const expectedTaskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.CANCELLED1],
        complexTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(complexTestData.pipeline);

      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });

    it(`expect correct task status for PipelineRun failed at beginning`, () => {
      const expected = { succeeded: 0, failed: 1, cancelled: 12 };
      const expectedTaskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.FAILED1],
        complexTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(complexTestData.pipeline);

      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });

    it(`expect correct task status for PLR cancelled at stage 2 parallel`, () => {
      const expected = { succeeded: 3, failed: 0, cancelled: 10 };
      const expectedTaskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.CANCELLED2],
        complexTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(complexTestData.pipeline);

      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });

    it(`expect correct task status for PLR failed at stage 2 parallel`, () => {
      const expected = { succeeded: 2, failed: 1, cancelled: 10 };
      const expectedTaskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.FAILED2],
        complexTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(complexTestData.pipeline);

      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });

    it(`expect correct task status for PLR cancelled at stage 3`, () => {
      const expected = { succeeded: 4, failed: 0, cancelled: 9 };
      const expectedTaskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.CANCELLED3],
        complexTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(complexTestData.pipeline);

      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });

    it(`expect correct task status for PLR failed at stage 3`, () => {
      const expected = { succeeded: 2, failed: 2, cancelled: 9 };
      const expectedTaskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.FAILED3],
        complexTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(complexTestData.pipeline);

      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });
  });

  describe('Skipped pipelines', () => {
    // When a pipeline run skips certain task based on the when expression/condtion
    const sumSkippedTaskStatus = (status: TaskStatus): number => status.Skipped;
    const sumSuccededTaskStatus = (status: TaskStatus): number => status.Succeeded;
    const complexTestData = pipelineTestData[PipelineExampleNames.CONDITIONAL_PIPELINE];

    it(`expect to return the skipped task status count if whenExpression is used`, () => {
      const expected = { succeeded: 1, skipped: 1 };
      const expectedTaskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.SKIPPED],
        complexTestData.pipeline,
      );
      const taskCount = totalPipelineRunTasks(complexTestData.pipeline);

      expect(sumSkippedTaskStatus(taskStatus)).toEqual(expected.skipped);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumTaskStatuses(taskStatus)).toEqual(expectedTaskCount);
      expect(taskCount).toEqual(expectedTaskCount);
    });
  });
});

describe('PipelineAugment test successfully determine Task type', () => {
  it('expect to always get back a model', () => {
    const model = getResourceModelFromTask({ name: null, taskRef: { name: null } });
    expect(model).toBe(TaskModel);
  });

  it('expect to get a TaskModel for normal tasks', () => {
    const complexTestData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];

    const model = getResourceModelFromTask(complexTestData.pipeline.spec.tasks[0]);
    expect(model).toBe(TaskModel);
  });

  it('expect to get a ClusterTaskModel for tasks of a ClusterTask kind', () => {
    const complexTestData = pipelineTestData[PipelineExampleNames.CLUSTER_PIPELINE];

    const model = getResourceModelFromTask(complexTestData.pipeline.spec.tasks[0]);
    expect(model).toBe(ClusterTaskModel);
  });
});

describe('Pipeline exists test to determine whether a pipeline is linked to a pipelinerun', () => {
  it('expect to return true if pipelineref is available in pipelinerun spec', () => {
    const pipelineRunWithPipelineRef =
      pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS];

    const pipelineFound = pipelineRefExists(pipelineRunWithPipelineRef);
    expect(pipelineFound).toBeTruthy();
  });

  it('expect to return false if pipelineref is missing in pipelinerun spec', () => {
    const pipelineRunWithoutPipelineRef = _.omit(
      pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS],
      'spec.pipelineRef',
    );

    const pipelineFound = pipelineRefExists(pipelineRunWithoutPipelineRef);
    expect(pipelineFound).toBeFalsy();
  });
});

describe('Pipelinerun graph to show the executed pipeline structure', () => {
  const testPipelineRun =
    pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS];

  it('expect to return null, if pipelinerun does not have a pipelineSpec field in status or spec', () => {
    const plrWithoutPipelineSpec = _.omit(testPipelineRun, ['status']);
    const executedPipeline = getPipelineFromPipelineRun(plrWithoutPipelineSpec);
    expect(executedPipeline).toEqual(null);
  });

  it('expect to return null, if pipelinerun does not have pipeline labels or name in the metadata field', () => {
    const executedPipeline = getPipelineFromPipelineRun(
      _.omit(testPipelineRun, ['metadata.labels', 'metadata.name']),
    );
    expect(executedPipeline).toBe(null);
  });

  it('expect to return pipeline, if pipelinerun has pipelineSpec in spec field', () => {
    const plrWithEmbeddedPipeline =
      pipelineTestData[PipelineExampleNames.EMBEDDED_PIPELINE_SPEC].pipelineRuns[DataState.SUCCESS];
    const executedPipeline = getPipelineFromPipelineRun(plrWithEmbeddedPipeline);
    expect(executedPipeline).not.toBe(null);
    expect(executedPipeline).toMatchObject({
      apiVersion: apiVersionForModel(PipelineModel),
      kind: 'Pipeline',
      metadata: {
        name: plrWithEmbeddedPipeline.metadata.name,
        namespace: plrWithEmbeddedPipeline.metadata.namespace,
      },
      spec: { ...plrWithEmbeddedPipeline.spec.pipelineSpec },
    });
  });

  it('expect to return the pipeline, if pipelinerun has pipelineSpec in status field', () => {
    const executedPipeline = getPipelineFromPipelineRun(testPipelineRun);
    expect(executedPipeline).not.toBe(null);
    expect(executedPipeline).toMatchObject({
      ...pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipeline,
      apiVersion: apiVersionForModel(PipelineModel),
    });
  });
});

describe('getResourceModelFromTaskKind', () => {
  it('should handle null', () => {
    expect(getResourceModelFromTaskKind(null)).toBe(null);
  });

  it('should be able to find ClusterTaskModel', () => {
    expect(getResourceModelFromTaskKind('ClusterTask')).toBe(ClusterTaskModel);
  });

  it('should be able to find TaskModel', () => {
    expect(getResourceModelFromTaskKind('Task')).toBe(TaskModel);
  });

  it('should return the TaskModel for undefined', () => {
    expect(getResourceModelFromTaskKind(undefined)).toBe(TaskModel);
  });

  it('should return null for any unknown value', () => {
    expect(getResourceModelFromTaskKind('EmbeddedTask')).toBe(null);
    expect(getResourceModelFromTaskKind('123%$^&asdf')).toBe(null);
    expect(getResourceModelFromTaskKind('Nothing special')).toBe(null);
  });
});

describe('getResourceModelFromBindingKind', () => {
  it('should handle null', () => {
    expect(getResourceModelFromBindingKind(null)).toBe(null);
  });

  it('should be able to find ClusterTriggerBindingModel', () => {
    expect(getResourceModelFromBindingKind('ClusterTriggerBinding')).toBe(
      ClusterTriggerBindingModel,
    );
  });

  it('should be able to find TriggerBindingModel', () => {
    expect(getResourceModelFromBindingKind('TriggerBinding')).toBe(TriggerBindingModel);
  });

  it('should return TriggerBindingModel for undefined', () => {
    expect(getResourceModelFromBindingKind(undefined)).toBe(TriggerBindingModel);
  });

  it('should return null for any unknown value', () => {
    expect(getResourceModelFromBindingKind('EmbeddedBinding')).toBe(null);
    expect(getResourceModelFromBindingKind('123%$^&asdf')).toBe(null);
    expect(getResourceModelFromBindingKind('Nothing special')).toBe(null);
  });
});

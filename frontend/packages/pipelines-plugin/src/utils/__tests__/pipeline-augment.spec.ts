import * as _ from 'lodash';
import { TFunction } from 'i18next';
import { referenceForModel, apiVersionForModel } from '@console/internal/module/k8s';
import { pipelineTestData, DataState, PipelineExampleNames } from '../../test-data/pipeline-data';
import {
  getResources,
  augmentRunsToData,
  getTaskStatus,
  TaskStatus,
  Pipeline,
  getRunStatusColor,
  runStatus,
  getResourceModelFromTask,
  pipelineRefExists,
  getPipelineFromPipelineRun,
} from '../pipeline-augment';
import { ClusterTaskModel, PipelineRunModel, TaskModel, PipelineModel } from '../../models';
import { testData } from './pipeline-augment-test-data';

const t = (key): TFunction => key;

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
    const defaultCase = getRunStatusColor(runStatus[failCase], t);
    const allOtherStatuses = Object.keys(runStatus)
      .filter((status) => status !== failCase)
      .map((status) => runStatus[status]);

    expect(allOtherStatuses).not.toHaveLength(0);
    allOtherStatuses.forEach((statusValue) => {
      const { message } = getRunStatusColor(statusValue, t);

      expect(defaultCase.message).not.toEqual(message);
    });
  });

  it('expect all status colors to return visible text to show as a descriptor of the colour', () => {
    const runStates = Object.values(runStatus);

    expect(runStates).not.toHaveLength(0);
    runStates.forEach((statusValue) => {
      const { message } = getRunStatusColor(statusValue, t);

      expect(message).not.toHaveLength(0);
    });
  });
});

describe('PipelineAugment test correct task status state is pulled from pipeline/pipelineruns', () => {
  it('expect no arguments to produce a net-zero result', () => {
    // Null check + showcasing we get at least 1 value out of the function
    const emptyTaskStatus = getTaskStatus(null);
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

  const getExpectedTaskCount = (pipeline: Pipeline): number => pipeline.spec.tasks.length;
  const sumTaskStatuses = (status: TaskStatus): number =>
    Object.values(status).reduce((acc, v) => acc + v, 0);

  describe('Successfully completed Pipelines', () => {
    // Simply put, when a pipeline run is finished successfully, all tasks must have succeeded
    it('expect a simple pipeline to have task-count equal to Succeeded states', () => {
      const simpleTestData = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE];

      const taskCount = getExpectedTaskCount(simpleTestData.pipeline);
      const taskStatus = getTaskStatus(simpleTestData.pipelineRuns[DataState.SUCCESS]);

      expect(taskStatus.Succeeded).toEqual(taskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it('expect a complex pipeline to have task-count equal to Succeeded states', () => {
      const complexTestData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];

      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(complexTestData.pipelineRuns[DataState.SUCCESS]);

      expect(taskStatus.Succeeded).toEqual(taskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
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

      const taskCount = getExpectedTaskCount(simpleTestData.pipeline);
      const taskStatus = getTaskStatus(simpleTestData.pipelineRuns[DataState.IN_PROGRESS]);

      expect(sumInProgressTaskStatuses(taskStatus)).toEqual(taskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it('expect a complex pipeline to have task-count equal to Pending, Running and Succeeded states', () => {
      const complexTestData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];

      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(complexTestData.pipelineRuns[DataState.IN_PROGRESS]);

      expect(sumInProgressTaskStatuses(taskStatus)).toEqual(taskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
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

      const taskCount = getExpectedTaskCount(partialTestData.pipeline);
      const taskStatus = getTaskStatus(partialTestData.pipelineRuns[DataState.FAILED_BUT_COMPLETE]);

      expect(sumFailedTaskStatus(taskStatus)).toEqual(0);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(taskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it(`expect correct task status for PipelineRun cancelled at beginning`, () => {
      const expected = { succeeded: 1, failed: 0, cancelled: 12 };
      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(complexTestData.pipelineRuns[DataState.CANCELLED1]);
      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it(`expect correct task status for PipelineRun failed at beginning`, () => {
      const expected = { succeeded: 0, failed: 1, cancelled: 12 };
      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(complexTestData.pipelineRuns[DataState.FAILED1]);
      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it(`expect correct task status for PLR cancelled at stage 2 parallel`, () => {
      const expected = { succeeded: 3, failed: 0, cancelled: 10 };
      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(complexTestData.pipelineRuns[DataState.CANCELLED2]);
      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it(`expect correct task status for PLR failed at stage 2 parallel`, () => {
      const expected = { succeeded: 2, failed: 1, cancelled: 10 };
      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(complexTestData.pipelineRuns[DataState.FAILED2]);
      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it(`expect correct task status for PLR cancelled at stage 3`, () => {
      const expected = { succeeded: 4, failed: 0, cancelled: 9 };
      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(complexTestData.pipelineRuns[DataState.CANCELLED3]);
      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it(`expect correct task status for PLR failed at stage 3`, () => {
      const expected = { succeeded: 2, failed: 2, cancelled: 9 };
      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(complexTestData.pipelineRuns[DataState.FAILED3]);
      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(expected.cancelled);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });
  });

  describe('Skipped pipelines', () => {
    // When a pipeline run skips certain task based on the when expression/condtion
    const sumSkippedTaskStatus = (status: TaskStatus): number => status.Skipped;
    const sumSuccededTaskStatus = (status: TaskStatus): number => status.Succeeded;
    const complexTestData = pipelineTestData[PipelineExampleNames.CONDITIONAL_PIPELINE];

    it(`expect to return the skipped task status count if whenExpression is used`, () => {
      const expected = { succeeded: 1, skipped: 1 };
      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(complexTestData.pipelineRuns[DataState.SKIPPED]);
      expect(sumSkippedTaskStatus(taskStatus)).toEqual(expected.skipped);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
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

  it('expect to return null, if pipelinerun does not have a status field', () => {
    const plrWithoutPipelineSpec = _.omit(testPipelineRun, ['status']);
    const executedPipeline = getPipelineFromPipelineRun(plrWithoutPipelineSpec);
    expect(executedPipeline).toEqual(null);
  });

  it('expect to return null, if pipelinerun does not have pipelineSpec in status field', () => {
    const executedPipeline = getPipelineFromPipelineRun(
      _.omit(testPipelineRun, ['status.pipelineSpec']),
    );
    expect(executedPipeline).toBe(null);
  });

  it('expect to return null, if pipelinerun does not have pipeline labels in the metadata field', () => {
    const executedPipeline = getPipelineFromPipelineRun(
      _.omit(testPipelineRun, ['metadata.labels']),
    );
    expect(executedPipeline).toBe(null);
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

import { referenceForModel } from '@console/internal/module/k8s';
import { pipelineTestData, DataState, PipelineExampleNames } from '../../test/pipeline-data';
import {
  getResources,
  augmentRunsToData,
  getTaskStatus,
  TaskStatus,
  Pipeline,
  getRunStatusColor,
  runStatus,
  getResourceModelFromTask,
} from '../pipeline-augment';
import { ClusterTaskModel, PipelineRunModel, TaskModel } from '../../models';
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
      const taskStatus = getTaskStatus(
        simpleTestData.pipelineRuns[DataState.SUCCESS],
        simpleTestData.pipeline,
      );

      expect(taskStatus.Succeeded).toEqual(taskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it('expect a complex pipeline to have task-count equal to Succeeded states', () => {
      const complexTestData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];

      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.SUCCESS],
        complexTestData.pipeline,
      );

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
      const taskStatus = getTaskStatus(
        simpleTestData.pipelineRuns[DataState.IN_PROGRESS],
        simpleTestData.pipeline,
      );

      expect(sumInProgressTaskStatuses(taskStatus)).toEqual(taskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it('expect a complex pipeline to have task-count equal to Pending, Running and Succeeded states', () => {
      const complexTestData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];

      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.IN_PROGRESS],
        complexTestData.pipeline,
      );

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
      const taskStatus = getTaskStatus(
        partialTestData.pipelineRuns[DataState.FAILED],
        partialTestData.pipeline,
      );

      expect(sumFailedTaskStatus(taskStatus)).toEqual(0);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(taskCount);
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it(`expect correct task status for PipelineRun Failed at beginning`, () => {
      const expected = { succeeded: 0, failed: 1 };
      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.CANCELLED1],
        complexTestData.pipeline,
      );

      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(
        taskCount - (expected.failed + expected.succeeded),
      );
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it(`expect correct task status for PLR failed at stage 2 parallel`, () => {
      const expected = { succeeded: 1, failed: 0 };
      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.CANCELLED2],
        complexTestData.pipeline,
      );
      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(
        taskCount - (expected.failed + expected.succeeded),
      );
      expect(sumTaskStatuses(taskStatus)).toEqual(taskCount);
    });

    it(`expect correct task status for PLR failed at stage 3`, () => {
      const expected = { succeeded: 3, failed: 0 };
      const taskCount = getExpectedTaskCount(complexTestData.pipeline);
      const taskStatus = getTaskStatus(
        complexTestData.pipelineRuns[DataState.CANCELLED3],
        complexTestData.pipeline,
      );
      expect(sumFailedTaskStatus(taskStatus)).toEqual(expected.failed);
      expect(sumSuccededTaskStatus(taskStatus)).toEqual(expected.succeeded);
      expect(sumCancelledTaskStatus(taskStatus)).toEqual(
        taskCount - (expected.succeeded + expected.failed),
      );
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

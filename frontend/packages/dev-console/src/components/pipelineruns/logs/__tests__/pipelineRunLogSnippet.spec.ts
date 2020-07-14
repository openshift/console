import { DataState, pipelineTestData, PipelineExampleNames } from '../../../../test/pipeline-data';
import { PipelineRun } from '../../../../utils/pipeline-augment';
import { getLogSnippet } from '../pipelineRunLogSnippet';

describe('getLogSnippet successfully parses Pipeline Runs', () => {
  it('expect to return null if the PLR is malformed', () => {
    expect(getLogSnippet(null)).toBe(null);
    expect(getLogSnippet({})).toBe(null);
  });

  it('expect to not try to parse a PLR that has yet to start (lacks status)', () => {
    const pipelineRun: PipelineRun = {
      ...pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE].pipelineRuns[DataState.FAILED1],
    };
    delete pipelineRun.status;
    expect(getLogSnippet(pipelineRun)).toBe(null);
  });

  it('expect to not try to parse a running Pipeline', () => {
    const pipelineRun: PipelineRun =
      pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.IN_PROGRESS];
    expect(getLogSnippet(pipelineRun)).toBe(null);
  });

  it('expect to not try to parse a successfully completed Pipeline', () => {
    const pipelineRun: PipelineRun =
      pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS];
    expect(getLogSnippet(pipelineRun)).toBe(null);
  });

  it('expect to not try to parse a cancelled Pipeline', () => {
    const pipelineRun: PipelineRun = {
      ...pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE].pipelineRuns[DataState.CANCELLED1],
    };
    expect(getLogSnippet(pipelineRun)).toBe(null);
  });

  it('expect to handle invalid task reference Pipelines', () => {
    const pipelineRun: PipelineRun =
      pipelineTestData[PipelineExampleNames.INVALID_PIPELINE_MISSING_TASK].pipelineRuns[
        DataState.FAILED1
      ];
    expect(getLogSnippet(pipelineRun)).toEqual({
      staticMessage: pipelineRun.status.conditions[0].message,
      title: 'Failure - check logs for details.',
    });
  });

  it('expect to handle invalid task definition Pipelines', () => {
    const pipelineRun: PipelineRun =
      pipelineTestData[PipelineExampleNames.INVALID_PIPELINE_INVALID_TASK].pipelineRuns[
        DataState.FAILED1
      ];
    const taskRun = pipelineRun.status.taskRuns['new-pipeline-oxxhj5-git-clone-pwmmj'];
    expect(getLogSnippet(pipelineRun)).toEqual({
      staticMessage: taskRun.status.conditions[0].message,
      title: `Failure on task ${taskRun.pipelineTaskName} - check logs for details.`,
    });
  });

  it('expect to handle internal errors of the task Pipelines', () => {
    const pipelineRun: PipelineRun =
      pipelineTestData[PipelineExampleNames.BROKEN_MOCK_APP].pipelineRuns[DataState.FAILED1];
    const taskRun = pipelineRun.status.taskRuns['broken-app-pipeline-j2nxzm-x-compile-8mq2h'];
    expect(getLogSnippet(pipelineRun)).toEqual({
      containerName: taskRun.status.steps[0].container,
      podName: taskRun.status.podName,
      title: `Failure on task ${taskRun.pipelineTaskName} - check logs for details.`,
    });
  });
});

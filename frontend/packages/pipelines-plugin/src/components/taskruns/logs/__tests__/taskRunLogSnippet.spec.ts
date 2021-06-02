import { PipelineRunKind } from 'packages/pipelines-plugin/src/types';
import {
  pipelineTestData,
  PipelineExampleNames,
  DataState,
} from '../../../../test-data/pipeline-data';
import {
  ErrorDetailsWithStaticLog,
  ErrorDetailsWithLogName,
} from '../../../pipelineruns/logs/log-snippet-types';
import { getTRLogSnippet } from '../taskRunLogSnippet';

const taskRunMock = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE].taskRuns[0];
const plrWithFailedTaskRun =
  pipelineTestData[PipelineExampleNames.BROKEN_MOCK_APP].pipelineRuns[DataState.FAILED1];
const plrWithTaskRunTimeoutError =
  pipelineTestData[PipelineExampleNames.BROKEN_MOCK_APP].pipelineRuns[DataState.FAILED2];

const getFailedTaskRunStatus = (plr: PipelineRunKind) => {
  const [taskRunStatus] = Object.values(plr.status.taskRuns).filter((tr) =>
    tr?.status?.conditions?.find(
      (condition) => condition.type === 'Succeeded' && condition.status === 'False',
    ),
  );
  return taskRunStatus?.status;
};

describe('TaskRunLogSnippet test', () => {
  it('should return null for successful TaskRun', () => {
    const msg = getTRLogSnippet(taskRunMock);
    expect(msg).toEqual(null);
  });

  it('should return null if TaskRun value is null', () => {
    const msg = getTRLogSnippet(null);
    expect(msg).toEqual(null);
  });

  it('should return a Log message for failed TaskRun with task container', () => {
    const taskRunWithContainer = {
      ...taskRunMock,
      status: { ...getFailedTaskRunStatus(plrWithFailedTaskRun) },
    };
    const { title, containerName, podName } = getTRLogSnippet(
      taskRunWithContainer,
    ) as ErrorDetailsWithLogName;
    expect(title).toEqual('Failure on task {{taskName}} - check logs for details.');
    expect(containerName).toEqual('step-build');
    expect(podName).toEqual('broken-app-pipeline-j2nxzm-x-compile-8mq2h-pod-b9gsg');
  });

  it('should return a Log message for TaskRun with TaskRunTimeout reason', () => {
    const timeOutTaskRun = {
      ...taskRunMock,
      status: { ...getFailedTaskRunStatus(plrWithTaskRunTimeoutError) },
    };
    const { title, staticMessage } = getTRLogSnippet(timeOutTaskRun) as ErrorDetailsWithStaticLog;
    expect(title).toEqual('Failure on task {{taskName}} - check logs for details.');
    expect(staticMessage).toEqual(
      'TaskRun "fetch-and-print-recipe-test-fetch-the-recipe-5pb9p" failed to finish within "5s"',
    );
  });

  it('should return a static message', () => {
    const failedTaskRun = {
      ...taskRunMock,
      status: { ...getFailedTaskRunStatus(plrWithTaskRunTimeoutError) },
    };
    const { title, staticMessage } = getTRLogSnippet({
      ...taskRunMock,
      status: {
        ...failedTaskRun.status,
        conditions: [
          {
            ...failedTaskRun.status.conditions[0],
            status: 'False',
            message: '',
          },
        ],
      },
    }) as ErrorDetailsWithStaticLog;
    expect(title).toEqual('Failure on task {{taskName}} - check logs for details.');
    expect(staticMessage).toEqual('Unknown failure condition');
  });
});

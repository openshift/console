import {
  pipelineTestData,
  PipelineExampleNames,
  DataState,
} from '../../../../test-data/pipeline-data';
import { ErrorDetailsWithLogName, ErrorDetailsWithStaticLog } from '../log-snippet-types';
import { getPLRLogSnippet } from '../pipelineRunLogSnippet';

const pipelineRunMock =
  pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS];
const pipelineRunMockFailed =
  pipelineTestData[PipelineExampleNames.BROKEN_MOCK_APP].pipelineRuns[DataState.FAILED1];
const pipelineRunTimeoutError =
  pipelineTestData[PipelineExampleNames.BROKEN_MOCK_APP].pipelineRuns[DataState.FAILED2];

describe('PipelineRunLogSnippet test', () => {
  it('should return null for successful PLR', () => {
    const msg = getPLRLogSnippet(pipelineRunMock);
    expect(msg).toEqual(null);
  });

  it('should return null if PLR value is null', () => {
    const msg = getPLRLogSnippet(null);
    expect(msg).toEqual(null);
  });

  it('should return a Log message for failed PLR with task container', () => {
    const { title, containerName, podName } = getPLRLogSnippet(
      pipelineRunMockFailed,
    ) as ErrorDetailsWithLogName;
    expect(title).toEqual('Failure on task {{taskName}} - check logs for details.');
    expect(containerName).toEqual('step-build');
    expect(podName).toEqual('broken-app-pipeline-j2nxzm-x-compile-8mq2h-pod-b9gsg');
  });

  it('should return a Log message for PLR with PipelineRunTimeout reason', () => {
    const { title, staticMessage } = getPLRLogSnippet(
      pipelineRunTimeoutError,
    ) as ErrorDetailsWithStaticLog;
    expect(title).toEqual('Failure - check logs for details.');
    expect(staticMessage).toEqual(
      'PipelineRun "fetch-and-print-recipe-test" failed to finish within "5s"',
    );
  });

  it('should return a static message', () => {
    const { title, staticMessage } = getPLRLogSnippet({
      ...pipelineRunMock,
      status: {
        ...pipelineRunMock.status,
        conditions: [
          {
            ...pipelineRunMock.status.conditions[0],
            status: 'False',
            message: '',
          },
        ],
      },
    }) as ErrorDetailsWithStaticLog;
    expect(title).toEqual('Failure - check logs for details.');
    expect(staticMessage).toEqual('Unknown failure condition');
  });
});

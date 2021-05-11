import { ErrorDetailsWithLogName, ErrorDetailsWithStaticLog } from '../log-snippet-types';
import { getPLRLogSnippet } from '../pipelineRunLogSnippet';
import {
  pipelineTestData,
  PipelineExampleNames,
  DataState,
} from '../../../../test-data/pipeline-data';

const PipelineRunMock =
  pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS];
const PipelineRunMockFailed =
  pipelineTestData[PipelineExampleNames.BROKEN_MOCK_APP].pipelineRuns[DataState.FAILED1];

describe('PipelineRunLogSnippet test', () => {
  it('should return null for successful PLR', () => {
    const msg = getPLRLogSnippet(PipelineRunMock);
    expect(msg).toEqual(null);
  });
  it('should return a Log message for failed PLR with task container', () => {
    const { title, containerName, podName } = getPLRLogSnippet(
      PipelineRunMockFailed,
    ) as ErrorDetailsWithLogName;
    expect(title).toEqual('Failure on task {{taskName}} - check logs for details.');
    expect(containerName).toEqual('step-build');
    expect(podName).toEqual('broken-app-pipeline-j2nxzm-x-compile-8mq2h-pod-b9gsg');
  });
  it('should return a static message', () => {
    const { title, staticMessage } = getPLRLogSnippet({
      ...PipelineRunMock,
      status: {
        ...PipelineRunMock.status,
        conditions: [
          {
            ...PipelineRunMock.status.conditions[0],
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

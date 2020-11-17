import { TFunction } from 'i18next';
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

const t = (key: TFunction) => key;

describe('PipelineRunLogSnippet test', () => {
  it('should return null for successful PLR', () => {
    const msg = getPLRLogSnippet(PipelineRunMock, t);
    expect(msg).toEqual(null);
  });
  it('should return a Log message for failed PLR with task container', () => {
    const { title, containerName, podName } = getPLRLogSnippet(
      PipelineRunMockFailed,
      t,
    ) as ErrorDetailsWithLogName;
    expect(title).toEqual(
      'pipelines-plugin~Failure on task {{taskName}} - check logs for details.',
    );
    expect(containerName).toEqual('step-build');
    expect(podName).toEqual('broken-app-pipeline-j2nxzm-x-compile-8mq2h-pod-b9gsg');
  });
  it('should return a static message', () => {
    const { title, staticMessage } = getPLRLogSnippet(
      {
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
      },
      t,
    ) as ErrorDetailsWithStaticLog;
    expect(title).toEqual('pipelines-plugin~Failure - check logs for details.');
    expect(staticMessage).toEqual('pipelines-plugin~Unknown failure condition');
  });
});

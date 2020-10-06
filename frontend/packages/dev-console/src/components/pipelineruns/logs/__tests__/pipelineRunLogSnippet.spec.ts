import { PipelineRunMock } from './log-snippet-test-data';
import { ErrorDetailsWithLogName, ErrorDetailsWithStaticLog } from '../log-snippet-types';
import { getPLRLogSnippet } from '../pipelineRunLogSnippet';

describe('PipelineRunLogSnippet test', () => {
  it('should return null for successful PLR', () => {
    const msg = getPLRLogSnippet(PipelineRunMock[0]);
    expect(msg).toEqual(null);
  });
  it('should return a Log message for failed PLR with task container', () => {
    const { title, containerName, podName } = getPLRLogSnippet(
      PipelineRunMock[1],
    ) as ErrorDetailsWithLogName;
    expect(title).toEqual('Failure on task task1 - check logs for details.');
    expect(containerName).toEqual('container1');
    expect(podName).toEqual('pod1');
  });
  it('should return a static message', () => {
    const { title, staticMessage } = getPLRLogSnippet(
      PipelineRunMock[2],
    ) as ErrorDetailsWithStaticLog;
    expect(title).toEqual('Failure on task task1 - check logs for details.');
    expect(staticMessage).toEqual('Unknown failure condition');
  });
});

import { ErrorDetailsWithLogName, ErrorDetailsWithStaticLog } from '../log-snippet-types';
import { taskRunSnippetMessage } from '../log-snippet-utils';
import { LogSnippetTaskData } from './log-snippet-test-data';

const testContainer = 'container-B';

describe('LogSnippet utils test', () => {
  it('should return title and static message for no container', () => {
    const { title, staticMessage } = taskRunSnippetMessage(
      LogSnippetTaskData[0].metadata.name,
      LogSnippetTaskData[0].status,
      null,
    ) as ErrorDetailsWithStaticLog;
    expect(title).toEqual('Failure on task {{taskName}} - check logs for details.');
    expect(staticMessage).toEqual('Unknown failure condition');
  });

  it('should return title and static message for no pod', () => {
    const { title, staticMessage } = taskRunSnippetMessage(
      LogSnippetTaskData[0].metadata.name,
      LogSnippetTaskData[0].status,
      testContainer,
    ) as ErrorDetailsWithStaticLog;
    expect(title).toEqual('Failure on task {{taskName}} - check logs for details.');
    expect(staticMessage).toEqual('Unknown failure condition');
  });

  it('should return title from task metadata, pod and container', () => {
    const { title, podName, containerName } = taskRunSnippetMessage(
      LogSnippetTaskData[1].metadata.name,
      LogSnippetTaskData[1].status,
      testContainer,
    ) as ErrorDetailsWithLogName;
    expect(title).toEqual('Failure on task {{taskName}} - check logs for details.');
    expect(podName).toEqual(LogSnippetTaskData[1].status.podName);
    expect(containerName).toEqual(testContainer);
  });
});

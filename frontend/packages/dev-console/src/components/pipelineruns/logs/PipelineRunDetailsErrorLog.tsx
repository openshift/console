import * as React from 'react';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { getLogSnippet } from './pipelineRunLogSnippet';
import LogSnippetFromPod from './LogSnippetFromPod';

type PipelineStatusLogProps = {
  pipelineRun: PipelineRun;
};

const PipelineRunDetailsErrorLog: React.FC<PipelineStatusLogProps> = ({ pipelineRun }) => {
  const logDetails = getLogSnippet(pipelineRun);

  if (!logDetails) {
    return null;
  }

  return (
    <>
      <dl>
        <dt>Message</dt>
        <dd>{logDetails.title}</dd>
      </dl>
      <dl>
        <dt>Log Snippet</dt>
        <dd>
          {'podName' in logDetails ? (
            <LogSnippetFromPod
              containerName={logDetails.containerName}
              namespace={pipelineRun.metadata.namespace}
              podName={logDetails.podName}
              title={logDetails.title}
            />
          ) : (
            <pre>{logDetails.staticMessage}</pre>
          )}
        </dd>
      </dl>
    </>
  );
};

export default PipelineRunDetailsErrorLog;

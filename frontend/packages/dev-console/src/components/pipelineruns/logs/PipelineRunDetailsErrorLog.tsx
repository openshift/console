import * as React from 'react';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { getLogSnippet } from './pipelineRunLogSnippet';
import LogSnippetBlock from './LogSnippetBlock';

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
          <LogSnippetBlock logDetails={logDetails} pipelineRun={pipelineRun}>
            {(logSnippet: string) => <pre>{logSnippet}</pre>}
          </LogSnippetBlock>
        </dd>
      </dl>
    </>
  );
};

export default PipelineRunDetailsErrorLog;

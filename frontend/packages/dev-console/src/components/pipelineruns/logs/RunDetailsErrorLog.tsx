import * as React from 'react';
import LogSnippetBlock from './LogSnippetBlock';
import { CombinedErrorDetails } from './log-snippet-types';

type RunDetailErrorLogProps = {
  logDetails: CombinedErrorDetails;
  namespace: string;
};

const RunDetailsErrorLog: React.FC<RunDetailErrorLogProps> = ({ logDetails, namespace }) => {
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
          <LogSnippetBlock logDetails={logDetails} namespace={namespace}>
            {(logSnippet: string) => <pre>{logSnippet}</pre>}
          </LogSnippetBlock>
        </dd>
      </dl>
    </>
  );
};

export default RunDetailsErrorLog;

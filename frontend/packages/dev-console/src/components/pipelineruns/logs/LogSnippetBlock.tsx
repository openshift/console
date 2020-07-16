import * as React from 'react';
import { PipelineRun } from '../../../utils/pipeline-augment';
import LogSnippetFromPod from './LogSnippetFromPod';
import { PipelineRunErrorDetails } from './pipelineRunLogSnippet';

type LogSnippetBlockProps = {
  children: (logSnippet: string) => React.ReactNode;
  logDetails: PipelineRunErrorDetails;
  pipelineRun: PipelineRun;
};

const LogSnippetBlock: React.FC<LogSnippetBlockProps> = ({ children, logDetails, pipelineRun }) => {
  return 'podName' in logDetails ? (
    <LogSnippetFromPod
      containerName={logDetails.containerName}
      namespace={pipelineRun.metadata.namespace}
      podName={logDetails.podName}
      title={logDetails.title}
    >
      {children}
    </LogSnippetFromPod>
  ) : (
    <>{children(logDetails.staticMessage)}</>
  );
};

export default LogSnippetBlock;

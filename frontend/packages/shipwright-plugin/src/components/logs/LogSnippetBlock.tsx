import type { FC, ReactNode } from 'react';
import type { CombinedErrorDetails } from './log-snippet-types';
import LogSnippetFromPod from './LogSnippetFromPod';

type LogSnippetBlockProps = {
  children: (logSnippet: string) => ReactNode;
  logDetails: CombinedErrorDetails;
  namespace: string;
};

const LogSnippetBlock: FC<LogSnippetBlockProps> = ({ children, logDetails, namespace }) => {
  return 'podName' in logDetails ? (
    <LogSnippetFromPod
      containerName={logDetails.containerName}
      namespace={namespace}
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

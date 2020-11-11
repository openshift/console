import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { coFetchText } from '@console/internal/co-fetch';
import { resourceURL } from '@console/internal/module/k8s';
import { PodModel } from '@console/internal/models';
import { LoadingInline } from '@console/internal/components/utils';

type LogSnippetFromPodProps = {
  children: (logSnippet: string) => React.ReactNode;
  containerName: string;
  namespace: string;
  podName: string;
  title: string;
};

const LogSnippetFromPod: React.FC<LogSnippetFromPodProps> = ({
  children,
  containerName,
  namespace,
  podName,
  title,
}) => {
  const [logSnippet, setLogSnippet] = React.useState<string>(null);
  const [logError, setLogError] = React.useState<string>(null);

  React.useEffect(() => {
    const urlOpts = {
      ns: namespace,
      name: podName,
      path: 'log',
      queryParams: {
        container: containerName,
        tailLines: '5',
      },
    };
    const watchURL = resourceURL(PodModel, urlOpts);
    coFetchText(watchURL)
      .then((logContent: string) => {
        setLogSnippet(logContent);
      })
      .catch((error) => {
        setLogError(error?.message || 'Unknown error retrieving logs');
      });
  }, [containerName, namespace, podName]);

  if (logError) {
    return (
      <Alert isInline title={title} variant="danger">
        {logError}
      </Alert>
    );
  }

  if (!logSnippet) {
    return <LoadingInline />;
  }

  return <>{children(logSnippet)}</>;
};

export default LogSnippetFromPod;

import type { ReactNode, FC } from 'react';
import { useState, useEffect } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { coFetchText } from '@console/internal/co-fetch';
import { LoadingInline } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { resourceURL } from '@console/internal/module/k8s';

type LogSnippetFromPodProps = {
  children: (logSnippet: string) => ReactNode;
  containerName: string;
  namespace: string;
  podName: string;
  title: string;
};

const LogSnippetFromPod: FC<LogSnippetFromPodProps> = ({
  children,
  containerName,
  namespace,
  podName,
  title,
}) => {
  const { t } = useTranslation();
  const [logSnippet, setLogSnippet] = useState<string>(null);
  const [logError, setLogError] = useState<string>(null);

  useEffect(() => {
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
        setLogError(error?.message || t('shipwright-plugin~Unknown error retrieving logs'));
      });
  }, [containerName, namespace, podName, t]);

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

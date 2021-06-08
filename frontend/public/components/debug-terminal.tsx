import * as _ from 'lodash-es';
import * as React from 'react';
import Helmet from 'react-helmet';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';
import { PodKind, k8sCreate, k8sKillByName } from '@console/internal/module/k8s';
import { PodExecLoader } from '@console/internal/components/pod';
import { PodModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import { resourcePath } from './utils/resource-link';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import { isWindowsPod } from '../module/k8s/pods';

const getDebugPod = (debugPodName: string, podToDebug: PodKind, containerName: string) => {
  const debugPod: PodKind = _.cloneDeep(podToDebug);
  delete debugPod.metadata.resourceVersion;
  delete debugPod.metadata.uid;
  delete debugPod.metadata.managedFields;
  delete debugPod.metadata.name;
  debugPod.metadata.generateName = debugPodName;
  debugPod.metadata.annotations['debug.openshift.io/source-container'] = containerName;
  debugPod.metadata.annotations[
    'debug.openshift.io/source-resource'
  ] = `/v1, Resource=pods/${podToDebug?.metadata?.name}`;
  debugPod.spec.restartPolicy = 'Never';

  debugPod.spec.containers.forEach((container) => {
    container.command = isWindowsPod(podToDebug) ? ['cmd'] : ['/bin/sh'];
    container.stdin = true;
    container.stdinOnce = true;
    container.tty = true;
    delete container?.readinessProbe;
    delete container?.livenessProbe;
  });
  delete debugPod.spec.host;
  delete debugPod.spec.nodeName;
  delete debugPod.status;

  return debugPod;
};

const DebugTerminalError: React.FC<DebugTerminalErrorProps> = ({ error, description }) => {
  return (
    <div className="co-m-pane__body">
      <Alert variant="danger" isInline title={error}>
        <p>{description}</p>
      </Alert>
    </div>
  );
};

const DebugTerminalInner: React.FC<DebugTerminalInnerProps> = ({ debugPod, initialContainer }) => {
  const { t } = useTranslation();
  const infoMessage = (
    <div className="co-terminal-info-message">
      <Alert
        variant="info"
        isInline
        title={t(
          'public~This temporary pod has a modified entrypoint command to debug a failing container. The pod will be deleted when the terminal window is closed.',
        )}
      />
    </div>
  );
  switch (debugPod?.status?.phase) {
    case 'Failed':
    case 'Unknown':
      return (
        <DebugTerminalError
          error={<>{t('public~The debug pod failed. ')}</>}
          description={
            debugPod.status.containerStatuses?.[0]?.state?.terminated?.message ||
            debugPod.status.message
          }
        />
      );
    case 'Running':
      return (
        <PodExecLoader
          obj={debugPod}
          initialContainer={initialContainer}
          infoMessage={infoMessage}
        />
      );
    case 'Pending':
      return (
        <LoadingBox message={debugPod.status.phase}>
          {debugPod.status?.containerStatuses?.[0]?.state?.waiting?.message ||
            debugPod.status?.message}
        </LoadingBox>
      );
    default:
      return <LoadingBox />;
  }
};

export const DebugTerminal: React.FC<DebugTerminalProps> = ({ podData, containerName }) => {
  const [errorMessage, setErrorMessage] = React.useState('');
  const [generatedDebugPodName, setGeneratedDebugPodName] = React.useState('');
  const podNamespace = podData?.metadata.namespace;
  const podContainerName = containerName || podData?.spec.containers[0].name;
  const debugPodName = `${podData?.metadata.name}-debug-`;
  const podToCreate = React.useMemo(() => {
    return getDebugPod(debugPodName, podData, podContainerName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debugPodName, podContainerName]);

  React.useEffect(() => {
    const deleteDebugPod = async (podToDelete) => {
      try {
        await k8sKillByName(PodModel, podToDelete, podNamespace);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Could not delete container terminal debug pod.', e);
      }
    };
    let newDebugPod;
    const createDebugPod = async () => {
      try {
        newDebugPod = await k8sCreate(PodModel, podToCreate);
        setGeneratedDebugPodName(newDebugPod?.metadata?.name);
      } catch (e) {
        setErrorMessage(e.message);
      }
    };
    createDebugPod();

    window.addEventListener('beforeunload', deleteDebugPod);
    return () => {
      if (newDebugPod) {
        deleteDebugPod(newDebugPod.metadata.name);
      }
      window.removeEventListener('beforeunload', deleteDebugPod);
    };
  }, [debugPodName, podNamespace, podToCreate]);

  const [debugPod, loaded, err] = useK8sWatchResource<PodKind>(
    generatedDebugPodName
      ? {
          isList: false,
          kind: 'Pod',
          name: generatedDebugPodName,
          namespace: podNamespace,
        }
      : {},
  );

  if (errorMessage) {
    return <DebugTerminalError error={errorMessage} />;
  }

  if (generatedDebugPodName) {
    if (err) {
      return <DebugTerminalError error={err} />;
    }
    if (loaded) {
      return <DebugTerminalInner initialContainer={containerName} debugPod={debugPod} />;
    }
  }

  return <LoadingBox />;
};

export const DebugTerminalPage: React.FC<DebugTerminalPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const {
    params: { podName, ns, name },
    url,
  } = match;

  const [podData, loaded, err] = useK8sWatchResource<PodKind>({
    isList: false,
    kind: 'Pod',
    name: podName,
    namespace: ns,
  });

  return (
    <div>
      <Helmet>
        <title>{t('public~Debug {{name}}', { name })}</title>
      </Helmet>
      <PageHeading
        detail
        title={t('public~Debug {{name}}', { name })}
        kind="Pod"
        obj={{ data: podData }}
        breadcrumbs={[
          { name: t('public~Pods'), path: getBreadcrumbPath(match, 'pods') },
          {
            name: podName,
            path: resourcePath('Pod', podName, ns),
          },
          {
            name: t('public~Container details'),
            path: `${resourcePath('Pod', podName, ns)}/containers/${name}`,
          },
          { name: t('public~Debug container'), path: url },
        ]}
      />
      {loaded && !err && <DebugTerminal podData={podData} containerName={name} />}
      {err && <LoadingBox message={err} />}
      {!loaded && <LoadingBox />}
    </div>
  );
};

DebugTerminalPage.displayName = 'DebugTerminalPage';

type DebugTerminalErrorProps = {
  error: React.ReactNode;
  description?: string;
};

type DebugTerminalInnerProps = {
  debugPod: PodKind;
  initialContainer?: string;
};

type DebugTerminalProps = {
  podData: PodKind;
  containerName: string;
};

type DebugTerminalPageProps = {
  match: any;
  obj: PodKind;
};

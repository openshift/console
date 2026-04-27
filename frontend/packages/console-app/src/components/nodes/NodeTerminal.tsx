import type { ReactNode, FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { PodConnectLoader } from '@console/internal/components/pod';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { ImageStreamTagModel, NamespaceModel, PodModel } from '@console/internal/models';
import type { NodeKind, PodKind } from '@console/internal/module/k8s';
import { k8sCreate, k8sGet, k8sKillByName } from '@console/internal/module/k8s';
import store from '@console/internal/redux';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { getDetachedSessions } from '@console/webterminal-plugin/src/redux/reducers/cloud-shell-selectors';

type NodeTerminalErrorProps = {
  error: ReactNode;
};

type NodeTerminalInnerProps = {
  pod?: PodKind;
  loaded: boolean;
  loadError?: unknown;
  debugNamespace?: string;
};

type NodeTerminalProps = {
  obj: NodeKind;
};

const getDebugImage = async (): Promise<string> => {
  try {
    const istag = await k8sGet(ImageStreamTagModel, 'tools:latest', 'openshift');
    return istag.image.dockerImageReference;
  } catch (e) {
    return 'registry.redhat.io/rhel8/support-tools';
  }
};

const getDebugPod = async (
  name: string,
  namespace: string,
  nodeName: string,
  isWindows: boolean,
): Promise<PodKind> => {
  const image = await getDebugImage();
  // configuration as specified in https://github.com/openshift/oc/blob/master/pkg/cli/debug/debug.go#L1024-L1114
  const template: PodKind = {
    kind: 'Pod',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace,
      annotations: {
        'debug.openshift.io/source-container': 'container-00',
        'debug.openshift.io/source-resource': `/v1, Resource=nodes/${nodeName}`,
        'openshift.io/scc': 'privileged',
      },
    },
    spec: {
      containers: [
        {
          command: ['/bin/sh'],
          env: [
            {
              // Set the Shell variable to auto-logout after 15m idle timeout
              name: 'TMOUT',
              value: '900',
            },
            {
              // this env requires to be set in order to collect more sos reports
              name: 'HOST',
              value: '/host',
            },
          ],
          image,
          name: 'container-00',
          resources: {},
          securityContext: {
            privileged: true,
            runAsUser: 0,
          },
          stdin: true,
          stdinOnce: false,
          tty: true,
          volumeMounts: [
            {
              name: 'host',
              mountPath: '/host',
            },
          ],
        },
      ],
      hostIPC: true,
      hostPID: true,
      hostNetwork: true,
      nodeName,
      restartPolicy: 'Never',
      volumes: [
        {
          name: 'host',
          hostPath: {
            path: '/',
            type: 'Directory',
          },
        },
      ],
    },
  };

  if (isWindows) {
    template.spec.OS = 'windows';
    template.spec.hostPID = false;
    template.spec.hostIPC = false;
    const containerUser = 'ContainerUser';
    template.spec.containers[0].securityContext = {
      windowsOptions: {
        runAsUserName: containerUser,
      },
    };
  }
  return template;
};

const NodeTerminalError: FC<NodeTerminalErrorProps> = ({ error }) => {
  return (
    <PaneBody>
      <Alert variant="danger" isInline title={error} data-test="node-terminal-error" />
    </PaneBody>
  );
};

const NodeTerminalInner: FC<NodeTerminalInnerProps> = ({
  pod,
  loaded,
  loadError,
  debugNamespace,
}) => {
  const { t } = useTranslation();
  const message = (
    <Trans t={t} ns="console-app">
      <p>
        To use host binaries, run <code className="co-code">chroot /host</code>
      </p>
    </Trans>
  );

  if (loadError) {
    return (
      <NodeTerminalError
        error={loadError instanceof Error ? loadError.message : String(loadError)}
      />
    );
  }

  if (!loaded) {
    return <LoadingBox />;
  }

  if (!pod) {
    return <NodeTerminalError error={t('console-app~Debug pod not found or was deleted.')} />;
  }

  switch (pod?.status?.phase) {
    case 'Failed':
      return (
        <NodeTerminalError
          error={
            <>
              {t('console-app~The debug pod failed. ')}
              {pod?.status?.containerStatuses?.[0]?.state?.terminated?.message ||
                pod?.status?.message}
            </>
          }
        />
      );
    case 'Running':
      return (
        <PodConnectLoader
          obj={pod}
          message={message}
          attach
          cleanupOnDetach={debugNamespace ? { type: 'namespace', name: debugNamespace } : undefined}
        />
      );
    default:
      return <LoadingBox />;
  }
};

const NodeTerminal: FC<NodeTerminalProps> = ({ obj: node }) => {
  const [podName, setPodName] = useState<string>('');
  const [podNamespace, setPodNamespace] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const nodeName = node.metadata.name;
  const isWindows = node.status?.nodeInfo?.operatingSystem === 'windows';

  const watchResource = useMemo(
    () =>
      podName && podNamespace
        ? {
            isList: false,
            kind: 'Pod',
            name: podName,
            namespace: podNamespace,
          }
        : null,
    [podName, podNamespace],
  );

  const [pod, loaded, loadError] = useK8sWatchResource<PodKind>(watchResource);

  useEffect(() => {
    let namespace;
    const name = `${nodeName?.replace(/\./g, '-')}-debug`;
    const deleteNamespace = async (ns) => {
      try {
        await k8sKillByName(NamespaceModel, ns);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Could not delete node terminal debug namespace.', e);
      }
    };
    const closeTab = (event) => {
      event.preventDefault();
      const detached = getDetachedSessions(store.getState());
      if (!detached.some((s) => s.podName === name)) {
        deleteNamespace(namespace.metadata.name);
      }
    };
    const createDebugPod = async () => {
      try {
        namespace = await k8sCreate(NamespaceModel, {
          metadata: {
            generateName: 'openshift-debug-',
            labels: {
              'openshift.io/run-level': '0',
              'pod-security.kubernetes.io/audit': 'privileged',
              'pod-security.kubernetes.io/enforce': 'privileged',
              'pod-security.kubernetes.io/warn': 'privileged',
              'security.openshift.io/scc.podSecurityLabelSync': 'false',
            },
            annotations: {
              'openshift.io/node-selector': '',
            },
          },
        });
        const podToCreate = await getDebugPod(name, namespace.metadata.name, nodeName, isWindows);
        // wait for the namespace to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const debugPod = await k8sCreate(PodModel, podToCreate);
        if (debugPod) {
          setPodName(name);
          setPodNamespace(namespace.metadata.name);
        }
      } catch (e) {
        setErrorMessage(e.message);
        if (namespace) {
          deleteNamespace(namespace.metadata.name);
        }
      }
    };
    createDebugPod();
    window.addEventListener('beforeunload', closeTab);
    return () => {
      const detached = getDetachedSessions(store.getState());
      const isDetached = detached.some((s) => s.podName === name);
      if (!isDetached) {
        deleteNamespace(namespace.metadata.name);
      }
      window.removeEventListener('beforeunload', closeTab);
    };
  }, [nodeName, isWindows]);

  return errorMessage ? (
    <NodeTerminalError error={errorMessage} />
  ) : (
    <NodeTerminalInner
      pod={pod}
      loaded={loaded}
      loadError={loadError}
      debugNamespace={podNamespace}
    />
  );
};

export default NodeTerminal;

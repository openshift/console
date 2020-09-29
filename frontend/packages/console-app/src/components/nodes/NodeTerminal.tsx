import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import {
  Firehose,
  FirehoseResource,
  FirehoseResult,
  LoadingBox,
} from '@console/internal/components/utils';
import { NodeKind, PodKind } from '@console/internal/module/k8s';
import { PodExecLoader } from '../../../../../public/components/pod';
import { ImageStreamTagModel, NamespaceModel, PodModel } from '../../../../../public/models';
import { k8sCreate, k8sGet, k8sKillByName } from '../../../../../public/module/k8s';

type NodeTerminalErrorProps = {
  error: React.ReactNode;
};

type NodeTerminalInnerProps = {
  obj?: FirehoseResult<PodKind>;
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

const getDebugPod = async (name: string, namespace: string, nodeName: string): Promise<PodKind> => {
  const image = await getDebugImage();
  return {
    kind: 'Pod',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace,
      annotations: {
        'debug.openshift.io/source-container': 'container-00',
        'debug.openshift.io/source-resource': `/v1, Resource=nodes/${nodeName}`,
      },
    },
    spec: {
      activeDeadlineSeconds: 21600,
      volumes: [
        {
          name: 'host',
          hostPath: {
            path: '/',
            type: 'Directory',
          },
        },
      ],
      containers: [
        {
          name: 'container-00',
          image,
          command: ['/bin/sh'],
          resources: {},
          volumeMounts: [
            {
              name: 'host',
              mountPath: '/host',
            },
          ],
          securityContext: {
            privileged: true,
            runAsUser: 0,
          },
          stdin: true,
          stdinOnce: true,
          tty: true,
        },
      ],
      restartPolicy: 'Never',
      nodeName,
      hostNetwork: true,
      hostPID: true,
    },
  };
};

const NodeTerminalError: React.FC<NodeTerminalErrorProps> = ({ error }) => {
  return (
    <div className="co-m-pane__body">
      <Alert variant="danger" isInline title={error} />
    </div>
  );
};

const NodeTerminalInner: React.FC<NodeTerminalInnerProps> = ({ obj }) => {
  const message = (
    <p>
      To use host binaries, run <code>chroot /host</code>
    </p>
  );
  switch (obj?.data?.status?.phase) {
    case 'Failed':
      return (
        <NodeTerminalError
          error={
            <>
              The debug pod failed.{' '}
              {obj?.data?.status?.containerStatuses?.[0]?.state?.terminated?.message ||
                obj?.data?.status?.message}
            </>
          }
        />
      );
    case 'Running':
      return <PodExecLoader obj={obj.data} message={message} />;
    default:
      return <LoadingBox />;
  }
};

const NodeTerminal: React.FC<NodeTerminalProps> = ({ obj: node }) => {
  const [resources, setResources] = React.useState<FirehoseResource[]>([]);
  const [errorMessage, setErrorMessage] = React.useState('');
  const nodeName = node.metadata.name;
  React.useEffect(() => {
    let namespace;
    const name = `${nodeName}-debug`;
    const deleteNamespace = async (ns) => {
      try {
        await k8sKillByName(NamespaceModel, ns);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Could not delete node terminal debug namespace.', e);
      }
    };
    const createDebugPod = async () => {
      try {
        namespace = await k8sCreate(NamespaceModel, {
          metadata: {
            generateName: 'openshift-debug-node-',
            labels: {
              'openshift.io/run-level': '0',
            },
            annotations: {
              'openshift.io/node-selector': '',
            },
          },
        });
        const podToCreate = await getDebugPod(name, namespace.metadata.name, nodeName);
        // wait for the namespace to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const debugPod = await k8sCreate(PodModel, podToCreate);
        if (debugPod) {
          setResources([
            {
              isList: false,
              kind: 'Pod',
              name,
              namespace: namespace.metadata.name,
              prop: 'obj',
            },
          ]);
        }
      } catch (e) {
        setErrorMessage(e.message);
        if (namespace) {
          deleteNamespace(namespace.metadata.name);
        }
      }
    };
    createDebugPod();
    window.addEventListener('beforeunload', deleteNamespace);
    return () => {
      deleteNamespace(namespace.metadata.name);
      window.removeEventListener('beforeunload', deleteNamespace);
    };
  }, [nodeName]);

  return errorMessage ? (
    <NodeTerminalError error={errorMessage} />
  ) : (
    <Firehose resources={resources}>
      <NodeTerminalInner />
    </Firehose>
  );
};

export default NodeTerminal;

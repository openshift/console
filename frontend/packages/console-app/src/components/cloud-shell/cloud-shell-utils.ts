import { K8sResourceKind } from '@console/internal/module/k8s';
import { getRandomChars } from '@console/shared';
import { coFetchJSON, coFetch } from '@console/internal/co-fetch';

type environment = {
  value: string;
  name: string;
};

type DevfileComponent = {
  type?: string;
  id?: string;
  memoryLimit?: string;
  alias?: string;
  image?: string;
  args?: string[];
  env?: environment[];
};

interface Devfile {
  metadata: {
    name: string;
  };
  components: DevfileComponent[];
  apiVersion?: string;
}

export type CloudShellResource = K8sResourceKind & {
  status?: {
    phase: string;
    ideUrl: string;
  };
  spec?: {
    started?: boolean;
    devfile?: Devfile;
  };
};

export type TerminalInitData = { pod: string; container: string; cmd: string[] };

export const CLOUD_SHELL_LABEL = 'console.openshift.io/terminal';
export const CLOUD_SHELL_CREATOR_LABEL = 'org.eclipse.che.workspace/creator';
export const CLOUD_SHELL_IMMUTABLE_ANNOTATION = 'org.eclipse.che.workspace/immutable';

export const createCloudShellResourceName = () => `terminal-${getRandomChars(6)}`;

export const newCloudShellWorkSpace = (name: string, namespace: string): CloudShellResource => ({
  apiVersion: 'workspace.che.eclipse.org/v1alpha1',
  kind: 'Workspace',
  metadata: {
    name,
    namespace,
    labels: {
      [CLOUD_SHELL_LABEL]: 'true',
    },
    annotations: {
      [CLOUD_SHELL_IMMUTABLE_ANNOTATION]: 'true',
    },
  },
  spec: {
    started: true,
    devfile: {
      apiVersion: '1.0.0',
      metadata: {
        name: 'command-line-terminal',
      },
      components: [
        {
          alias: 'command-line-terminal',
          type: 'cheEditor',
          id: 'che-incubator/command-line-terminal/4.5.0',
        },
      ],
    },
  },
});

export const initTerminal = (
  username: string,
  workspaceName: string,
  workspaceNamespace: string,
): Promise<TerminalInitData> => {
  const url = `/api/terminal/proxy/${workspaceNamespace}/${workspaceName}/exec/init`;
  const payload = {
    kubeconfig: {
      username,
      namespace: workspaceNamespace,
    },
  };
  return coFetchJSON.post(url, payload);
};

export const sendActivityTick = (workspaceName: string, namespace: string): void => {
  coFetch(`/api/terminal/proxy/${namespace}/${workspaceName}/activity/tick`, { method: 'POST' });
};

export const checkTerminalAvailable = () => coFetch('/api/terminal/available');

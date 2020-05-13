import { K8sResourceKind } from '@console/internal/module/k8s';
import { getRandomChars } from '@console/shared';
import { coFetchJSON } from '@console/internal/co-fetch';

export type InitResponseObject = { pod: string; container: string; cmd: string[] };

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

export const CLOUD_SHELL_LABEL = 'console.openshift.io/cloudshell';
export const CLOUD_SHELL_USER_ANNOTATION = 'console.openshift.io/cloudshell-user';

export const createCloudShellResourceName = () => `terminal-${getRandomChars(6)}`;

export const newCloudShellWorkSpace = (
  name: string,
  namespace: string,
  username: string,
): CloudShellResource => ({
  apiVersion: 'workspace.che.eclipse.org/v1alpha1',
  kind: 'Workspace',
  metadata: {
    name,
    namespace,
    labels: {
      [CLOUD_SHELL_LABEL]: 'true',
    },
    annotations: {
      [CLOUD_SHELL_USER_ANNOTATION]: username,
    },
  },
  spec: {
    started: true,
    devfile: {
      apiVersion: '1.0.0',
      metadata: {
        name,
      },
      components: [
        {
          alias: 'command-line-terminal',
          type: 'cheEditor',
          id: 'che-incubator/command-line-terminal/4.5.0',
        },
        {
          type: 'dockerimage',
          memoryLimit: '256Mi',
          alias: 'dev',
          image: 'registry.redhat.io/codeready-workspaces/plugin-openshift-rhel8:2.1',
          args: ['tail', '-f', '/dev/null'],
          env: [
            {
              value: '\\[\\e[34m\\]>\\[\\e[m\\]\\[\\e[33m\\]>\\[\\e[m\\]',
              name: 'PS1',
            },
          ],
        },
      ],
    },
  },
});

export const initTerminal = (
  username: string,
  workspaceName: string,
  workspaceNamespace: string,
): Promise<InitResponseObject> => {
  const consumeUrl = `/api/terminal/${workspaceNamespace}/${workspaceName}/exec/init`;
  return coFetchJSON.post(consumeUrl, {
    kubeconfig: {
      username,
      namespace: workspaceNamespace,
    },
  });
};

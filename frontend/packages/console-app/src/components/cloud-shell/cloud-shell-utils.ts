import { K8sResourceKind, k8sPatch } from '@console/internal/module/k8s';
import { STORAGE_PREFIX, getRandomChars } from '@console/shared';
import { coFetchJSON, coFetch } from '@console/internal/co-fetch';
import { WorkspaceModel } from '../../models';

const CLOUD_SHELL_NAMESPACE = `${STORAGE_PREFIX}/command-line-terminal-namespace`;

type DevWorkspaceTemplateSpec = {
  components: Component[];
};

type Component = {
  plugin: {
    name?: string;
    id: string;
  };
};

export type CloudShellResource = K8sResourceKind & {
  status?: {
    phase: string;
    ideUrl: string;
  };
  spec?: {
    started?: boolean;
    routingClass?: string;
    template?: DevWorkspaceTemplateSpec;
  };
};

export type TerminalInitData = { pod: string; container: string; cmd: string[] };

export const CLOUD_SHELL_LABEL = 'console.openshift.io/terminal';
export const CLOUD_SHELL_CREATOR_LABEL = 'controller.devfile.io/creator';
export const CLOUD_SHELL_RESTRICTED_ANNOTATION = 'controller.devfile.io/restricted-access';

export const createCloudShellResourceName = () => `terminal-${getRandomChars(6)}`;

export const newCloudShellWorkSpace = (name: string, namespace: string): CloudShellResource => ({
  apiVersion: 'workspace.devfile.io/v1alpha1',
  kind: 'DevWorkspace',
  metadata: {
    name,
    namespace,
    labels: {
      [CLOUD_SHELL_LABEL]: 'true',
    },
    annotations: {
      [CLOUD_SHELL_RESTRICTED_ANNOTATION]: 'true',
    },
  },
  spec: {
    started: true,
    routingClass: 'web-terminal',
    template: {
      components: [
        {
          plugin: {
            name: 'web-terminal',
            id: 'redhat-developer/web-terminal/4.5.0',
          },
        },
      ],
    },
  },
});

export const startWorkspace = (workspace: CloudShellResource) => {
  return k8sPatch(WorkspaceModel, workspace, [
    {
      path: '/spec/started',
      op: 'replace',
      value: true,
    },
  ]);
};

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

export const getCloudShellNamespace = () => localStorage.getItem(CLOUD_SHELL_NAMESPACE);
export const setCloudShellNamespace = (namespace: string) => {
  if (!namespace) {
    localStorage.removeItem(CLOUD_SHELL_NAMESPACE);
  } else {
    localStorage.setItem(CLOUD_SHELL_NAMESPACE, namespace);
  }
};

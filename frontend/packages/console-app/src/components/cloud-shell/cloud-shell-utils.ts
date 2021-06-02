import { K8sResourceKind, k8sPatch, k8sGet } from '@console/internal/module/k8s';
import { getRandomChars } from '@console/shared';
import { coFetchJSON, coFetch } from '@console/internal/co-fetch';
import { WorkspaceModel } from '../../models';

type DevWorkspaceTemplateSpec = {
  components: Component[];
};

type Component = {
  name: string;
  plugin: {
    kubernetes: {
      name: string;
      namespace?: string;
    };
  };
};

export type CloudShellResource = K8sResourceKind & {
  status?: {
    phase: string;
    mainUrl: string;
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
export const CLOUD_SHELL_STOPPED_BY_ANNOTATION = 'controller.devfile.io/stopped-by';
export const CLOUD_SHELL_PROTECTED_NAMESPACE = 'openshift-terminal';

export const createCloudShellResourceName = () => `terminal-${getRandomChars(6)}`;

export const newCloudShellWorkSpace = (name: string, namespace: string): CloudShellResource => ({
  apiVersion: 'workspace.devfile.io/v1alpha2',
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
          name: 'web-terminal-tooling',
          plugin: {
            kubernetes: {
              name: 'web-terminal-tooling',
              namespace: 'openshift-operators',
            },
          },
        },
        {
          name: 'web-terminal-exec',
          plugin: {
            kubernetes: {
              name: 'web-terminal-exec',
              namespace: 'openshift-operators',
            },
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

export const getCloudShellCR = (name: string, ns: string) => {
  return k8sGet(WorkspaceModel, name, ns);
};

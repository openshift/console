import * as React from 'react';
import { K8sResourceKind, k8sPatch, k8sGet, K8sKind } from '@console/internal/module/k8s';
import { getRandomChars } from '@console/shared';
import { coFetchJSON, coFetch } from '@console/internal/co-fetch';
import { v1alpha1WorkspaceModel, WorkspaceModel } from '../../models';
import { useSafetyFirst } from '@console/internal/components/safety-first';

type v1alpha1Component = {
  plugin: {
    name?: string;
    id: string;
  };
};

type v1alpha2Component = {
  name: string;
  plugin: {
    kubernetes: {
      name: string;
      namespace?: string;
    };
  };
};

type DevWorkspaceTemplateSpec = {
  components: v1alpha1Component[] | v1alpha2Component[];
};

export type CloudShellResource = K8sResourceKind & {
  status?: v1alpha1CloudShellStatusResource | v1alpha2CloudShellStatusResource;
  spec?: {
    started?: boolean;
    routingClass?: string;
    template?: DevWorkspaceTemplateSpec;
  };
};

type v1alpha1CloudShellStatusResource = {
  phase: string;
  ideUrl: string;
};

type v1alpha2CloudShellStatusResource = {
  phase: string;
  mainUrl: string;
};

export type TerminalInitData = { pod: string; container: string; cmd: string[] };

export const CLOUD_SHELL_LABEL = 'console.openshift.io/terminal';
export const CLOUD_SHELL_CREATOR_LABEL = 'controller.devfile.io/creator';
export const CLOUD_SHELL_RESTRICTED_ANNOTATION = 'controller.devfile.io/restricted-access';
export const CLOUD_SHELL_STOPPED_BY_ANNOTATION = 'controller.devfile.io/stopped-by';
export const CLOUD_SHELL_PROTECTED_NAMESPACE = 'openshift-terminal';

export const createCloudShellResourceName = () => `terminal-${getRandomChars(6)}`;

const v1alpha1DevworkspaceComponent = [
  {
    plugin: {
      name: 'web-terminal',
      id: 'redhat-developer/web-terminal/latest',
    },
  },
];

const devWorkspaceComponent = [
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
];

export const newCloudShellWorkSpace = (
  name: string,
  namespace: string,
  version: string,
): CloudShellResource => ({
  apiVersion: `workspace.devfile.io/${version}`,
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
      components:
        version === v1alpha1WorkspaceModel.apiVersion
          ? v1alpha1DevworkspaceComponent
          : devWorkspaceComponent,
    },
  },
});

export const startWorkspace = (workspace: CloudShellResource) => {
  // Check the version so we know what workspace model to use for starting the workspace
  const groupVersion = workspace.apiVersion.split('/');
  const version = groupVersion[1];

  const workspaceModel =
    version === v1alpha1WorkspaceModel.apiVersion ? v1alpha1WorkspaceModel : WorkspaceModel;

  return k8sPatch(workspaceModel, workspace, [
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

export const getCloudShellCR = (workspaceModel: K8sKind, name: string, ns: string) => {
  return k8sGet(workspaceModel, name, ns);
};

// Check to see if v1alpha2 devworkspace crds are available on the cluster.
// If they are not available or if an error occurs when finding them then report that they aren't available
export const useV1alpha2CRDAvailability = () => {
  const [loading, setLoading] = useSafetyFirst(true);
  const [isAvailable, setAvailable] = useSafetyFirst(false);

  React.useEffect(() => {
    k8sGet(WorkspaceModel)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .then((_) => {
        setLoading(false);
        setAvailable(true);
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .catch((_) => {
        setLoading(false);
        setAvailable(false);
      });
  }, [setLoading, setAvailable]);

  return [isAvailable, loading];
};

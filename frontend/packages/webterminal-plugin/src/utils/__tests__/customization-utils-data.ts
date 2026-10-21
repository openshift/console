export const execResource = {
  apiVersion: 'workspace.devfile.io/v1alpha2',
  kind: 'DevWorkspaceTemplate',
  metadata: {
    annotations: {
      'controller.devfile.io/allow-import-from': '*',
    },
    resourceVersion: '37635',
    name: 'web-terminal-exec',
    uid: '76ce4013-ae3d-46ac-b010-61bab1049e79',
    creationTimestamp: '2023-05-16T06:14:09Z',
    generation: 1,
    namespace: 'openshift-operators',
    labels: {
      'console.openshift.io/terminal': 'true',
    },
  },
  spec: {
    components: [
      {
        container: {
          env: [
            {
              name: 'WEB_TERMINAL_IDLE_TIMEOUT',
              value: '15m',
            },
          ],
          image:
            'registry.redhat.io/web-terminal/web-terminal-exec-rhel8@sha256:c82e89d9e8a5d1c9e5c94835d38cb601e5e1ecb1e53cb038d0423b1b19d98683',
        },
        name: 'web-terminal-exec',
      },
    ],
  },
};

export const execResourceWithNullSpec = {
  apiVersion: 'workspace.devfile.io/v1alpha2',
  kind: 'DevWorkspaceTemplate',
  metadata: {
    annotations: {
      'controller.devfile.io/allow-import-from': '*',
    },
    resourceVersion: '37635',
    name: 'web-terminal-exec',
    uid: '76ce4013-ae3d-46ac-b010-61bab1049e79',
    creationTimestamp: '2023-05-16T06:14:09Z',
    generation: 1,
    namespace: 'openshift-operators',
    labels: {
      'console.openshift.io/terminal': 'true',
    },
  },
  spec: {},
};

export const execResourceWithNullComponents = {
  apiVersion: 'workspace.devfile.io/v1alpha2',
  kind: 'DevWorkspaceTemplate',
  metadata: {
    annotations: {
      'controller.devfile.io/allow-import-from': '*',
    },
    resourceVersion: '37635',
    name: 'web-terminal-exec',
    uid: '76ce4013-ae3d-46ac-b010-61bab1049e79',
    creationTimestamp: '2023-05-16T06:14:09Z',
    generation: 1,
    namespace: 'openshift-operators',
    labels: {
      'console.openshift.io/terminal': 'true',
    },
  },
  spec: {
    components: [],
  },
};

export const execResourceWithoutEnvVariable = {
  apiVersion: 'workspace.devfile.io/v1alpha2',
  kind: 'DevWorkspaceTemplate',
  metadata: {
    annotations: {
      'controller.devfile.io/allow-import-from': '*',
    },
    resourceVersion: '37635',
    name: 'web-terminal-exec',
    uid: '76ce4013-ae3d-46ac-b010-61bab1049e79',
    creationTimestamp: '2023-05-16T06:14:09Z',
    generation: 1,
    namespace: 'openshift-operators',
    labels: {
      'console.openshift.io/terminal': 'true',
    },
  },
  spec: {
    components: [
      {
        container: {
          env: [],
          image:
            'registry.redhat.io/web-terminal/web-terminal-exec-rhel8@sha256:c82e89d9e8a5d1c9e5c94835d38cb601e5e1ecb1e53cb038d0423b1b19d98683',
        },
        name: 'web-terminal-exec',
      },
    ],
  },
};

export const toolingResource = {
  apiVersion: 'workspace.devfile.io/v1alpha2',
  kind: 'DevWorkspaceTemplate',
  metadata: {
    annotations: {
      'controller.devfile.io/allow-import-from': '*',
    },
    resourceVersion: '37634',
    name: 'web-terminal-tooling',
    uid: 'c67f531d-cd6f-426f-998c-2e6c286e07c0',
    creationTimestamp: '2023-05-16T06:14:09Z',
    generation: 1,
    namespace: 'openshift-operators',
    labels: {
      'console.openshift.io/terminal': 'true',
    },
  },
  spec: {
    components: [
      {
        container: {
          image:
            'registry.redhat.io/web-terminal/web-terminal-tooling-rhel8@sha256:18a8af0f9a36ae5bc7d62acf6ef8689253483f43b1a97b9f2895d41333f73b30',
        },
        name: 'web-terminal-tooling',
      },
    ],
  },
};

export const toolingResourceWithNullSpec = {
  apiVersion: 'workspace.devfile.io/v1alpha2',
  kind: 'DevWorkspaceTemplate',
  metadata: {
    annotations: {
      'controller.devfile.io/allow-import-from': '*',
    },
    resourceVersion: '37634',
    name: 'web-terminal-tooling',
    uid: 'c67f531d-cd6f-426f-998c-2e6c286e07c0',
    creationTimestamp: '2023-05-16T06:14:09Z',
    generation: 1,
    namespace: 'openshift-operators',
    labels: {
      'console.openshift.io/terminal': 'true',
    },
  },
  spec: {},
};

export const toolingResourceWithNullComponents = {
  apiVersion: 'workspace.devfile.io/v1alpha2',
  kind: 'DevWorkspaceTemplate',
  metadata: {
    annotations: {
      'controller.devfile.io/allow-import-from': '*',
    },
    resourceVersion: '37634',
    name: 'web-terminal-tooling',
    uid: 'c67f531d-cd6f-426f-998c-2e6c286e07c0',
    creationTimestamp: '2023-05-16T06:14:09Z',
    generation: 1,
    namespace: 'openshift-operators',
    labels: {
      'console.openshift.io/terminal': 'true',
    },
  },
  spec: {
    components: [],
  },
};

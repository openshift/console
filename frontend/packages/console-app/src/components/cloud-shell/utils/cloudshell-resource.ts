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

export interface CloudShellResource {
  metadata: {
    name: string;
    namespace: string;
  };
  status?: {
    phase: string;
    ideUrl: string;
  };
  spec?: {
    started?: boolean;
    devfile?: Devfile;
  };
  apiVersion?: string;
  kind: string;
}

export const newCloudShellWorkSpace = (name: string, namespace: string): CloudShellResource => ({
  apiVersion: 'workspace.che.eclipse.org/v1alpha1',
  kind: 'Workspace',
  metadata: {
    name,
    namespace,
  },
  spec: {
    started: true,
    devfile: {
      apiVersion: '0.0.1',
      metadata: {
        name: 'cloud-shell',
      },
      components: [
        {
          alias: 'cloud-shell',
          type: 'cheEditor',
          id: 'eclipse/cloud-shell/nightly',
        },
        {
          type: 'dockerimage',
          memoryLimit: '256Mi',
          alias: 'dev',
          image: 'quay.io/eclipse/che-sidecar-openshift-connector:0.1.2-2601509',
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

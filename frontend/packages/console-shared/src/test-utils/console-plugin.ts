import type { ConsolePluginKind } from '@openshift/api-types/dist/openshift/console.openshift.io/v1/ConsolePlugin';

export const consolePlugin: ConsolePluginKind = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'ConsolePlugin',
  metadata: { name: 'test-plugin' },
  spec: {
    displayName: 'Test plugin',
    backend: {
      type: 'Service',
      service: { name: 'plugin-assets', namespace: 'plugins', port: 8443 },
    },
    proxy: [
      {
        alias: 'private-api',
        authorization: 'UserToken',
        endpoint: {
          type: 'Service',
          service: { name: 'plugin-api', namespace: 'plugins', port: 8443 },
        },
      },
      {
        alias: 'public-api',
        authorization: 'None',
        endpoint: {
          type: 'Service',
          service: { name: 'public-api', namespace: 'plugins', port: 8443 },
        },
      },
    ],
  },
};

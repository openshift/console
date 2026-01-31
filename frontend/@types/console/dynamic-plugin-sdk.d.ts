import type { ConsoleSupportedCustomProperties } from '@console/dynamic-plugin-sdk/src/build-types';

declare module '@openshift/dynamic-plugin-sdk' {
  interface PluginCustomProperties {
    console?: ConsoleSupportedCustomProperties;
    [namespace: string]: unknown;
  }
}

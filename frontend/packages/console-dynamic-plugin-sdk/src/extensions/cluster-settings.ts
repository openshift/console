import { Extension } from '@console/plugin-sdk/src/typings/base';

namespace ExtensionProperties {
  export type ClusterGlobalConfig = {
    /** Unique identifier for the cluster config resource instance. */
    id: string;
    /** The name of the cluster config resource instance. */
    name: string;
    /** The model which refers to a cluster config resource. */
    model: {
      group: string;
      version: string;
      kind: string;
    };
    /** The namespace of the cluster config resource instance. */
    namespace: string;
  };
}

// Extension types

export type ClusterGlobalConfig = Extension<ExtensionProperties.ClusterGlobalConfig> & {
  type: 'console.global-config';
};

// Type guards

export const isClusterGlobalConfig = (e: Extension): e is ClusterGlobalConfig =>
  e.type === 'console.global-config';

import { Extension } from '@console/plugin-sdk/src/typings/base';
import { ExtensionDeclaration } from '../types';

export type ClusterGlobalConfig = ExtensionDeclaration<
  'console.global-config',
  {
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
  }
>;

// Type guards

export const isClusterGlobalConfig = (e: Extension): e is ClusterGlobalConfig =>
  e.type === 'console.global-config';

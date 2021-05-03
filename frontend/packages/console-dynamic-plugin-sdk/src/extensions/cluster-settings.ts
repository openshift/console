import { ExtensionK8sModel } from '../api/common-types';
import { Extension, ExtensionDeclaration } from '../types';

export type ClusterGlobalConfig = ExtensionDeclaration<
  'console.global-config',
  {
    /** Unique identifier for the cluster config resource instance. */
    id: string;
    /** The name of the cluster config resource instance. */
    name: string;
    /** The model which refers to a cluster config resource. */
    model: ExtensionK8sModel;
    /** The namespace of the cluster config resource instance. */
    namespace: string;
  }
>;

// Type guards

export const isClusterGlobalConfig = (e: Extension): e is ClusterGlobalConfig =>
  e.type === 'console.global-config';

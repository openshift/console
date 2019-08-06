import { K8sKind } from '@console/internal/module/k8s';
import { Extension } from './extension';

namespace ExtensionProperties {
  export interface ModelDefinition {
    /** Additional Kubernetes model definitions to register with Console. */
    models: K8sKind[];
  }
}

export interface ModelDefinition extends Extension<ExtensionProperties.ModelDefinition> {
  type: 'ModelDefinition';
}

export const isModelDefinition = (e: Extension): e is ModelDefinition => {
  return e.type === 'ModelDefinition';
};

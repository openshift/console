import { Extension } from '.';
import { K8sKind } from '@console/internal/module/k8s';

namespace ExtensionProperties {
  export interface ModelDefinition {
    models: K8sKind[];
  }
}

export interface ModelDefinition extends Extension<ExtensionProperties.ModelDefinition> {
  type: 'ModelDefinition';
}

export function isModelDefinition(e: Extension<any>): e is ModelDefinition {
  return e.type === 'ModelDefinition';
}

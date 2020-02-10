import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils/kebab';
import { Extension } from './base';

namespace ExtensionProperties {
  export interface KebabActions {
    // no kind should return any actions common for all kinds
    getKebabActionsForKind: (kind: K8sKind, resource?: K8sResourceKind) => KebabAction[];
  }
}

export interface KebabActions extends Extension<ExtensionProperties.KebabActions> {
  type: 'KebabActions';
}

export function isKebabActions(e: Extension): e is KebabActions {
  return e.type === 'KebabActions';
}

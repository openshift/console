import { KebabAction } from '@console/internal/components/utils/kebab';
import { K8sKind } from '@console/internal/module/k8s';
import { Extension } from './base';

namespace ExtensionProperties {
  export interface KebabActions {
    // no kind should return any actions common for all kinds
    getKebabActionsForKind: (kind: K8sKind) => KebabAction[];
  }
}

export interface KebabActions extends Extension<ExtensionProperties.KebabActions> {
  type: 'KebabActions';
}

export function isKebabActions(e: Extension): e is KebabActions {
  return e.type === 'KebabActions';
}

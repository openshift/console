import { K8sKind } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils/kebab';
import { Extension } from './extension';

namespace ExtensionProperties {
  export interface PluginKebabActions {
    // no kind should return any actions common for all kinds
    getKebabActionsForKind: (kind: K8sKind) => KebabAction[];
  }
}

export interface KebabActions extends Extension<ExtensionProperties.PluginKebabActions> {
  type: 'KebabActions';
}

export function isKebabActions(e: Extension<any>): e is KebabActions {
  return e.type === 'KebabActions';
}

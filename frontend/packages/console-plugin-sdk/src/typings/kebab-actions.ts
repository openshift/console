import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils/kebab';
import { Extension } from './base';

namespace ExtensionProperties {
  export interface KebabActionFactory {
    /** Provide additional actions for the given Kubernetes model. */
    getKebabActions: GetKebabActions;
    /** Existing item before which to place the additional actions. */
    mergeBefore?: string;
  }
}

export interface KebabActionFactory extends Extension<ExtensionProperties.KebabActionFactory> {
  type: 'KebabActionFactory';
}

export function isKebabActionFactory(e: Extension): e is KebabActionFactory {
  return e.type === 'KebabActionFactory';
}

export type GetKebabActions = (kind: K8sKind, obj?: K8sResourceKind) => KebabAction[];

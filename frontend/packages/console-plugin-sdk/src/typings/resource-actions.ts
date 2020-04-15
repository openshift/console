import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils/kebab';
import { Extension } from './base';

namespace ExtensionProperties {
  export interface ResourceActionProvider {
    /** Provide additional actions for the given Kubernetes model. */
    getResourceActions: GetResourceActions;
    /** Existing item before which to place the additional actions. */
    mergeBefore?: string;
  }
}

export interface ResourceActionProvider
  extends Extension<ExtensionProperties.ResourceActionProvider> {
  type: 'Resource/Actions';
}

export function isResourceActionProvider(e: Extension): e is ResourceActionProvider {
  return e.type === 'Resource/Actions';
}

export type GetResourceActions = (kind: K8sKind, obj?: K8sResourceKind) => KebabAction[];

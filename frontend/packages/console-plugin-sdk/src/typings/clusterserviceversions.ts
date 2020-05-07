import { K8sResourceKindReference } from '@console/internal/module/k8s';
import { Extension } from './base';

namespace ExtensionProperties {
  export interface ClusterServiceVersionAction {
    /** the kind this action is for */
    kind: K8sResourceKindReference;
    /** label of action */
    label: string;
    /** API group of the resource */
    apiGroup: string;
    /** action callback */
    callback: (kind: K8sResourceKindReference, obj: any) => () => any;
  }
}

export interface ClusterServiceVersionAction
  extends Extension<ExtensionProperties.ClusterServiceVersionAction> {
  type: 'ClusterServiceVersion/Action';
}

export const isClusterServiceVersionAction = (e: Extension): e is ClusterServiceVersionAction =>
  e.type === 'ClusterServiceVersion/Action';

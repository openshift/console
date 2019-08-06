import { K8sKind } from '@console/internal/module/k8s';
import { Extension } from './common';

namespace ExtensionProperties {
  export interface GlobalConfig {
    /** Kind of this item. */
    kind: string;
    /** Model for this item. */
    model: K8sKind;
    /** Name of this item. */
    name: string;
    /** Namespace of this item. */
    namespace: string;
    /** Name of feature flag for this item. */
    // TODO(vojtech): remove this property, obsoleted by Extension.flags
    required: string;
    /** Unique identifier for this item. */
    uid: string;
  }
}

export interface GlobalConfig extends Extension<ExtensionProperties.GlobalConfig> {
  type: 'GlobalConfig';
}

export function isGlobalConfig(e: Extension<any>): e is GlobalConfig {
  return e.type === 'GlobalConfig';
}

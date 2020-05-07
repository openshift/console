import { K8sKind } from '@console/internal/module/k8s';
import { Extension } from './base';

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
    /** Unique identifier for this item. */
    uid: string;
  }
}

export interface GlobalConfig extends Extension<ExtensionProperties.GlobalConfig> {
  type: 'GlobalConfig';
}

export function isGlobalConfig(e: Extension): e is GlobalConfig {
  return e.type === 'GlobalConfig';
}

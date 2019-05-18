import { Extension } from '.';
import { K8sKind } from '@console/internal/module/k8s';

namespace ExtensionProperties {
  export interface ModelFeatureFlag {
    model: K8sKind;
    flag: string;
  }
}

export interface ModelFeatureFlag extends Extension<ExtensionProperties.ModelFeatureFlag> {
  type: 'FeatureFlag/Model';
}

// TODO(vojtech): add ActionFeatureFlag
export type FeatureFlag = ModelFeatureFlag;

export function isModelFeatureFlag(e: Extension<any>): e is ModelFeatureFlag {
  return e.type === 'FeatureFlag/Model';
}

export function isFeatureFlag(e: Extension<any>): e is FeatureFlag {
  return isModelFeatureFlag(e);
}

import { K8sKind } from '@console/internal/module/k8s';
import { Extension } from './extension';

namespace ExtensionProperties {
  export interface ModelFeatureFlag {
    /** If a CRD for this model exists, the feature will be enabled. */
    model: K8sKind;
    /** The name of the feature flag. */
    flag: string;
  }
}

export interface ModelFeatureFlag extends Extension<ExtensionProperties.ModelFeatureFlag> {
  type: 'FeatureFlag/Model';
}

// TODO(vojtech): add ActionFeatureFlag
export type FeatureFlag = ModelFeatureFlag;

export const isModelFeatureFlag = (e: Extension<any>): e is ModelFeatureFlag => {
  return e.type === 'FeatureFlag/Model';
};

export const isFeatureFlag = (e: Extension<any>): e is FeatureFlag => {
  return isModelFeatureFlag(e);
};

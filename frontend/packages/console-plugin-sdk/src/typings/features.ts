import { K8sKind } from '@console/internal/module/k8s';
import { Extension, AlwaysOnExtension } from './common';

namespace ExtensionProperties {
  export interface ModelFeatureFlag {
    /** If a CRD for this model exists, the feature flag will be enabled. */
    model: K8sKind;
    /** The name of the feature flag. */
    flag: string;
    /** Whether to gate all of the plugin's extensions by this feature flag. */
    gateExtensions: boolean;
  }
}

export interface ModelFeatureFlag extends AlwaysOnExtension<ExtensionProperties.ModelFeatureFlag> {
  type: 'FeatureFlag/Model';
}

// TODO(vojtech): add ActionFeatureFlag
export type FeatureFlag = ModelFeatureFlag;

export const isModelFeatureFlag = (e: Extension): e is ModelFeatureFlag => {
  return e.type === 'FeatureFlag/Model';
};

export const isFeatureFlag = (e: Extension): e is FeatureFlag => {
  return isModelFeatureFlag(e);
};

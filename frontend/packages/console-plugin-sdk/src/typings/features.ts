import { Dispatch } from 'react-redux';
import { K8sKind } from '@console/internal/module/k8s';
import { Extension, AlwaysOnExtension } from './base';

namespace ExtensionProperties {
  interface FeatureFlag {
    /** The name of the feature flag. */
    flag: string;
  }

  export interface ModelFeatureFlag extends FeatureFlag {
    /** If a CRD for this model exists, the feature will be enabled. */
    model: K8sKind;
  }

  export interface ActionFeatureFlag extends FeatureFlag {
    /** Function used to detect the feature and set flag name/value via Redux action dispatch. */
    detect: (dispatch: Dispatch) => Promise<any>;
  }
}

export interface ModelFeatureFlag extends AlwaysOnExtension<ExtensionProperties.ModelFeatureFlag> {
  type: 'FeatureFlag/Model';
}

export interface ActionFeatureFlag extends Extension<ExtensionProperties.ActionFeatureFlag> {
  type: 'FeatureFlag/Action';
}

export type FeatureFlag = ModelFeatureFlag | ActionFeatureFlag;

export const isModelFeatureFlag = (e: Extension): e is ModelFeatureFlag => {
  return e.type === 'FeatureFlag/Model';
};

export const isActionFeatureFlag = (e: Extension): e is ActionFeatureFlag => {
  return e.type === 'FeatureFlag/Action';
};

export const isFeatureFlag = (e: Extension): e is FeatureFlag => {
  return isModelFeatureFlag(e) || isActionFeatureFlag(e);
};

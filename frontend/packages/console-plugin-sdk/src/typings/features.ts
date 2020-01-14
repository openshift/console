import { Dispatch } from 'react-redux';
import { K8sKind } from '@console/internal/module/k8s';
import { Extension } from './extension';

namespace ExtensionProperties {
  export interface ModelFeatureFlag {
    /** If a CRD for this model exists, the feature will be enabled. */
    model: K8sKind;
    /** The name of the feature flag. */
    flag: string;
  }

  export interface ActionFeatureFlag {
    /** Function used to detect the feature and set flag name/value via Redux action dispatch. */
    detect: (dispatch: Dispatch) => Promise<any>;
  }
}

export interface ModelFeatureFlag extends Extension<ExtensionProperties.ModelFeatureFlag> {
  type: 'FeatureFlag/Model';
}

export interface ActionFeatureFlag extends Extension<ExtensionProperties.ActionFeatureFlag> {
  type: 'FeatureFlag/Action';
}

export const isModelFeatureFlag = (e: Extension): e is ModelFeatureFlag => {
  return e.type === 'FeatureFlag/Model';
};

export const isActionFeatureFlag = (e: Extension): e is ActionFeatureFlag => {
  return e.type === 'FeatureFlag/Action';
};

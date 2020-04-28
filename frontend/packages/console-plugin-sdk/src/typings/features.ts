import { Dispatch } from 'react-redux';
import { K8sKind } from '@console/internal/module/k8s';
import { Extension, AlwaysOnExtension } from './base';
import { Action } from 'typesafe-actions';

namespace ExtensionProperties {
  export interface ModelFeatureFlag {
    /** The name of the feature flag. */
    flag: string;
    /** If a CRD for this model exists, the feature will be enabled. */
    model: K8sKind;
  }

  export interface CustomFeatureFlag {
    /** Function used to detect the feature and set arbitrary flag name/value via Redux action dispatch. */
    detect: FeatureDetector;
  }
}

export interface ModelFeatureFlag extends AlwaysOnExtension<ExtensionProperties.ModelFeatureFlag> {
  type: 'FeatureFlag/Model';
}

export interface CustomFeatureFlag extends Extension<ExtensionProperties.CustomFeatureFlag> {
  type: 'FeatureFlag/Custom';
}

export const isModelFeatureFlag = (e: Extension): e is ModelFeatureFlag => {
  return e.type === 'FeatureFlag/Model';
};

export const isCustomFeatureFlag = (e: Extension): e is CustomFeatureFlag => {
  return e.type === 'FeatureFlag/Custom';
};

export type FeatureDetector = (dispatch: Dispatch) => Promise<void | Action>;

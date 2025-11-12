import { Dispatch } from 'redux';
import { Action } from 'typesafe-actions';
import { Extension } from './base';

namespace ExtensionProperties {
  export interface CustomFeatureFlag {
    /** Function used to detect the feature and set arbitrary flag name/value via Redux action dispatch. */
    detect: FeatureDetector;
  }
}

export interface CustomFeatureFlag extends Extension<ExtensionProperties.CustomFeatureFlag> {
  type: 'FeatureFlag/Custom';
}

export const isCustomFeatureFlag = (e: Extension): e is CustomFeatureFlag => {
  return e.type === 'FeatureFlag/Custom';
};

export type FeatureDetector = (dispatch: Dispatch) => Promise<void | Action>;

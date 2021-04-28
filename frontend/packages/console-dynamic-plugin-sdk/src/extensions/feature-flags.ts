import { ExtensionK8sModel } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

/** Gives full control over Console feature flags. */
export type FeatureFlag = ExtensionDeclaration<
  'console.flag',
  {
    /** Used to set/unset arbitrary feature flags. */
    handler: CodeRef<(callback: SetFeatureFlag) => void>;
  }
>;

/** Adds new Console feature flag driven by the presence of a CRD on the cluster. */
export type ModelFeatureFlag = ExtensionDeclaration<
  'console.flag/model',
  {
    /** The name of the flag to set once the CRD is detected. */
    flag: string;
    /** The model which refers to a `CustomResourceDefinition`. */
    model: ExtensionK8sModel;
  }
>;

// Type guards

export const isFeatureFlag = (e: Extension): e is FeatureFlag => e.type === 'console.flag';

export const isModelFeatureFlag = (e: Extension): e is ModelFeatureFlag =>
  e.type === 'console.flag/model';

// Support types

export type SetFeatureFlag = (flag: string, enabled: boolean) => void;

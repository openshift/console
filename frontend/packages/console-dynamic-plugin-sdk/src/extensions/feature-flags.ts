import {
  FeatureFlag as CoreFeatureFlag,
  ModelFeatureFlag as CoreModelFeatureFlag,
} from '@openshift/dynamic-plugin-sdk';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { RepackageExtension } from './data-types';

/** Gives full control over Console feature flags. */
export type FeatureFlag = RepackageExtension<'console.flag', CoreFeatureFlag>;

/** Adds new Console feature flag driven by the presence of a CRD on the cluster. */
export type ModelFeatureFlag = RepackageExtension<'console.flag/model', CoreModelFeatureFlag>;

/** Gives full control over Console feature flags with hook handlers. */
export type FeatureFlagHookProvider = ExtensionDeclaration<
  'console.flag/hookProvider',
  {
    /** Used to set/unset arbitrary feature flags. */
    handler: CodeRef<FeatureFlagHandler>;
  }
>;

// Type guards

export const isFeatureFlag = (e: Extension): e is FeatureFlag => e.type === 'console.flag';

export const isModelFeatureFlag = (e: Extension): e is ModelFeatureFlag =>
  e.type === 'console.flag/model';

export const isFeatureFlagHookProvider = (e: Extension): e is FeatureFlagHookProvider =>
  e.type === 'console.flag/hookProvider';

// Support types

export type SetFeatureFlag = (flag: string, enabled: boolean) => void;
export type FeatureFlagHandler = (callback: SetFeatureFlag) => void;

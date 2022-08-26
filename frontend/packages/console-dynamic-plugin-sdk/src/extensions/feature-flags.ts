import {
  FeatureFlag as FeatureFlagCoreType,
  ModelFeatureFlag as ModelFeatureFlagCoreType,
} from '@openshift/dynamic-plugin-sdk';
import { ExtensionK8sModel } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

/**
 * @deprecated use `core.flag` extension instead
 * Gives full control over Console feature flags.
 */
export type FeatureFlag = ExtensionDeclaration<
  'console.flag',
  {
    /** Used to set/unset arbitrary feature flags. */
    handler: CodeRef<FeatureFlagHandler>;
  }
>;

/** Core equivalent of `console.flag` extension. */
export type CoreFeatureFlag = ExtensionDeclaration<'core.flag', FeatureFlagCoreType['properties']>;

/**
 * @deprecated use `core.flag/model` extension instead
 * Adds new Console feature flag driven by the presence of a CRD on the cluster.
 */
export type ModelFeatureFlag = ExtensionDeclaration<
  'console.flag/model',
  {
    /** The name of the flag to set once the CRD is detected. */
    flag: string;
    /** The model which refers to a `CustomResourceDefinition`. */
    model: ExtensionK8sModel;
  }
>;

/** Core equivalent of `console.flag/model` extension. */
export type CoreModelFeatureFlag = ExtensionDeclaration<
  'core.flag/model',
  ModelFeatureFlagCoreType['properties']
>;

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

export const isCoreFeatureFlag = (e: Extension): e is CoreFeatureFlag => e.type === 'core.flag';

export const isModelFeatureFlag = (e: Extension): e is ModelFeatureFlag =>
  e.type === 'console.flag/model';

export const isCoreModelFeatureFlag = (e: Extension): e is CoreModelFeatureFlag =>
  e.type === 'core.flag/model';

export const isFeatureFlagHookProvider = (e: Extension): e is FeatureFlagHookProvider =>
  e.type === 'console.flag/hookProvider';

// Support types

export type SetFeatureFlag = (flag: string, enabled: boolean) => void;
export type FeatureFlagHandler = (callback: SetFeatureFlag) => void;

import type { CodeRef as SDKCodeRef } from '@openshift/dynamic-plugin-sdk';

export type {
  ExtensionFlags,
  Extension,
  ExtensionPredicate as ExtensionTypeGuard,
  MapCodeRefsToValues as ResolvedCodeRefProperties,
  PluginEntryModule as RemoteEntryModule,
  ReplaceProperties as Update,
  LoadedExtension,
  ResolvedExtension,
} from '@openshift/dynamic-plugin-sdk';

/**
 * Code reference, encoded as an object literal.
 *
 * The value of the `$codeRef` property should be formatted as `moduleName.exportName`
 * (referring to a named export) or `moduleName` (referring to the `default` export).
 */
// TODO: remove and use base plugin SDK types instead
export type EncodedCodeRef = { $codeRef: string };

/**
 * Code reference, represented by a function that returns a promise for the object `T`.
 */
// TODO: remove and use base plugin SDK types instead
export type CodeRef<T = unknown> = SDKCodeRef<T>;

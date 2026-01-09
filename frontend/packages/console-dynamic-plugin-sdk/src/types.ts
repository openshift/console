import type {
  CodeRef as SDKCodeRef,
  Extension,
  ReplaceProperties as Update,
  MapCodeRefsToValues,
  AnyObject,
  LoadedExtension,
} from '@openshift/dynamic-plugin-sdk';

export type {
  ExtensionFlags,
  Extension,
  ExtensionPredicate as ExtensionTypeGuard,
  MapCodeRefsToValues as ResolvedCodeRefProperties,
  PluginEntryModule as RemoteEntryModule,
  ReplaceProperties as Update,
  LoadedExtension,
} from '@openshift/dynamic-plugin-sdk';

/**
 * Code reference, encoded as an object literal.
 *
 * The value of the `$codeRef` property should be formatted as `moduleName.exportName`
 * (referring to a named export) or `moduleName` (referring to the `default` export).
 */
export type EncodedCodeRef = { $codeRef: string };

/**
 * Code reference, represented by a function that returns a promise for the object `T`.
 */
export type CodeRef<T = unknown> = SDKCodeRef<T>;

/**
 * Extract type `T` from `CodeRef<T>`.
 */
export type ExtractCodeRefType<R> = R extends CodeRef<infer T> ? T : never;

/**
 * Infer the properties of extension `E`.
 */
export type ExtensionProperties<E> = E extends Extension<string, infer P> ? P : never;

/**
 * Update existing properties of extension `E` with ones declared in object `U`.
 */
export type UpdateExtensionProperties<
  E extends Extension,
  U extends {},
  P extends AnyObject = ExtensionProperties<E>
> = Update<
  E,
  {
    properties: Update<P, U>;
  }
>;

/**
 * Update `CodeRef` properties of extension `E` to the referenced object types.
 *
 * This also coerces `E` type to `LoadedExtension` interface for runtime consumption.
 */
export type ResolvedExtension<
  E extends Extension,
  P extends AnyObject = ExtensionProperties<E>
> = LoadedExtension<UpdateExtensionProperties<E, MapCodeRefsToValues<P>, P>>;

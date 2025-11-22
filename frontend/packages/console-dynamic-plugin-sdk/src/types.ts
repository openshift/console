import type {
  CodeRef as SDKCodeRef,
  Extension as SDKExtension,
  ExtensionPredicate,
  LoadedExtension as SDKLoadedExtension,
  ReplaceProperties as Update,
  MapCodeRefsToValues,
  AnyObject,
} from '@openshift/dynamic-plugin-sdk';

export type {
  ExtensionFlags,
  MapCodeRefsToValues as ResolvedCodeRefProperties,
  PluginEntryModule as RemoteEntryModule,
  ReplaceProperties as Update,
} from '@openshift/dynamic-plugin-sdk';

/**
 * An Extension
 */
export type Extension<
  TType extends string = string,
  TProperties extends AnyObject = AnyObject
> = Pick<SDKExtension<TType, TProperties>, 'type' | 'properties' | 'flags'>;

/**
 * An alias of `Extension` type.
 *
 * @deprecated - use ExtensionDeclaration instead
 */
export type ExtensionDeclaration<
  TType extends string = string,
  TProperties extends AnyObject = AnyObject
> = Extension<TType, TProperties>;

/**
 * TS type guard to narrow type of the given extension to `E`.
 */
export type ExtensionTypeGuard<E extends Extension> = ExtensionPredicate<E>;

/**
 * Runtime extension interface, exposing additional metadata.
 */
export type LoadedExtension<E extends Extension = Extension> = SDKLoadedExtension<E> & {
  pluginID: string;
};

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
export type ResolvedExtension<E extends Extension> = LoadedExtension<
  UpdateExtensionProperties<E, MapCodeRefsToValues<ExtensionProperties<E>>>
>;

import type {
  CodeRef,
  Extension,
  ReplaceProperties as Update,
  MapCodeRefsToValues,
  AnyObject,
  LoadedExtension,
} from '@openshift/dynamic-plugin-sdk';

export type {
  EncodedCodeRef,
  CodeRef,
  ExtensionFlags,
  Extension,
  ExtensionPredicate as ExtensionTypeGuard,
  MapCodeRefsToValues as ResolvedCodeRefProperties,
  PluginEntryModule as RemoteEntryModule,
  ReplaceProperties as Update,
  LoadedExtension,
} from '@openshift/dynamic-plugin-sdk';

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

import type {
  CodeRef as SDKCodeRef,
  ExtensionFlags,
  ExtensionPredicate,
  LoadedExtension as SDKLoadedExtension,
  ReplaceProperties as Update,
  MapCodeRefsToValues,
} from '@openshift/dynamic-plugin-sdk';

export type {
  ExtensionFlags,
  Extension as ExtensionDeclaration,
  MapCodeRefsToValues as ResolvedCodeRefProperties,
  PluginEntryModule as RemoteEntryModule,
  ReplaceProperties as Update,
} from '@openshift/dynamic-plugin-sdk';

/**
 * A legacy type for static extensions that should not be used anymore.
 *
 * Each extension instance has a `type` and the corresponding parameters
 * represented by the `properties` object.
 *
 * Each extension may specify `flags` referencing Console feature flags which
 * are required and/or disallowed in order to put this extension into effect.
 *
 * @deprecated - Use `ExtensionDeclaration` instead.
 */
export type Extension<P extends {} = any> = {
  type: string;
  properties: P;
  flags?: ExtensionFlags;
};

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
export type ExtensionProperties<E> = E extends Extension<infer P> ? P : never;

/**
 * Update existing properties of extension `E` with ones declared in object `U`.
 */
export type UpdateExtensionProperties<
  E extends Extension<P>,
  U extends {},
  P = ExtensionProperties<E>
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
export type ResolvedExtension<E extends Extension<P>, P = ExtensionProperties<E>> = LoadedExtension<
  UpdateExtensionProperties<E, MapCodeRefsToValues<P>, P>
>;

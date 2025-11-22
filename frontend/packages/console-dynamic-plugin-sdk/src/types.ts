import type {
  CodeRef as SDKCodeRef,
  Extension as SDKExtension,
  LoadedExtension as SDKLoadedExtension,
  ReplaceProperties as Update,
  MapCodeRefsToValues,
  AnyObject,
} from '@openshift/dynamic-plugin-sdk';

export type {
  ExtensionFlags,
  ExtensionPredicate as ExtensionTypeGuard,
  MapCodeRefsToValues as ResolvedCodeRefProperties,
  PluginEntryModule as RemoteEntryModule,
  ReplaceProperties as Update,
} from '@openshift/dynamic-plugin-sdk';

/**
 * An extension of OpenShift console.
 *
 * Each extension extends the console's functionality in a specific way, defined
 * by its `type`. Console plugins contribute one or more extension instances, which
 * are loaded and processed by the console at runtime to extend its capabilities.
 *
 * The `type` property determines the kind of extension, while the `properties`
 * object contains the data and/or {@link CodeRef}`s necessary to interpret the given
 * extension type.
 *
 * Extensions can also use the optional `flags` property to specify which feature
 * flags must be enabled for the extension to be active.
 */
export type Extension<
  TType extends string = string,
  TProperties extends AnyObject = AnyObject
> = Pick<SDKExtension<TType, TProperties>, 'type' | 'properties' | 'flags'>;

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

/**
 * Console feature flags used to gate extension instances.
 */
export type ExtensionFlags = Partial<{
  required: string[];
  disallowed: string[];
}>;

/**
 * TS type guard to narrow type of the given extension to `E`.
 */
export type ExtensionTypeGuard<E extends Extension> = (e: E) => e is E;

/**
 * Runtime extension interface, exposing additional metadata.
 */
export type LoadedExtension<E extends Extension = Extension> = E & {
  pluginID: string;
  pluginName: string;
  uid: string;
};

/**
 * An extension of the Console application.
 *
 * Each extension instance has a `type` and the corresponding parameters
 * represented by the `properties` object.
 *
 * Each extension may specify `flags` referencing Console feature flags which
 * are required and/or disallowed in order to put this extension into effect.
 */
export type Extension<P extends {} = any> = {
  type: string;
  properties: P;
  flags?: ExtensionFlags;
};

/**
 * Declaration of Console extension type.
 */
export type ExtensionDeclaration<T extends string, P extends {}> = Extension<P> & {
  type: T;
};

/**
 * Remote (i.e. webpack container) entry module interface.
 */
export type RemoteEntryModule = {
  /**
   * Get a module exposed through the container.
   *
   * Fails if the requested module doesn't exist in container.
   */
  get: <T extends {}>(moduleName: string) => Promise<() => T>;

  init: (modules: any) => void;
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
export type CodeRef<T = any> = () => Promise<T>;

/**
 * Extract type `T` from `CodeRef<T>`.
 */
export type ExtractCodeRefType<R> = R extends CodeRef<infer T> ? T : never;

/**
 * Infer resolved `CodeRef` properties from object `O` recursively.
 */
export type ResolvedCodeRefProperties<O extends {}> = {
  [K in keyof O]: O[K] extends CodeRef ? ExtractCodeRefType<O[K]> : ResolvedCodeRefProperties<O[K]>;
};

/**
 * Update existing properties of object `O` with ones declared in object `U`.
 */
export type Update<O extends {}, U extends {}> = {
  [K in keyof O]: K extends keyof U ? U[K] : O[K];
} & {};

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
  UpdateExtensionProperties<E, ResolvedCodeRefProperties<P>, P>
>;

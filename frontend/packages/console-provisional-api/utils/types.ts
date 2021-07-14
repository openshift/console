type CodeRef<T = any> = () => Promise<T>;

type LoadedExtension<E extends Extension = Extension> = E & {
  pluginID: string;
  pluginName: string;
  uid: string;
};
/**
 * Infer resolved `CodeRef` properties from object `O`.
 */
type ResolvedCodeRefProperties<O extends {}> = {
  [K in keyof O]: O[K] extends CodeRef<infer T> ? T : O[K];
};

/**
 * Update existing properties of object `O` with ones declared in object `U`.
 */
type Update<O extends {}, U extends {}> = {
  [K in keyof O]: K extends keyof U ? U[K] : O[K];
} & {};

type ResolvedExtension<E extends Extension<P>, P = ExtensionProperties<E>> = LoadedExtension<
  UpdateExtensionProperties<E, ResolvedCodeRefProperties<P>, P>
>;

type ExtensionProperties<E> = E extends Extension<infer P> ? P : never;

/**
 * Update existing properties of extension `E` with ones declared in object `U`.
 */
type UpdateExtensionProperties<
  E extends Extension<P>,
  U extends {},
  P = ExtensionProperties<E>
> = Update<
  E,
  {
    properties: Update<P, U>;
  }
>;

type ExtensionTypeGuard<E extends Extension> = (e: E) => e is E;

type ExtensionFlags = Partial<{
  required: string[];
  disallowed: string[];
}>;

type Extension<P extends {} = any> = {
  type: string;
  properties: P;
  flags?: ExtensionFlags;
};

export type UseResolvedExtensions = <E extends Extension>(
  ...typeGuards: ExtensionTypeGuard<E>[]
) => [ResolvedExtension<E>[], boolean, any[]];

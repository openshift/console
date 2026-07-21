/** Packages where the i18n namespace differs from the package directory name */
export const NAMESPACE_EXCEPTIONS: Record<string, string> = {
  'dev-console': 'devconsole',
  'operator-lifecycle-manager': 'olm',
  'operator-lifecycle-manager-v1': 'olm-v1',
};

/** Inverse of NAMESPACE_EXCEPTIONS: namespace -> package directory */
export const DIR_EXCEPTIONS: Record<string, string> = Object.fromEntries(
  Object.entries(NAMESPACE_EXCEPTIONS).map(([dir, ns]) => [ns, dir]),
);

/** Given a namespace, return the package directory name (or the namespace itself if no exception). */
export const namespaceToDirName = (ns: string): string => DIR_EXCEPTIONS[ns] ?? ns;

/** Given a package directory name, return the namespace (or the dir name itself if no exception). */
export const dirNameToNamespace = (dir: string): string => NAMESPACE_EXCEPTIONS[dir] ?? dir;

const basePathPattern = new RegExp(`^/?${window.SERVER_FLAGS.basePath}`);

export const removeLeadingSlash = (path: string): string => path?.replace?.(/^\//, '');

export const addPrefixToPath = (path, prefix) =>
  path && !path.startsWith(prefix) ? `${prefix}/${removeLeadingSlash(path)}` : path;

export const addPrefixToPaths = (paths: string | string[], prefix: string): string[] =>
  Array.isArray(paths)
    ? paths.map((p) => addPrefixToPath(p, prefix))
    : [addPrefixToPath(paths, prefix)];

export const stripBasePath = (path: string): string => path?.replace(basePathPattern, '/');

// Strips '/<basePath>/k8s/cluster/', '/<basePath>/k8s/ns/<namespace>/', and
// '/<basePath>/k8s/all-namespaces/' from the beginning a given path
export const stripScopeFromPath = (path: string) =>
  stripBasePath(path)?.replace(
    /^\/?(?:c\/[^/]*\/)?(?:k8s\/cluster\/|k8s\/all-namespaces\/|k8s\/ns\/[^/]*\/)?(.*?)\/?$/,
    '$1',
  );

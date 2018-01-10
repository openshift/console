// Kubernetes "dns-friendly" names match
// [a-z0-9]([-a-z0-9]*[a-z0-9])?  and are 63 or fewer characters
// long. This pattern checks the pattern but not the length.
//
// Don't capture anything in legalNamePattern, since it's used
// in expressions like
//
//    new RegExp("PREFIX" + legalNamePattern.source + "(SUFFIX)")
//
// And it's ok for users to make assumptions about capturing groups.
const legalNamePattern = /[a-z0-9](?:[-a-z0-9]*[a-z0-9])?/;

const basePathPattern = new RegExp(`^/?${window.SERVER_FLAGS.basePath}`);
const nsPathPattern = new RegExp(`^/?ns/(${legalNamePattern.source})/?(.*)$`);
const allNsPathPattern = /^\/?all-namespaces\/?(.*)$/;

export const stripBasePath = path => {
  path = path.replace(basePathPattern, '/');
  path = path.replace(/^\/?k8s\//, '');
  return path;
};

export const isNamespaced = path => {
  const subpath = stripBasePath(path);
  return subpath.match(nsPathPattern) || subpath.match(allNsPathPattern);
};

export const getNamespace = path => {
  const subpath = stripBasePath(path);
  if (subpath.match(allNsPathPattern)) {
    return;
  }
  const match = subpath.match(nsPathPattern);
  return match && match.length > 0 && match[1];
};

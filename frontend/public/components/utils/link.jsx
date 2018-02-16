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
// const nsPathPattern = new RegExp(`^/?ns/(${legalNamePattern.source})/?(.*)$`);
// const allNsPathPattern = /^\/?all-namespaces\/?(.*)$/;

export const namespacedPrefixes = ['/search', '/applications', '/overview', '/k8s'];

export const stripBasePath = path => {
  path = path.replace(basePathPattern, '/');
  path = path.replace(/^\/?k8s\//, '');
  return path;
};

export const isNamespaced = path => {
  // path = normalizeURLPathBullshit(path);
  if (namespacedPrefixes.filter(p => path.startsWith(p)).length) {
    return true;
  }
  // const subpath = stripBasePath(path);
  // return subpath.match(nsPathPattern) || subpath.match(allNsPathPattern);
  return false;
};

export const getNamespace = path => {
  const split = path.split('/')
    .filter(x => x);

  if (split.length < 3) {
    return;
  }
  if (split[1] !== 'ns') {
    return;
  }
  const match = split[2].match(legalNamePattern);
  return match && match.length > 0 && match[0];
};

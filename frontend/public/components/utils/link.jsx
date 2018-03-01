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
import { ALL_NAMESPACES_KEY } from '../../const';

export const legalNamePattern = /[a-z0-9](?:[-a-z0-9]*[a-z0-9])?/;

const basePathPattern = new RegExp(`^/?${window.SERVER_FLAGS.basePath}`);

export const namespacedPrefixes = ['/search', '/applications', '/overview', '/k8s'];

export const stripBasePath = path => {
  path = path.replace(basePathPattern, '/');
  path = path.replace(/^\/?k8s\//, '');
  return path;
};

export const isNamespaced = path => namespacedPrefixes.filter(p => path.startsWith(p)).length > 0;

export const getNamespace = path => {
  const split = path.split('/').filter(x => x);

  if (split[1] === 'all-namespaces') {
    return ALL_NAMESPACES_KEY;
  }

  if (split[1] !== 'ns') {
    return;
  }

  const ns = split[2];

  if (!ns) {
    return;
  }

  const match = ns.match(legalNamePattern);
  return match && match.length > 0 && match[0];
};

import * as React from 'react';
import * as classNames from 'classnames';

import { ALL_NAMESPACES_KEY } from '../../const';

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

export const legalNamePattern = /[a-z0-9](?:[-a-z0-9]*[a-z0-9])?/;

const basePathPattern = new RegExp(`^/?${window.SERVER_FLAGS.basePath}`);

export const namespacedPrefixes = ['/search', '/status', '/k8s', '/overview', '/catalog', '/provisionedservices', '/operators', '/operatormanagement', '/operatorhub'];

export const stripBasePath = path => path.replace(basePathPattern, '/');

export const getNSPrefix = path => {
  path = stripBasePath(path);
  return namespacedPrefixes.filter(p => path.startsWith(p))[0];
};

export const getNamespace = path => {
  path = stripBasePath(path);
  const split = path.split('/').filter(x => x);

  if (split[1] === 'all-namespaces') {
    return ALL_NAMESPACES_KEY;
  }

  let ns;
  if (split[1] === 'cluster' && ['namespaces', 'projects'].includes(split[2]) && split[3]) {
    ns = split[3];
  } else if (split[1] === 'ns' && split[2]) {
    ns = split[2];
  } else {
    return;
  }

  const match = ns.match(legalNamePattern);
  return match && match.length > 0 && match[0];
};

export const ExternalLink = ({href, text, additionalClassName=''}) => <a className={classNames('co-external-link', additionalClassName)} href={href} target="_blank" rel="noopener noreferrer">{text}</a>;

export const getURLSearchParams = () => {
  const all = {};
  const params = new URLSearchParams(window.location.search);
  for (const [k, v] of params.entries()) {
    all[k] = v;
  }
  return all;
};

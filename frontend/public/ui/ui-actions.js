'use strict';

import {CONST} from '../const';
import {angulars} from '../components/react-wrapper';

const nsPathPattern = new RegExp(`^\/?ns\/${CONST.legalNamePattern.source}\/?(.*)$`);
const allNsPathPattern = /^\/?all-namespaces\/?(.*)$/;
const prefixes = [];

const isNamespaced = path => {
  return path.match(nsPathPattern) || path.match(allNsPathPattern);
};

export const formatNamespaceRoute = (activeNamespace, originalPath) => {
  const match = isNamespaced(originalPath);
  if (match) {
    const resource = _.find(prefixes, prefix => originalPath.indexOf(prefix) !== -1);
    if (!resource) {
      throw new Error(`Path can't be namespaced: ${originalPath}`);
    }
    originalPath = resource;
  }

  while (originalPath[0] === '/') {
    originalPath = originalPath.substr(1);
  }

  const namespacePrefix = activeNamespace ? `ns/${activeNamespace}/` : 'all-namespaces/';
  return `${namespacePrefix}${originalPath}`;
};

export const types = {
  setActiveNamespace: 'setActiveNamespace',
  loadActiveNamespaceFromStorage: 'loadActiveNamespaceFromStorage',
};

export const registerNamespaceFriendlyPrefix = s => prefixes.push(s);
export const clearPrefixes = () => prefixes.splice(0, prefixes.length);

export const actions = {
  [types.setActiveNamespace]: (oldState, namespace) => {
    const activeNamespace = oldState.UI.get('activeNamespace');

    // make it noop when new active namespace is the same
    // otherwise users will get page refresh and cry about
    // broken direct links and bookmarks
    if (namespace === activeNamespace) {
      return {
        type: types.setActiveNamespace,
        value: namespace,
      };
    }

    if (!namespace) {
      localStorage.removeItem('activeNamespace');
    } else {
      namespace = namespace.trim();
      localStorage.setItem('activeNamespace', namespace);
    }

    const oldPath = angulars.$location.path();
    if (isNamespaced(oldPath)) {
      angulars.$location.path(formatNamespaceRoute(namespace, oldPath));
    }

    return {
      type: types.setActiveNamespace,
      value: namespace,
    };
  },
  [types.loadActiveNamespaceFromStorage]: () => {
    const namespace = localStorage.getItem('activeNamespace') || undefined;
    return {
      type: types.setActiveNamespace,
      value: namespace,
    };
  }
};

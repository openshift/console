'use strict';

import {CONST} from '../const';
import {angulars} from '../components/react-wrapper';

const nsPathPattern = new RegExp(`^\/?ns\/${CONST.legalNamePattern.source}\/?(.*)$`);
const allNsPathPattern = /^\/?all-namespaces\/?(.*)$/;
const prefixes = [];

export const getActiveNamespace = () => angulars.store.getState().UI.get('activeNamespace');

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

export const getNamespacedRoute = path => formatNamespaceRoute(getActiveNamespace(), path);

export const types = {
  initActiveNamespace: 'initActiveNamespace',
  setActiveNamespace: 'setActiveNamespace',
};

export const registerNamespaceFriendlyPrefix = s => prefixes.push(s);

export const actions = {
  [types.initActiveNamespace]: () => ({
    type: types.initActiveNamespace,
    value: angulars.routeParams.ns,
  }),
  [types.setActiveNamespace]: (namespace) => {
    if (namespace) {
      namespace = namespace.trim();
    }

    // make it noop when new active namespace is the same
    // otherwise users will get page refresh and cry about
    // broken direct links and bookmarks
    if (namespace !== getActiveNamespace()) {
      const oldPath = angulars.$location.path();
      if (isNamespaced(oldPath)) {
        angulars.$location.path(formatNamespaceRoute(namespace, oldPath));
      }
    }

    return {
      type: types.setActiveNamespace,
      value: namespace,
    };
  },
};

'use strict';

import {CONST} from '../const';
import {angulars} from '../components/react-wrapper';

const nsPathPattern = new RegExp(`^\/?ns\/${CONST.legalNamePattern.source}\/?(.*)$`);
const allNsPathPattern = /^\/?all-namespaces\/?(.*)$/;
const prefixes = [];

export const getActiveNamespace = () => angulars.store.getState().UI.get('activeNamespace');

export const isNamespaced = path => {
  return path.match(nsPathPattern) || path.match(allNsPathPattern);
};

// Most namespaced urls can't move from one namespace to another,
// but happen to have prefixes that can - for example:
//
//   /ns/NS1/pods/MY_POD
//
// MY_POD is in general only associated with ns1, but /ns/$$/pods
// is valid for all values of $$
//
// Only paths with registered namespace friendly prefixes can be
// re-namespaced, so register your prefixes here as you define the
// associated routes.
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

export const registerNamespaceFriendlyPrefix = s => prefixes.push(s);

export const getNamespacedRoute = path => formatNamespaceRoute(getActiveNamespace(), path);

export const types = {
  initActiveNamespace: 'initActiveNamespace',
  setActiveNamespace: 'setActiveNamespace',
};

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

window.tectonicTesting && (window.tectonicTesting.uiActions = {
  getActiveNamespace,
  getNamespacedRoute,
  setActiveNamespace: ns => angulars.store.dispatch(actions.setActiveNamespace(ns)),
});


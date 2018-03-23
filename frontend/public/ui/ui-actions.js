import * as _ from 'lodash-es';
import store from '../redux';
import { history } from '../components/utils/router';
import { ALL_NAMESPACES_KEY } from '../const';
import { namespacedPrefixes, isNamespaced } from '../components/utils/link';
import { allModels } from '../module/k8s/k8s-models';

// URL routes that can be namespaced
export const namespacedResources = new Set();

allModels().forEach((v, k) => {
  if (!v.namespaced) {
    return;
  }
  if (v.crd) {
    namespacedResources.add(k);
    return;
  }

  namespacedResources.add(v.plural);
});

export const getActiveNamespace = () => store.getState().UI.get('activeNamespace');

export const formatNamespacedRouteForResource = resource => {
  const activeNamespace = getActiveNamespace();
  return activeNamespace === ALL_NAMESPACES_KEY
    ? `/k8s/all-namespaces/${resource}`
    : `/k8s/ns/${activeNamespace}/${resource}`;
};

export const formatNamespaceRoute = (activeNamespace, originalPath, location) => {
  if (!isNamespaced(originalPath)) {
    return originalPath;
  }

  const prefix = _.find(namespacedPrefixes, p => originalPath.startsWith(p));
  if (!prefix) {
    throw new Error(`no prefix for path ${originalPath}?`);
  }

  originalPath = originalPath.substr(prefix.length);

  let parts = originalPath.split('/').filter(p => p);
  let previousNS = '';
  if (parts[0] === 'all-namespaces') {
    parts.shift();
    previousNS = ALL_NAMESPACES_KEY;
  } else if (parts[0] === 'ns') {
    parts.shift();
    previousNS = parts.shift();
  }

  if (previousNS !== activeNamespace && (parts[1] !== 'new' || activeNamespace !== ALL_NAMESPACES_KEY)) {
    // a given resource will not exist when we switch namespaces, so pop off the tail end
    parts = parts.slice(0, 1);
  }

  const namespacePrefix = activeNamespace === ALL_NAMESPACES_KEY ? 'all-namespaces' : `ns/${activeNamespace}`;

  let path = `${prefix}/${namespacePrefix}`;
  if (parts.length) {
    path += `/${parts.join('/')}`;
  }

  if (location) {
    path += `${location.search}${location.hash}`;
  }

  return path;
};

export const types = {
  setActiveNamespace: 'setActiveNamespace',
  setCurrentLocation: 'setCurrentLocation',
  startImpersonate: 'startImpersonate',
  stopImpersonate: 'stopImpersonate',
  sortList: 'sortList',
};

export const UIActions = {
  [types.setCurrentLocation]: (location, ns) => ({location, ns, type: types.setCurrentLocation}),

  [types.setActiveNamespace]: (namespace) => {
    if (namespace) {
      namespace = namespace.trim();
    }

    // make it noop when new active namespace is the same
    // otherwise users will get page refresh and cry about
    // broken direct links and bookmarks
    if (namespace !== getActiveNamespace()) {
      const oldPath = window.location.pathname;
      if (isNamespaced(oldPath)) {
        history.pushPath(formatNamespaceRoute(namespace, oldPath, window.location));
      }
    }

    return {
      type: types.setActiveNamespace,
      value: namespace,
    };
  },

  [types.startImpersonate]: (kind, name) => ({kind, name, type: types.startImpersonate}),

  [types.stopImpersonate]: () => ({type: types.stopImpersonate}),

  [types.sortList]: (listId, field, func, orderBy, column) => {
    const url = new URL(window.location);
    const sp = new URLSearchParams(window.location.search);
    sp.set('orderBy', orderBy);
    sp.set('sortBy', column);
    history.replace(`${url.pathname}?${sp.toString()}${url.hash}`);
    return {listId, field, func, orderBy, type: types.sortList};
  },
};

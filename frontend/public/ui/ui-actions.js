import * as _ from 'lodash';
import store from '../redux';
import { history } from '../components/utils/router';
import { isNamespaced } from '../components/utils/link';
import { allModels, modelFor } from '../module/k8s/k8s-models';

// URL routes that can be namespaced
export const prefixes = new Set(['search', 'applications']);

allModels().forEach((v, k) => {
  if (!v.namespaced) {
    return;
  }
  if (v.crd) {
    prefixes.add(k);
    return;
  }

  prefixes.add(v.plural);
});

export const getActiveNamespace = () => store.getState().UI.get('activeNamespace');

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
export const formatNamespaceRoute = (activeNamespace, originalPath, location) => {
  const isk8s = originalPath.startsWith('/k8s/');
  if (isk8s) {
    originalPath = originalPath.substr(4);
  }
  const match = isNamespaced(originalPath);
  if (match) {
    // The resource is the first URL slug that matches a prefix (e.g. for "/ns/test-ns/jobs/test-job/pods", the resource
    // is "jobs", not "pods")
    const resource = _([...prefixes])
      .filter(p => originalPath.indexOf(p) !== -1)
      .minBy(p => originalPath.indexOf(p));

    if (!resource) {
      const pathComponents = originalPath.split('/');
      let found = false;
      _.each(pathComponents, (pc, i) => {
        pc = _.startCase(pc).slice(0, -1);
        const m = modelFor(pc);
        if (m) {
          originalPath = pathComponents.slice(i).join('/');
          found = true;
          return false;
        }
      });
      if (!found) {
        throw new Error(`Path can't be namespaced: ${originalPath}`);
      }
    }
    originalPath = resource;
  }

  while (originalPath[0] === '/') {
    originalPath = originalPath.substr(1);
  }

  const namespacePrefix = activeNamespace ? `ns/${activeNamespace}/` : 'all-namespaces/';

  let suffix = '';
  if (location) {
    suffix = `${location.search}${location.hash}`;
  }

  return `/k8s/${namespacePrefix}${originalPath}${suffix}`;
};

export const getNamespacedRoute = path => formatNamespaceRoute(getActiveNamespace(), path);

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

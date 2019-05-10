import { Base64 } from 'js-base64';
import * as _ from 'lodash-es';

import store from '../redux';
import { featureActions } from '../features';
import { history } from '../components/utils/router';
import { ALL_NAMESPACES_KEY, LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '../const';
import { getNSPrefix } from '../components/utils/link';
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

export const formatNamespacedRouteForResource = (resource, activeNamespace=getActiveNamespace()) => {
  return activeNamespace === ALL_NAMESPACES_KEY
    ? `/k8s/all-namespaces/${resource}`
    : `/k8s/ns/${activeNamespace}/${resource}`;
};

export const formatNamespaceRoute = (activeNamespace, originalPath, location) => {
  const prefix = getNSPrefix(originalPath);
  if (!prefix) {
    return originalPath;
  }

  originalPath = originalPath.substr(prefix.length + window.SERVER_FLAGS.basePath.length);

  let parts = originalPath.split('/').filter(p => p);
  let previousNS = '';
  if (parts[0] === 'all-namespaces') {
    parts.shift();
    previousNS = ALL_NAMESPACES_KEY;
  } else if (parts[0] === 'ns') {
    parts.shift();
    previousNS = parts.shift();
  }

  if ((previousNS !== activeNamespace && (parts[1] !== 'new' || activeNamespace !== ALL_NAMESPACES_KEY)) || activeNamespace === ALL_NAMESPACES_KEY && parts[1] === 'new') {
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

export const getPodMetric = (pod, metric) => {
  const metrics = store.getState().UI.getIn(['metrics', 'pod']);
  return _.get(metrics, [metric, pod.metadata.namespace, pod.metadata.name], 0);
};

export const types = {
  dismissOverviewDetails: 'dismissOverviewDetails',
  selectOverviewDetailsTab: 'selectOverviewDetailsTab',
  selectOverviewItem: 'selectOverviewItem',
  selectOverviewView: 'selectOverviewView',
  setActiveNamespace: 'setActiveNamespace',
  setCreateProjectMessage: 'setCreateProjectMessage',
  setClusterID: 'setClusterID',
  setCurrentLocation: 'setCurrentLocation',
  setPodMetrics: 'setPodMetrics',
  setMonitoringData: 'setMonitoringData',
  toggleMonitoringGraphs: 'toggleMonitoringGraphs',
  setUser: 'setUser',
  sortList: 'sortList',
  startImpersonate: 'startImpersonate',
  stopImpersonate: 'stopImpersonate',
  updateOverviewMetrics: 'updateOverviewMetrics',
  updateOverviewResources: 'updateOverviewResources',
  updateOverviewSelectedGroup: 'updateOverviewSelectedGroup',
  updateOverviewGroupOptions: 'updateOverviewGroupOptions',
  updateOverviewFilterValue: 'updateOverviewFilterValue',
  updateTimestamps: 'updateTimestamps',
};

/** @type {{[key: string]: function}} */
export const UIActions = {
  [types.setCurrentLocation]: location => ({location, type: types.setCurrentLocation}),

  [types.setClusterID]: clusterID => ({clusterID, type: types.setClusterID}),

  [types.setActiveNamespace]: (namespace) => {
    if (namespace) {
      namespace = namespace.trim();
    }

    // make it noop when new active namespace is the same
    // otherwise users will get page refresh and cry about
    // broken direct links and bookmarks
    if (namespace !== getActiveNamespace()) {
      const oldPath = window.location.pathname;
      if (getNSPrefix(oldPath)) {
        history.pushPath(formatNamespaceRoute(namespace, oldPath, window.location));
      }
      // remember the most recently-viewed project, which is automatically
      // selected when returning to the console
      localStorage.setItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY, namespace);
    }

    return {
      type: types.setActiveNamespace,
      value: namespace,
    };
  },

  [types.startImpersonate]: (kind, name) => async(dispatch, getState) => {
    let textEncoder;
    try {
      textEncoder = new TextEncoder('utf-8');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.info('Browser lacks TextEncoder. Falling back to polyfill.', e);
    }

    if (!textEncoder) {
      textEncoder = await import('text-encoding').then(module => new module.TextEncoder('utf-8'));
    }

    const imp = getState().UI.get('impersonate', {});
    if ((imp.name && imp.name !== name) || (imp.kin && imp.kind !== kind)) {
      // eslint-disable-next-line no-console
      console.warn(`Impersonate race detected: ${name} vs ${imp.name} / ${kind} ${imp.kind}`);
      return;
    }

    /* Subprotocols are comma-separated, so commas aren't allowed. Also "="
     * and "/" aren't allowed, so base64 but replace illegal chars.
     */
    let encodedName = textEncoder.encode(name);
    encodedName = Base64.encode(String.fromCharCode.apply(String, encodedName));
    encodedName = encodedName.replace(/=/g, '_').replace(/\//g, '-');

    let subprotocols;
    if (kind === 'User' ) {
      subprotocols = [`Impersonate-User.${encodedName}`];
    }
    if (kind === 'Group') {
      subprotocols = [`Impersonate-Group.${encodedName}`];
    }

    dispatch({kind, name, subprotocols, type: types.startImpersonate});
    _.each(featureActions, dispatch);
    history.push(window.SERVER_FLAGS.basePath);
  },

  [types.stopImpersonate]: () => dispatch => {
    dispatch({type: types.stopImpersonate});
    _.each(featureActions, dispatch);
    history.push(window.SERVER_FLAGS.basePath);
  },

  [types.sortList]: (listId, field, func, orderBy, column) => {
    const url = new URL(window.location);
    const sp = new URLSearchParams(window.location.search);
    sp.set('orderBy', orderBy);
    sp.set('sortBy', column);
    history.replace(`${url.pathname}?${sp.toString()}${url.hash}`);
    return {listId, field, func, orderBy, type: types.sortList};
  },

  [types.setCreateProjectMessage]: message => ({type: types.setCreateProjectMessage, message}),

  [types.setUser]: user => ({type: types.setUser, user}),

  [types.setPodMetrics]: metrics => ({type: types.setPodMetrics, metrics}),

  [types.selectOverviewView]: view => ({type: types.selectOverviewView, view}),

  [types.selectOverviewItem]: uid => ({type: types.selectOverviewItem, uid}),

  [types.selectOverviewDetailsTab]: tab => ({type: types.selectOverviewDetailsTab, tab}),

  [types.updateOverviewMetrics]: metrics => ({type: types.updateOverviewMetrics, metrics}),

  [types.updateOverviewResources]: resources => ({type: types.updateOverviewResources, resources}),

  [types.updateTimestamps]: (lastTick) => ({type: types.updateTimestamps, lastTick}),

  [types.dismissOverviewDetails]: () => ({type: types.dismissOverviewDetails}),

  [types.updateOverviewSelectedGroup]: (group) => ({type: types.updateOverviewSelectedGroup, group}),

  [types.updateOverviewGroupOptions]: (groups) => ({type: types.updateOverviewGroupOptions, groups}),

  [types.updateOverviewFilterValue]: (value) => ({type: types.updateOverviewFilterValue, value}),

  monitoringLoading: key => ({type: types.setMonitoringData, key, data: {loaded: false, loadError: null, data: null}}),

  monitoringLoaded: (key, data) => ({type: types.setMonitoringData, key, data: {loaded: true, loadError: null, data}}),

  monitoringErrored: (key, loadError) => ({type: types.setMonitoringData, key, data: {loaded: true, loadError, data: null}}),

  [types.toggleMonitoringGraphs]: () => ({type: types.toggleMonitoringGraphs}),
};

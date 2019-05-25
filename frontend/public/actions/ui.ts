import { Base64 } from 'js-base64';
import { action, ActionType as Action } from 'typesafe-actions';

// FIXME(alecmerdler): Do not `import store`
import store from '../redux';
import { history } from '../components/utils/router';
import { ALL_NAMESPACES_KEY, LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '../const';
import { getNSPrefix } from '../components/utils/link';
import { allModels } from '../module/k8s/k8s-models';
import { detectFeatures } from './features';
import { OverviewSpecialGroup } from '../components/overview/constants';
import { OverviewItem } from '../components/overview';

export enum ActionType {
  DismissOverviewDetails = 'dismissOverviewDetails',
  SelectOverviewDetailsTab = 'selectOverviewDetailsTab',
  SelectOverviewItem = 'selectOverviewItem',
  SelectOverviewView = 'selectOverviewView',
  SetActiveNamespace = 'setActiveNamespace',
  SetCreateProjectMessage = 'setCreateProjectMessage',
  SetCurrentLocation = 'setCurrentLocation',
  SetMonitoringData = 'setMonitoringData',
  ToggleMonitoringGraphs = 'monitoringToggleGraphs',
  SetUser = 'setUser',
  SortList = 'sortList',
  BeginImpersonate = 'beginImpersonate',
  EndImpersonate = 'endImpersonate',
  UpdateOverviewMetrics = 'updateOverviewMetrics',
  UpdateOverviewResources = 'updateOverviewResources',
  UpdateOverviewSelectedGroup = 'updateOverviewSelectedGroup',
  UpdateOverviewGroupOptions = 'updateOverviewGroupOptions',
  UpdateOverviewFilterValue = 'updateOverviewFilterValue',
  UpdateTimestamps = 'updateTimestamps',
}

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

export const getActiveNamespace = (): string => store.getState().UI.get('activeNamespace');

export const formatNamespacedRouteForResource = (resource, activeNamespace = getActiveNamespace()) => {
  return activeNamespace === ALL_NAMESPACES_KEY
    ? `/k8s/all-namespaces/${resource}`
    : `/k8s/ns/${activeNamespace}/${resource}`;
};

export const formatNamespaceRoute = (activeNamespace, originalPath, location?) => {
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

export const setCurrentLocation = (location: string) => action(ActionType.SetCurrentLocation, {location});
export const setActiveNamespace = (namespace: string = '') => {
  namespace = namespace.trim();
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

  return action(ActionType.SetActiveNamespace, {namespace});
};
export const beginImpersonate = (kind: string, name: string, subprotocols: string[]) => action(ActionType.BeginImpersonate, {kind, name, subprotocols});
export const endImpersonate = () => action(ActionType.EndImpersonate);
export const startImpersonate = (kind: string, name: string) => async(dispatch, getState) => {
  let textEncoder;
  try {
    textEncoder = new TextEncoder();
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

  /**
   * Subprotocols are comma-separated, so commas aren't allowed. Also "="
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

  dispatch(beginImpersonate(kind, name, subprotocols));
  dispatch(detectFeatures());
  history.push(window.SERVER_FLAGS.basePath);
};
export const stopImpersonate = () => (dispatch) => {
  dispatch(endImpersonate());
  dispatch(detectFeatures());
  history.push(window.SERVER_FLAGS.basePath);
};
export const sortList = (listId: string, field: string, func: any, orderBy: string, column: string) => {
  const url = new URL(window.location.href);
  const sp = new URLSearchParams(window.location.search);
  sp.set('orderBy', orderBy);
  sp.set('sortBy', column);
  history.replace(`${url.pathname}?${sp.toString()}${url.hash}`);

  return action(ActionType.SortList, {listId, field, func, orderBy});
};
export const setCreateProjectMessage = (message: string) => action(ActionType.SetCreateProjectMessage, {message});
export const setUser = (user: any) => action(ActionType.SetUser, {user});
export const selectOverviewView = (view: string) => action(ActionType.SelectOverviewView, {view});
export const selectOverviewItem = (uid: string) => action(ActionType.SelectOverviewItem, {uid});
export const selectOverviewDetailsTab = (tab: string) => action(ActionType.SelectOverviewDetailsTab, {tab});
export const updateOverviewMetrics = (metrics: any) => action(ActionType.UpdateOverviewMetrics, {metrics});
export const updateOverviewResources = (resources: OverviewItem[]) => action(ActionType.UpdateOverviewResources, {resources});
export const updateTimestamps = (lastTick: number) => action(ActionType.UpdateTimestamps, {lastTick});
export const dismissOverviewDetails = () => action(ActionType.DismissOverviewDetails);
export const updateOverviewSelectedGroup = (group: OverviewSpecialGroup) => action(ActionType.UpdateOverviewSelectedGroup, {group});
export const updateOverviewGroupOptions = (groups: {[label: string]: string}) => action(ActionType.UpdateOverviewGroupOptions, {groups});
export const updateOverviewFilterValue = (value: string) => action(ActionType.UpdateOverviewFilterValue, {value});
export const monitoringLoading = (key: 'alerts' | 'silences') => action(ActionType.SetMonitoringData, {key, data: {loaded: false, loadError: null, data: null}});
export const monitoringLoaded = (key: 'alerts' | 'silences', data: any) => action(ActionType.SetMonitoringData, {key, data: {loaded: true, loadError: null, data}});
export const monitoringErrored = (key: 'alerts' | 'silences', loadError: any) => action(ActionType.SetMonitoringData, {key, data: {loaded: true, loadError, data: null}});
export const monitoringToggleGraphs = () => action(ActionType.ToggleMonitoringGraphs);

// TODO(alecmerdler): Implement all actions using `typesafe-actions` and add them to this export
const uiActions = {
  setCurrentLocation,
  setActiveNamespace,
  beginImpersonate,
  endImpersonate,
  sortList,
  setCreateProjectMessage,
  setUser,
  selectOverviewView,
  selectOverviewItem,
  selectOverviewDetailsTab,
  updateOverviewMetrics,
  updateOverviewResources,
  updateTimestamps,
  dismissOverviewDetails,
  updateOverviewSelectedGroup,
  updateOverviewGroupOptions,
  updateOverviewFilterValue,
  monitoringLoading,
  monitoringLoaded,
  monitoringErrored,
  monitoringToggleGraphs,
};

export type UIAction = Action<typeof uiActions>;

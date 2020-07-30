import { Base64 } from 'js-base64';
import { action, ActionType as Action } from 'typesafe-actions';
import * as _ from 'lodash-es';

// FIXME(alecmerdler): Do not `import store`
import store from '../redux';
import { history } from '../components/utils/router';
import { OverviewItem } from '@console/shared';
import {
  ALL_NAMESPACES_KEY,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  LAST_PERSPECTIVE_LOCAL_STORAGE_KEY,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants';
import { K8sResourceKind, PodKind, NodeKind } from '../module/k8s';
import { allModels } from '../module/k8s/k8s-models';
import { detectFeatures, clearSSARFlags } from './features';
import { OverviewSpecialGroup } from '../components/overview/constants';
import { setClusterID, setCreateProjectMessage, setUser, setConsoleLinks } from './common';
import { Rule } from '../components/monitoring/types';

export enum ActionType {
  SetTableColumns = 'setTableColumns',
  DismissOverviewDetails = 'dismissOverviewDetails',
  SelectOverviewDetailsTab = 'selectOverviewDetailsTab',
  SelectOverviewItem = 'selectOverviewItem',
  SetActiveApplication = 'setActiveApplication',
  SetActiveNamespace = 'setActiveNamespace',
  SetActivePerspective = 'setActivePerspective',
  SetCreateProjectMessage = 'setCreateProjectMessage',
  SetCurrentLocation = 'setCurrentLocation',
  MonitoringDashboardsClearVariables = 'monitoringDashboardsClearVariables',
  MonitoringDashboardsPatchVariable = 'monitoringDashboardsPatchVariable',
  MonitoringDashboardsPatchAllVariables = 'monitoringDashboardsPatchAllVariables',
  MonitoringDashboardsSetPollInterval = 'monitoringDashboardsSetPollInterval',
  MonitoringDashboardsSetTimespan = 'monitoringDashboardsSetTimespan',
  MonitoringDashboardsVariableOptionsLoaded = 'monitoringDashboardsVariableOptionsLoaded',
  MonitoringSetRules = 'monitoringSetRules',
  SetMonitoringData = 'setMonitoringData',
  ToggleMonitoringGraphs = 'monitoringToggleGraphs',
  NotificationDrawerToggleExpanded = 'notificationDrawerExpanded',
  NotificationDrawerToggleRead = 'notificationDrawerRead',
  QueryBrowserAddQuery = 'queryBrowserAddQuery',
  QueryBrowserDeleteAllQueries = 'queryBrowserDeleteAllQueries',
  QueryBrowserDeleteQuery = 'queryBrowserDeleteQuery',
  QueryBrowserDismissNamespaceAlert = 'queryBrowserDismissNamespaceAlert',
  QueryBrowserInsertText = 'queryBrowserInsertText',
  QueryBrowserPatchQuery = 'queryBrowserPatchQuery',
  QueryBrowserRunQueries = 'queryBrowserRunQueries',
  QueryBrowserSetAllExpanded = 'queryBrowserSetAllExpanded',
  QueryBrowserSetMetrics = 'queryBrowserSetMetrics',
  QueryBrowserSetPollInterval = 'queryBrowserSetPollInterval',
  QueryBrowserToggleIsEnabled = 'queryBrowserToggleIsEnabled',
  QueryBrowserToggleSeries = 'queryBrowserToggleSeries',
  SetClusterID = 'setClusterID',
  SetUser = 'setUser',
  SortList = 'sortList',
  BeginImpersonate = 'beginImpersonate',
  EndImpersonate = 'endImpersonate',
  UpdateOverviewMetrics = 'updateOverviewMetrics',
  UpdateOverviewResources = 'updateOverviewResources',
  UpdateOverviewSelectedGroup = 'updateOverviewSelectedGroup',
  UpdateOverviewLabels = 'updateOverviewLabels',
  UpdateOverviewFilterValue = 'updateOverviewFilterValue',
  UpdateTimestamps = 'updateTimestamps',
  SetConsoleLinks = 'setConsoleLinks',
  SetPodMetrics = 'setPodMetrics',
  SetNamespaceMetrics = 'setNamespaceMetrics',
  SetNodeMetrics = 'setNodeMetrics',
  SetPVCMetrics = 'setPVCMetrics',
  SetPinnedResources = 'setPinnedResources',
}

type MetricValuesByName = {
  [name: string]: number;
};

export type NamespaceMetrics = {
  cpu: MetricValuesByName;
  memory: MetricValuesByName;
};

type MetricValuesByNamespace = {
  [namespace: string]: MetricValuesByName;
};

export type PodMetrics = {
  cpu: MetricValuesByNamespace;
  memory: MetricValuesByNamespace;
};

export type NodeMetrics = {
  cpu: MetricValuesByName;
  pods: MetricValuesByName;
  usedMemory: MetricValuesByName;
  totalMemory: MetricValuesByName;
  usedStorage: MetricValuesByName;
  totalStorage: MetricValuesByName;
};

export type PVCMetrics = {
  usedCapacity: MetricValuesByName;
};

// URL routes that can be namespaced
export const namespacedResources = new Set();

allModels().forEach((v, k) => {
  if (!v.namespaced) {
    return;
  }
  if (v.crd) {
    namespacedResources.add(k);
  }
  if (!v.crd || v.legacyPluralURL) {
    namespacedResources.add(v.plural);
  }
});

export const getActiveNamespace = (): string => store.getState().UI.get('activeNamespace');

export const getNamespaceMetric = (ns: K8sResourceKind, metric: string): number => {
  const metrics = store.getState().UI.getIn(['metrics', 'namespace']);
  return _.get(metrics, [metric, ns.metadata.name], 0);
};

export const getPodMetric = (pod: PodKind, metric: string): number => {
  const metrics = store.getState().UI.getIn(['metrics', 'pod']);
  return metrics?.[metric]?.[pod.metadata.namespace]?.[pod.metadata.name] ?? 0;
};

export const getNodeMetric = (node: NodeKind, metric: string): number => {
  const metrics = store.getState().UI.getIn(['metrics', 'node']);
  return metrics?.[metric]?.[node.metadata.name] ?? 0;
};

export const getPVCMetric = (pvc: K8sResourceKind, metric: string): number => {
  const metrics = store.getState().UI.getIn(['metrics', 'pvc']);
  return metrics?.[metric]?.[pvc.metadata.namespace]?.[pvc.metadata.name] ?? 0;
};

export const formatNamespaceRoute = (activeNamespace, originalPath, location?) => {
  let path = originalPath.substr(window.SERVER_FLAGS.basePath.length);

  let parts = path.split('/').filter((p) => p);
  const prefix = parts.shift();

  let previousNS;
  if (parts[0] === 'all-namespaces') {
    parts.shift();
    previousNS = ALL_NAMESPACES_KEY;
  } else if (parts[0] === 'ns') {
    parts.shift();
    previousNS = parts.shift();
  }

  if (!previousNS) {
    return originalPath;
  }

  if (
    (previousNS !== activeNamespace &&
      (parts[1] !== 'new' || activeNamespace !== ALL_NAMESPACES_KEY)) ||
    (activeNamespace === ALL_NAMESPACES_KEY && parts[1] === 'new')
  ) {
    // a given resource will not exist when we switch namespaces, so pop off the tail end
    parts = parts.slice(0, 1);
  }

  const namespacePrefix =
    activeNamespace === ALL_NAMESPACES_KEY ? 'all-namespaces' : `ns/${activeNamespace}`;

  path = `/${prefix}/${namespacePrefix}`;
  if (parts.length) {
    path += `/${parts.join('/')}`;
  }

  if (location) {
    path += `${location.search}${location.hash}`;
  }

  return path;
};

export const setCurrentLocation = (location: string) =>
  action(ActionType.SetCurrentLocation, { location });

export const setActiveApplication = (application: string) => {
  return action(ActionType.SetActiveApplication, { application });
};

export const setActiveNamespace = (namespace: string = '') => {
  namespace = namespace.trim();
  // make it noop when new active namespace is the same
  // otherwise users will get page refresh and cry about
  // broken direct links and bookmarks
  if (namespace !== getActiveNamespace()) {
    const oldPath = window.location.pathname;
    const newPath = formatNamespaceRoute(namespace, oldPath, window.location);
    if (newPath !== oldPath) {
      history.pushPath(newPath);
    }
    // remember the most recently-viewed project, which is automatically
    // selected when returning to the console
    localStorage.setItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY, namespace);
  }

  return action(ActionType.SetActiveNamespace, { namespace });
};

export const setActivePerspective = (perspective: string) => {
  // remember the most recently-viewed perspective, which is automatically
  // selected when returning to the console
  localStorage.setItem(LAST_PERSPECTIVE_LOCAL_STORAGE_KEY, perspective);
  return action(ActionType.SetActivePerspective, { perspective });
};

export const setPinnedResources = (resources: string[]) => {
  return action(ActionType.SetPinnedResources, { resources });
};

export const beginImpersonate = (kind: string, name: string, subprotocols: string[]) =>
  action(ActionType.BeginImpersonate, { kind, name, subprotocols });
export const endImpersonate = () => action(ActionType.EndImpersonate);
export const startImpersonate = (kind: string, name: string) => async (dispatch, getState) => {
  let textEncoder;
  try {
    textEncoder = new TextEncoder();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.info('Browser lacks TextEncoder. Falling back to polyfill.', e);
  }

  if (!textEncoder) {
    textEncoder = await import('text-encoding').then((module) => new module.TextEncoder('utf-8'));
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
  if (kind === 'User') {
    subprotocols = [`Impersonate-User.${encodedName}`];
  }
  if (kind === 'Group') {
    subprotocols = [`Impersonate-Group.${encodedName}`];
  }

  dispatch(beginImpersonate(kind, name, subprotocols));
  dispatch(clearSSARFlags());
  dispatch(detectFeatures());
  history.push(window.SERVER_FLAGS.basePath);
};
export const stopImpersonate = () => (dispatch) => {
  dispatch(endImpersonate());
  dispatch(clearSSARFlags());
  dispatch(detectFeatures());
  history.push(window.SERVER_FLAGS.basePath);
};
export const sortList = (
  listId: string,
  field: string,
  func: string,
  orderBy: string,
  column: string,
) => {
  const url = new URL(window.location.href);
  const sp = new URLSearchParams(window.location.search);
  sp.set('orderBy', orderBy);
  sp.set('sortBy', column);
  history.replace(`${url.pathname}?${sp.toString()}${url.hash}`);

  return action(ActionType.SortList, { listId, field, func, orderBy });
};
export const setTableColumns = (id: string, selectedColumns: Set<string>) => {
  let currentColumns = {};
  try {
    currentColumns = JSON.parse(localStorage.getItem(COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY)) || {};
  } catch (e) {
    // Error parsing the data, do not store the current filters
    /* eslint-disable-next-line no-console */
    console.error('Error parsing column filters from local storage', e);
    currentColumns = {};
  }
  currentColumns[id] = [...selectedColumns];
  localStorage.setItem(COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY, JSON.stringify(currentColumns));
  return action(ActionType.SetTableColumns, { id, selectedColumns });
};
export const selectOverviewItem = (uid: string) => action(ActionType.SelectOverviewItem, { uid });
export const selectOverviewDetailsTab = (tab: string) =>
  action(ActionType.SelectOverviewDetailsTab, { tab });
export const updateOverviewMetrics = (metrics: any) =>
  action(ActionType.UpdateOverviewMetrics, { metrics });
export const updateOverviewResources = (resources: OverviewItem[]) =>
  action(ActionType.UpdateOverviewResources, { resources });
export const updateTimestamps = (lastTick: number) =>
  action(ActionType.UpdateTimestamps, { lastTick });
export const dismissOverviewDetails = () => action(ActionType.DismissOverviewDetails);
export const updateOverviewSelectedGroup = (group: OverviewSpecialGroup | string) =>
  action(ActionType.UpdateOverviewSelectedGroup, { group });
export const updateOverviewLabels = (labels: string[]) =>
  action(ActionType.UpdateOverviewLabels, { labels });
export const updateOverviewFilterValue = (value: string) =>
  action(ActionType.UpdateOverviewFilterValue, { value });
export const monitoringDashboardsClearVariables = () =>
  action(ActionType.MonitoringDashboardsClearVariables);
export const monitoringDashboardsPatchVariable = (key: string, patch: any) =>
  action(ActionType.MonitoringDashboardsPatchVariable, { key, patch });
export const monitoringDashboardsPatchAllVariables = (variables: any) =>
  action(ActionType.MonitoringDashboardsPatchAllVariables, { variables });
export const monitoringDashboardsSetPollInterval = (pollInterval: number) =>
  action(ActionType.MonitoringDashboardsSetPollInterval, { pollInterval });
export const monitoringDashboardsSetTimespan = (timespan: number) =>
  action(ActionType.MonitoringDashboardsSetTimespan, { timespan });
export const monitoringDashboardsVariableOptionsLoaded = (key: string, newOptions: string[]) =>
  action(ActionType.MonitoringDashboardsVariableOptionsLoaded, { key, newOptions });
export const monitoringLoading = (
  key: 'alerts' | 'silences' | 'notificationAlerts',
  perspective = 'admin',
) =>
  action(ActionType.SetMonitoringData, {
    key,
    data: { loaded: false, loadError: null, data: null, perspective },
  });
export const monitoringLoaded = (
  key: 'alerts' | 'silences' | 'notificationAlerts' | 'devAlerts',
  alerts: any,
  perspective = 'admin',
) =>
  action(ActionType.SetMonitoringData, {
    key,
    data: { loaded: true, loadError: null, data: alerts, perspective },
  });
export const monitoringErrored = (
  key: 'alerts' | 'silences' | 'notificationAlerts',
  loadError: any,
  perspective = 'admin',
) =>
  action(ActionType.SetMonitoringData, {
    key,
    data: { loaded: true, loadError, data: null, perspective },
  });
export const monitoringSetRules = (key: 'rules' | 'devRules', rules: Rule[]) =>
  action(ActionType.MonitoringSetRules, { key, data: rules });
export const monitoringToggleGraphs = () => action(ActionType.ToggleMonitoringGraphs);
export const notificationDrawerToggleExpanded = () =>
  action(ActionType.NotificationDrawerToggleExpanded);
export const notificationDrawerToggleRead = () => action(ActionType.NotificationDrawerToggleRead);
export const queryBrowserAddQuery = () => action(ActionType.QueryBrowserAddQuery);
export const queryBrowserDeleteAllQueries = () => action(ActionType.QueryBrowserDeleteAllQueries);
export const queryBrowserDismissNamespaceAlert = () =>
  action(ActionType.QueryBrowserDismissNamespaceAlert);
export const queryBrowserDeleteQuery = (index: number) =>
  action(ActionType.QueryBrowserDeleteQuery, { index });
export const queryBrowserInsertText = (
  index: number,
  newText: string,
  replaceFrom: number,
  replaceTo: number,
) => {
  return action(ActionType.QueryBrowserInsertText, { index, newText, replaceFrom, replaceTo });
};
export const queryBrowserPatchQuery = (index: number, patch: { [key: string]: unknown }) => {
  return action(ActionType.QueryBrowserPatchQuery, { index, patch });
};
export const queryBrowserRunQueries = () => action(ActionType.QueryBrowserRunQueries);
export const queryBrowserSetAllExpanded = (isExpanded: boolean) => {
  return action(ActionType.QueryBrowserSetAllExpanded, { isExpanded });
};
export const queryBrowserSetMetrics = (metrics: string[]) =>
  action(ActionType.QueryBrowserSetMetrics, { metrics });
export const queryBrowserSetPollInterval = (pollInterval: number) =>
  action(ActionType.QueryBrowserSetPollInterval, { pollInterval });
export const queryBrowserToggleIsEnabled = (index: number) =>
  action(ActionType.QueryBrowserToggleIsEnabled, { index });
export const queryBrowserToggleSeries = (index: number, labels: { [key: string]: unknown }) => {
  return action(ActionType.QueryBrowserToggleSeries, { index, labels });
};
export const setPodMetrics = (podMetrics: PodMetrics) =>
  action(ActionType.SetPodMetrics, { podMetrics });
export const setNamespaceMetrics = (namespaceMetrics: NamespaceMetrics) =>
  action(ActionType.SetNamespaceMetrics, { namespaceMetrics });
export const setNodeMetrics = (nodeMetrics: NodeMetrics) =>
  action(ActionType.SetNodeMetrics, { nodeMetrics });
export const setPVCMetrics = (pvcMetrics: PVCMetrics) =>
  action(ActionType.SetPVCMetrics, { pvcMetrics });

// TODO(alecmerdler): Implement all actions using `typesafe-actions` and add them to this export
const uiActions = {
  setTableColumns,
  setCurrentLocation,
  setActiveApplication,
  setActiveNamespace,
  setActivePerspective,
  beginImpersonate,
  endImpersonate,
  sortList,
  setCreateProjectMessage,
  setClusterID,
  setUser,
  selectOverviewItem,
  selectOverviewDetailsTab,
  updateOverviewMetrics,
  updateOverviewResources,
  updateTimestamps,
  dismissOverviewDetails,
  updateOverviewSelectedGroup,
  updateOverviewLabels,
  updateOverviewFilterValue,
  monitoringDashboardsClearVariables,
  monitoringDashboardsPatchVariable,
  monitoringDashboardsPatchAllVariables,
  monitoringDashboardsSetPollInterval,
  monitoringDashboardsSetTimespan,
  monitoringDashboardsVariableOptionsLoaded,
  monitoringLoading,
  monitoringLoaded,
  monitoringErrored,
  monitoringSetRules,
  monitoringToggleGraphs,
  queryBrowserAddQuery,
  queryBrowserDeleteAllQueries,
  queryBrowserDeleteQuery,
  queryBrowserDismissNamespaceAlert,
  queryBrowserInsertText,
  queryBrowserPatchQuery,
  queryBrowserRunQueries,
  queryBrowserSetAllExpanded,
  queryBrowserSetMetrics,
  queryBrowserSetPollInterval,
  queryBrowserToggleIsEnabled,
  queryBrowserToggleSeries,
  setConsoleLinks,
  setPodMetrics,
  setNamespaceMetrics,
  setNodeMetrics,
  setPVCMetrics,
  notificationDrawerToggleExpanded,
  notificationDrawerToggleRead,
  setPinnedResources,
};

export type UIAction = Action<typeof uiActions>;

import { Base64 } from 'js-base64';
import { action, ActionType as Action } from 'typesafe-actions';
import * as _ from 'lodash-es';

// FIXME(alecmerdler): Do not `import store`
import store from '../redux';
import { OverviewItem } from '@console/shared';
import {
  ALL_NAMESPACES_KEY,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants';
import { K8sResourceKind, PodKind, NodeKind } from '../module/k8s';
import { allModels } from '../module/k8s/k8s-models';
import { detectFeatures, clearSSARFlags } from './features';
import { OverviewSpecialGroup } from '../components/overview/constants';
import { setClusterID, setCreateProjectMessage } from './common';
import { subsClient } from '../graphql/client';
import {
  beginImpersonate,
  endImpersonate,
  getUser,
  getImpersonate,
} from '@console/dynamic-plugin-sdk';

export enum ActionType {
  DismissOverviewDetails = 'dismissOverviewDetails',
  SelectOverviewDetailsTab = 'selectOverviewDetailsTab',
  SelectOverviewItem = 'selectOverviewItem',
  SetActiveApplication = 'setActiveApplication',
  SetActiveNamespace = 'setActiveNamespace',
  SetCreateProjectMessage = 'setCreateProjectMessage',
  SetCurrentLocation = 'setCurrentLocation',
  SetServiceLevel = 'setServiceLevel',
  NotificationDrawerToggleExpanded = 'notificationDrawerExpanded',
  SetClusterID = 'setClusterID',
  SortList = 'sortList',
  UpdateOverviewMetrics = 'updateOverviewMetrics',
  UpdateOverviewResources = 'updateOverviewResources',
  UpdateOverviewSelectedGroup = 'updateOverviewSelectedGroup',
  UpdateOverviewLabels = 'updateOverviewLabels',
  UpdateOverviewFilterValue = 'updateOverviewFilterValue',
  UpdateTimestamps = 'updateTimestamps',
  SetPodMetrics = 'setPodMetrics',
  SetNamespaceMetrics = 'setNamespaceMetrics',
  SetNodeMetrics = 'setNodeMetrics',
  SetPVCMetrics = 'setPVCMetrics',
  SetUtilizationDuration = 'SetUtilizationDuration',
  SetUtilizationDurationSelectedKey = 'SetUtilizationDurationSelectedKey',
  SetUtilizationDurationEndTime = 'SetUtilizationDurationEndTime',
  SetShowOperandsInAllNamespaces = 'setShowOperandsInAllNamespaces',
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
  totalCPU: MetricValuesByName;
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
let namespacedResources;

export const getNamespacedResources = () => {
  if (!namespacedResources) {
    namespacedResources = new Set();
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
  }
  return namespacedResources;
};

export const getActiveNamespace = (): string => store.getState().UI.get('activeNamespace');
export const getActiveUserName = (): string => getUser(store.getState())?.username;

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

export const formatNamespaceRoute = (
  activeNamespace,
  originalPath,
  location?,
  forceList?: boolean,
) => {
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
    (activeNamespace === ALL_NAMESPACES_KEY && parts[1] === 'new') ||
    forceList
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

export const setServiceLevel = (
  serviceLevel: string,
  daysRemaining: number = null,
  clusterID: string = '',
  trialDateEnd: string = null,
  hasSecretAccess: boolean = false,
) =>
  action(ActionType.SetServiceLevel, {
    serviceLevel,
    daysRemaining,
    clusterID,
    trialDateEnd,
    hasSecretAccess,
  });

export const setActiveApplication = (application: string) => {
  return action(ActionType.SetActiveApplication, { application });
};

export const setActiveNamespace = (namespace: string = '') => {
  namespace = namespace.trim();
  // make it noop when new active namespace is the same
  // otherwise users will get page refresh and cry about
  // broken direct links and bookmarks
  if (namespace !== getActiveNamespace()) {
    // save last namespace in session storage (persisted only for current browser tab). Used to remember/restore if
    // "All Projects" was selected when returning to the list view (typically from details view) via breadcrumb or
    // sidebar navigation
    sessionStorage.setItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY, namespace);
  }

  return action(ActionType.SetActiveNamespace, { namespace });
};

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

  const imp = getImpersonate(getState());
  if ((imp?.name && imp.name !== name) || (imp?.kind && imp.kind !== kind)) {
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
  subsClient.close(false, true);
  dispatch(clearSSARFlags());
  dispatch(detectFeatures());
};
export const stopImpersonate = () => (dispatch) => {
  dispatch(endImpersonate());
  subsClient.close(false, true);
  dispatch(clearSSARFlags());
  dispatch(detectFeatures());
};
export const sortList = (listId: string, field: string, func: string, orderBy: string) => {
  // const url = new URL(window.location.href);
  // const sp = new URLSearchParams(window.location.search);
  // sp.set('orderBy', orderBy);
  // sp.set('sortBy', column);
  // history.replace(`${url.pathname}?${sp.toString()}${url.hash}`);

  return action(ActionType.SortList, { listId, field, func, orderBy });
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
export const notificationDrawerToggleExpanded = () =>
  action(ActionType.NotificationDrawerToggleExpanded);
export const setPodMetrics = (podMetrics: PodMetrics) =>
  action(ActionType.SetPodMetrics, { podMetrics });
export const setNamespaceMetrics = (namespaceMetrics: NamespaceMetrics) =>
  action(ActionType.SetNamespaceMetrics, { namespaceMetrics });
export const setNodeMetrics = (nodeMetrics: NodeMetrics) =>
  action(ActionType.SetNodeMetrics, { nodeMetrics });
export const setPVCMetrics = (pvcMetrics: PVCMetrics) =>
  action(ActionType.SetPVCMetrics, { pvcMetrics });
export const setUtilizationDuration = (duration) =>
  action(ActionType.SetUtilizationDuration, { duration });
export const setUtilizationDurationSelectedKey = (key) =>
  action(ActionType.SetUtilizationDurationSelectedKey, { key });
export const setUtilizationDurationEndTime = (endTime) =>
  action(ActionType.SetUtilizationDurationEndTime, { endTime });

export const setShowOperandsInAllNamespaces = (value: boolean) => {
  return action(ActionType.SetShowOperandsInAllNamespaces, { value });
};

// TODO(alecmerdler): Implement all actions using `typesafe-actions` and add them to this export
const uiActions = {
  setCurrentLocation,
  setShowOperandsInAllNamespaces,
  setActiveApplication,
  setActiveNamespace,
  sortList,
  setCreateProjectMessage,
  setClusterID,
  selectOverviewItem,
  selectOverviewDetailsTab,
  setServiceLevel,
  updateOverviewMetrics,
  updateOverviewResources,
  updateTimestamps,
  dismissOverviewDetails,
  updateOverviewSelectedGroup,
  updateOverviewLabels,
  updateOverviewFilterValue,
  setPodMetrics,
  setNamespaceMetrics,
  setNodeMetrics,
  setPVCMetrics,
  notificationDrawerToggleExpanded,
  setUtilizationDuration,
  setUtilizationDurationSelectedKey,
  setUtilizationDurationEndTime,
};

export type UIAction = Action<typeof uiActions>;

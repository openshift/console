import { action, ActionType as Action } from 'typesafe-actions';

import { Rule } from '../components/monitoring/types';

export enum ActionType {
  AlertingSetData = 'alertingSetData',
  AlertingSetRules = 'alertingSetRules',
  DashboardsPatchAllVariables = 'dashboardsPatchAllVariables',
  DashboardsPatchVariable = 'dashboardsPatchVariable',
  DashboardsSetEndTime = 'dashboardsSetEndTime',
  DashboardsSetPollInterval = 'dashboardsSetPollInterval',
  DashboardsSetTimespan = 'dashboardsSetTimespan',
  DashboardsVariableOptionsLoaded = 'dashboardsVariableOptionsLoaded',
  QueryBrowserAddQuery = 'queryBrowserAddQuery',
  QueryBrowserDuplicateQuery = 'queryBrowserDuplicateQuery',
  QueryBrowserDeleteAllQueries = 'queryBrowserDeleteAllQueries',
  QueryBrowserDeleteAllSeries = 'queryBrowserDeleteAllSeries',
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
  SetAlertCount = 'SetAlertCount',
  ToggleGraphs = 'toggleGraphs',
}

export const dashboardsPatchVariable = (key: string, patch: any, perspective: string) =>
  action(ActionType.DashboardsPatchVariable, { key, patch, perspective });

export const dashboardsPatchAllVariables = (variables: any, perspective: string) =>
  action(ActionType.DashboardsPatchAllVariables, { variables, perspective });

export const dashboardsSetEndTime = (endTime: number, perspective: string) =>
  action(ActionType.DashboardsSetEndTime, { endTime, perspective });

export const dashboardsSetPollInterval = (pollInterval: number, perspective: string) =>
  action(ActionType.DashboardsSetPollInterval, { pollInterval, perspective });

export const dashboardsSetTimespan = (timespan: number, perspective: string) =>
  action(ActionType.DashboardsSetTimespan, { timespan, perspective });

export const dashboardsVariableOptionsLoaded = (
  key: string,
  newOptions: string[],
  perspective: string,
) => action(ActionType.DashboardsVariableOptionsLoaded, { key, newOptions, perspective });

export const alertingLoading = (
  key: 'alerts' | 'silences' | 'notificationAlerts',
  perspective = 'admin',
) =>
  action(ActionType.AlertingSetData, {
    key,
    data: { loaded: false, loadError: null, data: null, perspective },
  });

export const alertingLoaded = (
  key: 'alerts' | 'silences' | 'notificationAlerts' | 'devAlerts',
  alerts: any,
  perspective = 'admin',
) =>
  action(ActionType.AlertingSetData, {
    key,
    data: { loaded: true, loadError: null, data: alerts, perspective },
  });

export const alertingErrored = (
  key: 'alerts' | 'silences' | 'notificationAlerts' | 'devAlerts',
  loadError: Error,
  perspective = 'admin',
) =>
  action(ActionType.AlertingSetData, {
    key,
    data: { loaded: true, loadError, data: null, perspective },
  });

export const alertingSetRules = (key: 'rules' | 'devRules', rules: Rule[], perspective = 'admin') =>
  action(ActionType.AlertingSetRules, { key, data: rules, perspective });

export const toggleGraphs = () => action(ActionType.ToggleGraphs);

export const queryBrowserAddQuery = () => action(ActionType.QueryBrowserAddQuery);

export const queryBrowserDuplicateQuery = (index: number) =>
  action(ActionType.QueryBrowserDuplicateQuery, { index });

export const queryBrowserDeleteAllQueries = () => action(ActionType.QueryBrowserDeleteAllQueries);

export const queryBrowserDeleteAllSeries = () => action(ActionType.QueryBrowserDeleteAllSeries);

export const queryBrowserDismissNamespaceAlert = () =>
  action(ActionType.QueryBrowserDismissNamespaceAlert);

export const queryBrowserDeleteQuery = (index: number) =>
  action(ActionType.QueryBrowserDeleteQuery, { index });

export const queryBrowserInsertText = (
  index: number,
  newText: string,
  replaceFrom: number,
  replaceTo: number,
) => action(ActionType.QueryBrowserInsertText, { index, newText, replaceFrom, replaceTo });

export const queryBrowserPatchQuery = (index: number, patch: { [key: string]: unknown }) =>
  action(ActionType.QueryBrowserPatchQuery, { index, patch });

export const queryBrowserRunQueries = () => action(ActionType.QueryBrowserRunQueries);

export const queryBrowserSetAllExpanded = (isExpanded: boolean) =>
  action(ActionType.QueryBrowserSetAllExpanded, { isExpanded });

export const queryBrowserSetMetrics = (metrics: string[]) =>
  action(ActionType.QueryBrowserSetMetrics, { metrics });

export const queryBrowserSetPollInterval = (pollInterval: number) =>
  action(ActionType.QueryBrowserSetPollInterval, { pollInterval });

export const queryBrowserToggleIsEnabled = (index: number) =>
  action(ActionType.QueryBrowserToggleIsEnabled, { index });

export const queryBrowserToggleSeries = (index: number, labels: { [key: string]: unknown }) =>
  action(ActionType.QueryBrowserToggleSeries, { index, labels });

export const setAlertCount = (alertCount) => action(ActionType.SetAlertCount, { alertCount });

const actions = {
  alertingErrored,
  alertingLoaded,
  alertingLoading,
  alertingSetRules,
  dashboardsPatchAllVariables,
  dashboardsPatchVariable,
  dashboardsSetEndTime,
  dashboardsSetPollInterval,
  dashboardsSetTimespan,
  dashboardsVariableOptionsLoaded,
  queryBrowserAddQuery,
  queryBrowserDuplicateQuery,
  queryBrowserDeleteAllQueries,
  queryBrowserDeleteAllSeries,
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
  setAlertCount,
  toggleGraphs,
};

export type ObserveAction = Action<typeof actions>;

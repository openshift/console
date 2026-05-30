import { action, ActionType as Action } from 'typesafe-actions';

import { Rule } from '@console/dynamic-plugin-sdk';

export enum ActionType {
  AlertingSetData = 'alertingSetData',
  AlertingSetRules = 'alertingSetRules',
  DashboardsPatchAllVariables = 'dashboardsPatchAllVariables',
  DashboardsPatchVariable = 'dashboardsPatchVariable',
  DashboardsClearVariables = 'dashboardsClearVariables',
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
  QueryBrowserPatchQuery = 'queryBrowserPatchQuery',
  QueryBrowserRunQueries = 'queryBrowserRunQueries',
  QueryBrowserSetAllExpanded = 'queryBrowserSetAllExpanded',
  QueryBrowserSetMetrics = 'queryBrowserSetMetrics',
  QueryBrowserSetPollInterval = 'queryBrowserSetPollInterval',
  QueryBrowserSetTimespan = 'queryBrowserSetTimespan',
  QueryBrowserToggleIsEnabled = 'queryBrowserToggleIsEnabled',
  QueryBrowserToggleSeries = 'queryBrowserToggleSeries',
  QueryBrowserToggleAllSeries = 'queryBrowserToggleAllSeries',
  SetAlertCount = 'SetAlertCount',
  ToggleGraphs = 'toggleGraphs',
}

const dashboardsPatchVariable = (key: string, patch: any, perspective: string) =>
  action(ActionType.DashboardsPatchVariable, { key, patch, perspective });

const dashboardsPatchAllVariables = (variables: any, perspective: string) =>
  action(ActionType.DashboardsPatchAllVariables, { variables, perspective });

const DashboardsClearVariables = (perspective: string) =>
  action(ActionType.DashboardsClearVariables, { perspective });

export const dashboardsSetEndTime = (endTime: number, perspective: string) =>
  action(ActionType.DashboardsSetEndTime, { endTime, perspective });

const dashboardsSetPollInterval = (pollInterval: number, perspective: string) =>
  action(ActionType.DashboardsSetPollInterval, { pollInterval, perspective });

export const dashboardsSetTimespan = (timespan: number, perspective: string) =>
  action(ActionType.DashboardsSetTimespan, { timespan, perspective });

const dashboardsVariableOptionsLoaded = (key: string, newOptions: string[], perspective: string) =>
  action(ActionType.DashboardsVariableOptionsLoaded, { key, newOptions, perspective });

export const alertingLoading = (
  key: 'alerts' | 'silences' | 'notificationAlerts' | 'devSilences',
  perspective = 'admin',
) =>
  action(ActionType.AlertingSetData, {
    key,
    data: { loaded: false, loadError: null, data: null, perspective },
  });

export const alertingLoaded = (
  key: 'alerts' | 'silences' | 'notificationAlerts' | 'devAlerts' | 'devSilences',
  alerts: any,
  perspective = 'admin',
) =>
  action(ActionType.AlertingSetData, {
    key,
    data: { loaded: true, loadError: null, data: alerts, perspective },
  });

export const alertingErrored = (
  key: 'alerts' | 'silences' | 'notificationAlerts' | 'devAlerts' | 'devSilences',
  loadError: Error,
  perspective = 'admin',
) =>
  action(ActionType.AlertingSetData, {
    key,
    data: { loaded: true, loadError, data: null, perspective },
  });

const alertingSetRules = (key: 'rules' | 'devRules', rules: Rule[], perspective = 'admin') =>
  action(ActionType.AlertingSetRules, { key, data: rules, perspective });

const toggleGraphs = () => action(ActionType.ToggleGraphs);

const queryBrowserAddQuery = () => action(ActionType.QueryBrowserAddQuery);

const queryBrowserDuplicateQuery = (index: number) =>
  action(ActionType.QueryBrowserDuplicateQuery, { index });

const queryBrowserDeleteAllQueries = () => action(ActionType.QueryBrowserDeleteAllQueries);

export const queryBrowserDeleteAllSeries = () => action(ActionType.QueryBrowserDeleteAllSeries);

const queryBrowserDismissNamespaceAlert = () =>
  action(ActionType.QueryBrowserDismissNamespaceAlert);

const queryBrowserDeleteQuery = (index: number) =>
  action(ActionType.QueryBrowserDeleteQuery, { index });

export const queryBrowserPatchQuery = (index: number, patch: { [key: string]: unknown }) =>
  action(ActionType.QueryBrowserPatchQuery, { index, patch });

const queryBrowserRunQueries = () => action(ActionType.QueryBrowserRunQueries);

const queryBrowserSetAllExpanded = (isExpanded: boolean) =>
  action(ActionType.QueryBrowserSetAllExpanded, { isExpanded });

const queryBrowserSetMetrics = (metrics: string[]) =>
  action(ActionType.QueryBrowserSetMetrics, { metrics });

const queryBrowserSetPollInterval = (pollInterval: number) =>
  action(ActionType.QueryBrowserSetPollInterval, { pollInterval });

export const queryBrowserSetTimespan = (timespan: number) =>
  action(ActionType.QueryBrowserSetTimespan, { timespan });

const queryBrowserToggleAllSeries = (index: number) =>
  action(ActionType.QueryBrowserToggleAllSeries, { index });

const queryBrowserToggleIsEnabled = (index: number) =>
  action(ActionType.QueryBrowserToggleIsEnabled, { index });

const queryBrowserToggleSeries = (index: number, labels: { [key: string]: unknown }) =>
  action(ActionType.QueryBrowserToggleSeries, { index, labels });

export const setAlertCount = (alertCount) => action(ActionType.SetAlertCount, { alertCount });

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in typeof for type export
const actions = {
  alertingErrored,
  alertingLoaded,
  alertingLoading,
  alertingSetRules,
  dashboardsPatchAllVariables,
  dashboardsPatchVariable,
  DashboardsClearVariables,
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
  queryBrowserPatchQuery,
  queryBrowserRunQueries,
  queryBrowserSetAllExpanded,
  queryBrowserSetMetrics,
  queryBrowserSetPollInterval,
  queryBrowserSetTimespan,
  queryBrowserToggleAllSeries,
  queryBrowserToggleIsEnabled,
  queryBrowserToggleSeries,
  setAlertCount,
  toggleGraphs,
};

export type ObserveAction = Action<typeof actions>;

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
  QueryBrowserAddQuery2 = 'queryBrowserAddQuery2',
  QueryBrowserDuplicateQuery = 'queryBrowserDuplicateQuery',
  QueryBrowserDuplicateQuery2 = 'queryBrowserDuplicateQuery2',
  QueryBrowserDeleteAllQueries = 'queryBrowserDeleteAllQueries',
  QueryBrowserDeleteAllSeries = 'queryBrowserDeleteAllSeries',
  QueryBrowserDeleteAllSeries2 = 'queryBrowserDeleteAllSeries2',
  QueryBrowserDeleteQuery = 'queryBrowserDeleteQuery',
  QueryBrowserDeleteQuery2 = 'queryBrowserDeleteQuery2',
  QueryBrowserDismissNamespaceAlert = 'queryBrowserDismissNamespaceAlert',
  QueryBrowserPatchQuery = 'queryBrowserPatchQuery',
  QueryBrowserPatchQuery2 = 'queryBrowserPatchQuery2',
  QueryBrowserRunQueries = 'queryBrowserRunQueries',
  QueryBrowserRunQueries2 = 'queryBrowserRunQueries2',
  QueryBrowserSetAllExpanded = 'queryBrowserSetAllExpanded',
  QueryBrowserSetMetrics = 'queryBrowserSetMetrics',
  QueryBrowserSetPollInterval = 'queryBrowserSetPollInterval',
  QueryBrowserSetTimespan = 'queryBrowserSetTimespan',
  QueryBrowserToggleIsEnabled = 'queryBrowserToggleIsEnabled',
  QueryBrowserToggleIsEnabled2 = 'queryBrowserToggleIsEnabled2',
  QueryBrowserToggleSeries = 'queryBrowserToggleSeries',
  QueryBrowserToggleSeries2 = 'queryBrowserToggleSeries2',

  SetAlertCount = 'SetAlertCount',
  ToggleGraphs = 'toggleGraphs',
}

export const dashboardsPatchVariable = (key: string, patch: any, perspective: string) =>
  action(ActionType.DashboardsPatchVariable, { key, patch, perspective });

export const dashboardsPatchAllVariables = (variables: any, perspective: string) =>
  action(ActionType.DashboardsPatchAllVariables, { variables, perspective });

export const DashboardsClearVariables = (perspective: string) =>
  action(ActionType.DashboardsClearVariables, { perspective });

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

export const queryBrowserAddQuery2 = () => action(ActionType.QueryBrowserAddQuery2);

export const queryBrowserDuplicateQuery = (index: number) =>
  action(ActionType.QueryBrowserDuplicateQuery, { index });

export const queryBrowserDuplicateQuery2 = (id: string) =>
  action(ActionType.QueryBrowserDuplicateQuery2, { id });

export const queryBrowserDeleteAllQueries = () => action(ActionType.QueryBrowserDeleteAllQueries);

export const queryBrowserDeleteAllSeries = () => action(ActionType.QueryBrowserDeleteAllSeries);

export const queryBrowserDeleteAllSeries2 = () => action(ActionType.QueryBrowserDeleteAllSeries2);

export const queryBrowserDismissNamespaceAlert = () =>
  action(ActionType.QueryBrowserDismissNamespaceAlert);

export const queryBrowserDeleteQuery = (index: number) =>
  action(ActionType.QueryBrowserDeleteQuery, { index });

export const queryBrowserDeleteQuery2 = (id: string) =>
  action(ActionType.QueryBrowserDeleteQuery2, { id });

export const queryBrowserPatchQuery = (index: number, patch: { [key: string]: unknown }) =>
  action(ActionType.QueryBrowserPatchQuery, { index, patch });

export const queryBrowserPatchQuery2 = (id: string, patch: { [key: string]: unknown }) =>
  action(ActionType.QueryBrowserPatchQuery2, { id, patch });

export const queryBrowserRunQueries = () => action(ActionType.QueryBrowserRunQueries);

export const queryBrowserRunQueries2 = () => action(ActionType.QueryBrowserRunQueries2);

export const queryBrowserSetAllExpanded = (isExpanded: boolean) =>
  action(ActionType.QueryBrowserSetAllExpanded, { isExpanded });

export const queryBrowserSetMetrics = (metrics: string[]) =>
  action(ActionType.QueryBrowserSetMetrics, { metrics });

export const queryBrowserSetPollInterval = (pollInterval: number) =>
  action(ActionType.QueryBrowserSetPollInterval, { pollInterval });

export const queryBrowserSetTimespan = (timespan: number) =>
  action(ActionType.QueryBrowserSetTimespan, { timespan });

export const queryBrowserToggleIsEnabled = (index: number) =>
  action(ActionType.QueryBrowserToggleIsEnabled, { index });

export const queryBrowserToggleIsEnabled2 = (id: string) =>
  action(ActionType.QueryBrowserToggleIsEnabled2, { id });

export const queryBrowserToggleSeries = (index: number, labels: { [key: string]: unknown }) =>
  action(ActionType.QueryBrowserToggleSeries, { index, labels });

  export const queryBrowserToggleSeries2 = (id: string, labels: { [key: string]: unknown }) =>
  action(ActionType.QueryBrowserToggleSeries2, { id, labels });

  export const setAlertCount = (alertCount) => action(ActionType.SetAlertCount, { alertCount });

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
  queryBrowserAddQuery2,
  queryBrowserDuplicateQuery,
  queryBrowserDuplicateQuery2,
  queryBrowserDeleteAllQueries,
  queryBrowserDeleteAllSeries,
  queryBrowserDeleteAllSeries2,
  queryBrowserDeleteQuery,
  queryBrowserDeleteQuery2,
  queryBrowserDismissNamespaceAlert,
  queryBrowserPatchQuery,
  queryBrowserPatchQuery2,
  queryBrowserRunQueries,
  queryBrowserRunQueries2,
  queryBrowserSetAllExpanded,
  queryBrowserSetMetrics,
  queryBrowserSetPollInterval,
  queryBrowserSetTimespan,
  queryBrowserToggleIsEnabled,
  queryBrowserToggleIsEnabled2,
  queryBrowserToggleSeries,
  queryBrowserToggleSeries2,
  setAlertCount,
  toggleGraphs,
};

export type ObserveAction = Action<typeof actions>;

import * as _ from 'lodash';
import type { Alert } from '@console/dynamic-plugin-sdk';
import { AlertStates, RuleStates, SilenceStates } from '@console/dynamic-plugin-sdk';
import type { ObserveAction } from '../actions/observe';
import { ActionType } from '../actions/observe';
import { isSilenced } from '../components/monitoring/utils';

const MONITORING_DASHBOARDS_DEFAULT_TIMESPAN = 30 * 60 * 1000;

const MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY = 'ALL_OPTION_KEY';

export type ObserveState = Record<string, any>;

type QueryBrowserQuery = Record<string, any>;

const newQueryBrowserQuery = (): QueryBrowserQuery => ({
  id: _.uniqueId('query-browser-query'),
  isEnabled: true,
  isExpanded: true,
});

const silenceFiringAlerts = (firingAlerts, silences) => {
  // For each firing alert, store a list of the Silences that are silencing it
  // and set its state to show it is silenced
  _.each(firingAlerts, (a) => {
    a.silencedBy = _.filter(
      _.get(silences, 'data'),
      (s) => _.get(s, 'status.state') === SilenceStates.Active && isSilenced(a, s),
    );
    if (a.silencedBy.length) {
      a.state = AlertStates.Silenced;
      // Also set the state of Alerts in `rule.alerts`
      _.each(a.rule.alerts, (ruleAlert) => {
        if (_.some(a.silencedBy, (s) => isSilenced(ruleAlert, s))) {
          ruleAlert.state = AlertStates.Silenced;
        }
      });
      if (!_.isEmpty(a.rule.alerts) && _.every(a.rule.alerts, isSilenced)) {
        a.rule.state = RuleStates.Silenced;
        a.rule.silencedBy = _.filter(
          silences?.data,
          (s) => s.status.state === SilenceStates.Active && _.some(a.rule.alerts, isSilenced),
        );
      }
    }
  });
};

const updateQuery = (
  state: ObserveState,
  index: number,
  updater: (q: QueryBrowserQuery) => QueryBrowserQuery,
): ObserveState => {
  const queries = [...state.queryBrowser.queries];
  queries[index] = updater(queries[index]);
  return { ...state, queryBrowser: { ...state.queryBrowser, queries } };
};

const mapQueries = (
  state: ObserveState,
  mapper: (q: QueryBrowserQuery) => QueryBrowserQuery,
): ObserveState => ({
  ...state,
  queryBrowser: {
    ...state.queryBrowser,
    queries: state.queryBrowser.queries.map(mapper),
  },
});

export default (state: ObserveState, action: ObserveAction): ObserveState => {
  if (!state) {
    return {
      dashboards: {
        dev: {
          endTime: null,
          pollInterval: 30 * 1000,
          timespan: MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
          variables: {},
        },
        admin: {
          endTime: null,
          pollInterval: 30 * 1000,
          timespan: MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
          variables: {},
        },
      },
      queryBrowser: {
        metrics: [],
        pollInterval: null,
        queries: [newQueryBrowserQuery()],
        timespan: MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
      },
    };
  }

  const queryBrowserPatchQueryHelper = (index: number, patch: { [key: string]: unknown }) => {
    const existing = state.queryBrowser.queries[index];
    const query = existing ? { ...existing, ...patch } : { ...newQueryBrowserQuery(), ...patch };
    const queries = [...state.queryBrowser.queries];
    queries[index] = query;
    return { ...state, queryBrowser: { ...state.queryBrowser, queries } };
  };

  switch (action.type) {
    case ActionType.DashboardsPatchVariable: {
      const { perspective, key, patch } = action.payload;
      const dashPersp = state.dashboards[perspective];
      return {
        ...state,
        dashboards: {
          ...state.dashboards,
          [perspective]: {
            ...dashPersp,
            variables: {
              ...dashPersp.variables,
              [key]: { ...dashPersp.variables[key], ...patch },
            },
          },
        },
      };
    }

    case ActionType.DashboardsPatchAllVariables: {
      const { perspective, variables } = action.payload;
      return {
        ...state,
        dashboards: {
          ...state.dashboards,
          [perspective]: {
            ...state.dashboards[perspective],
            variables: { ...variables },
          },
        },
      };
    }

    case ActionType.DashboardsClearVariables:
      return {
        ...state,
        dashboards: {
          ...state.dashboards,
          [action.payload.perspective]: {
            ...state.dashboards[action.payload.perspective],
            variables: {},
          },
        },
      };

    case ActionType.DashboardsSetEndTime:
      return {
        ...state,
        dashboards: {
          ...state.dashboards,
          [action.payload.perspective]: {
            ...state.dashboards[action.payload.perspective],
            endTime: action.payload.endTime,
          },
        },
      };

    case ActionType.DashboardsSetPollInterval:
      return {
        ...state,
        dashboards: {
          ...state.dashboards,
          [action.payload.perspective]: {
            ...state.dashboards[action.payload.perspective],
            pollInterval: action.payload.pollInterval,
          },
        },
      };

    case ActionType.DashboardsSetTimespan:
      return {
        ...state,
        dashboards: {
          ...state.dashboards,
          [action.payload.perspective]: {
            ...state.dashboards[action.payload.perspective],
            timespan: action.payload.timespan,
          },
        },
      };

    case ActionType.DashboardsVariableOptionsLoaded: {
      const { key, newOptions, perspective } = action.payload;
      const variable = state.dashboards[perspective].variables[key];
      const { options, value } = variable;
      const patch = _.isEqual(options, newOptions)
        ? { isLoading: false }
        : {
            isLoading: false,
            options: newOptions,
            value:
              value === MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY || newOptions.includes(value)
                ? value
                : perspective === 'dev' && key === 'namespace'
                  ? state.activeNamespace
                  : newOptions[0],
          };
      return {
        ...state,
        dashboards: {
          ...state.dashboards,
          [perspective]: {
            ...state.dashboards[perspective],
            variables: {
              ...state.dashboards[perspective].variables,
              [key]: { ...variable, ...patch },
            },
          },
        },
      };
    }

    case ActionType.AlertingSetRules:
      return { ...state, [action.payload.key]: action.payload.data };

    case ActionType.AlertingSetData: {
      const alertsKey = action.payload.data.perspective === 'admin' ? 'alerts' : 'devAlerts';
      const alerts = action.payload.key === alertsKey ? action.payload.data : state[alertsKey];
      const notificationAlerts: NotificationAlerts =
        action.payload.key === 'notificationAlerts'
          ? action.payload.data
          : state.notificationAlerts;

      const silencesKey = action.payload.data.perspective === 'admin' ? 'silences' : 'devSilences';
      const silences =
        action.payload.key === silencesKey ? action.payload.data : state[silencesKey];

      const isAlertFiring = (alert) =>
        alert?.state === AlertStates.Firing || alert?.state === AlertStates.Silenced;
      const firingAlerts = _.filter(alerts?.data, isAlertFiring);
      silenceFiringAlerts(firingAlerts, silences);
      silenceFiringAlerts(_.filter(notificationAlerts?.data, isAlertFiring), silences);
      const updatedNotificationAlerts = notificationAlerts
        ? {
            ...notificationAlerts,
            data: _.reject(notificationAlerts.data, { state: AlertStates.Silenced }),
          }
        : notificationAlerts;

      const updated = {
        ...state,
        [alertsKey]: alerts,
        notificationAlerts: updatedNotificationAlerts,
      };

      _.each(_.get(silences, 'data'), (s) => {
        s.firingAlerts = _.filter(firingAlerts, (a) => isSilenced(a, s));
      });
      return { ...updated, [silencesKey]: silences };
    }

    case ActionType.ToggleGraphs:
      return { ...state, hideGraphs: !state.hideGraphs };

    case ActionType.QueryBrowserAddQuery:
      return {
        ...state,
        queryBrowser: {
          ...state.queryBrowser,
          queries: [...state.queryBrowser.queries, newQueryBrowserQuery()],
        },
      };

    case ActionType.QueryBrowserDuplicateQuery: {
      const { index } = action.payload;
      const originQueryText = state.queryBrowser.queries[index]?.text;
      const duplicate = {
        ...newQueryBrowserQuery(),
        text: originQueryText,
        isEnabled: false,
      };
      return {
        ...state,
        queryBrowser: {
          ...state.queryBrowser,
          queries: [...state.queryBrowser.queries, duplicate],
        },
      };
    }

    case ActionType.QueryBrowserDeleteAllQueries:
      return {
        ...state,
        queryBrowser: { ...state.queryBrowser, queries: [newQueryBrowserQuery()] },
      };

    case ActionType.QueryBrowserDeleteAllSeries:
      return mapQueries(state, (q) => ({ ...q, series: undefined }));

    case ActionType.QueryBrowserDeleteQuery: {
      let queries = state.queryBrowser.queries.filter((_q, i) => i !== action.payload.index);
      if (queries.length === 0) {
        queries = [newQueryBrowserQuery()];
      }
      return { ...state, queryBrowser: { ...state.queryBrowser, queries } };
    }

    case ActionType.QueryBrowserDismissNamespaceAlert:
      return {
        ...state,
        queryBrowser: { ...state.queryBrowser, dismissNamespaceAlert: true },
      };

    case ActionType.QueryBrowserPatchQuery: {
      const { index, patch } = action.payload;
      return queryBrowserPatchQueryHelper(index, patch);
    }

    case ActionType.QueryBrowserRunQueries: {
      const queries = state.queryBrowser.queries.map((q) => {
        const { isEnabled, query, text: rawText } = q;
        const text = _.trim(rawText);
        return isEnabled && query !== text ? { ...q, query: text, series: undefined } : q;
      });
      return {
        ...state,
        queryBrowser: { ...state.queryBrowser, queries, lastRequestTime: Date.now() },
      };
    }

    case ActionType.QueryBrowserSetAllExpanded:
      return mapQueries(state, (q) => ({ ...q, isExpanded: action.payload.isExpanded }));

    case ActionType.QueryBrowserSetMetrics:
      return {
        ...state,
        queryBrowser: { ...state.queryBrowser, metrics: action.payload.metrics },
      };

    case ActionType.QueryBrowserSetPollInterval:
      return {
        ...state,
        queryBrowser: { ...state.queryBrowser, pollInterval: action.payload.pollInterval },
      };

    case ActionType.QueryBrowserSetTimespan:
      return {
        ...state,
        queryBrowser: { ...state.queryBrowser, timespan: action.payload.timespan },
      };

    case ActionType.QueryBrowserToggleAllSeries: {
      const { index } = action.payload;
      const query = state.queryBrowser.queries[index];
      const isDisabledSeriesEmpty = _.isEmpty(query?.disabledSeries);
      const patch = { disabledSeries: isDisabledSeriesEmpty ? query?.series : [] };
      return queryBrowserPatchQueryHelper(index, patch);
    }

    case ActionType.QueryBrowserToggleIsEnabled: {
      const query = state.queryBrowser.queries[action.payload.index];
      const isEnabled = !query.isEnabled;
      return updateQuery(state, action.payload.index, () => ({
        ...query,
        isEnabled,
        isExpanded: isEnabled,
        query: isEnabled ? query.text : '',
      }));
    }

    case ActionType.QueryBrowserToggleSeries:
      return updateQuery(state, action.payload.index, (q) => ({
        ...q,
        disabledSeries: _.xorWith(q.disabledSeries, [action.payload.labels], _.isEqual),
      }));

    case ActionType.SetAlertCount:
      return { ...state, alertCount: action.payload.alertCount };

    default:
      break;
  }
  return state;
};

export type NotificationAlerts = {
  data: Alert[];
  loaded: boolean;
  loadError?: Error;
};

import * as _ from 'lodash-es';
import { List as ImmutableList, Map as ImmutableMap } from 'immutable';

import { ActionType, UIAction } from '../actions/ui';
import { ALL_APPLICATIONS_KEY, ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { getNamespace } from '../components/utils/link';
import { OverviewSpecialGroup } from '../components/overview/constants';
import { RootState } from '../redux';
import { Alert, AlertStates, RuleStates, SilenceStates } from '../components/monitoring/types';
import { isSilenced } from '../components/monitoring/utils';
import {
  MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
  MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY,
} from '../components/monitoring/dashboards/types';

export type UIState = ImmutableMap<string, any>;

const newQueryBrowserQuery = (): ImmutableMap<string, any> =>
  ImmutableMap({
    id: _.uniqueId('query-browser-query'),
    isEnabled: true,
    isExpanded: true,
  });

export const silenceFiringAlerts = (firingAlerts, silences) => {
  // For each firing alert, store a list of the Silences that are silencing it and set its state to show it is silenced
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

export default (state: UIState, action: UIAction): UIState => {
  if (!state) {
    const { pathname } = window.location;
    return ImmutableMap({
      activeNavSectionId: 'workloads',
      location: pathname,
      activeNamespace: ALL_NAMESPACES_KEY,
      activeApplication: ALL_APPLICATIONS_KEY,
      createProjectMessage: '',
      overview: ImmutableMap({
        metrics: {},
        resources: ImmutableMap({}),
        selectedDetailsTab: 'Resources',
        selectedUID: '',
        selectedGroup: OverviewSpecialGroup.GROUP_BY_APPLICATION,
        groupOptions: ImmutableMap(),
        filterValue: '',
      }),
      user: {},
      utilizationDuration: ImmutableMap({
        duration: null,
        endTime: null,
        selectedKey: null,
      }),
      monitoringDashboards: ImmutableMap({
        endTime: null,
        pollInterval: 30 * 1000,
        timespan: MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
        variables: ImmutableMap(),
      }),
      queryBrowser: ImmutableMap({
        metrics: [],
        pollInterval: null,
        queries: ImmutableList([newQueryBrowserQuery()]),
      }),
    });
  }

  switch (action.type) {
    case ActionType.SetActiveApplication:
      return state.set('activeApplication', action.payload.application);

    case ActionType.SetActiveNamespace:
      if (!action.payload.namespace) {
        // eslint-disable-next-line no-console
        console.warn('setActiveNamespace: Not setting to falsy!');
        return state;
      }

      return state
        .set('activeApplication', ALL_APPLICATIONS_KEY)
        .set('activeNamespace', action.payload.namespace);

    case ActionType.SetCurrentLocation: {
      state = state.set('location', action.payload.location);
      const ns = getNamespace(action.payload.location);
      if (_.isUndefined(ns)) {
        return state;
      }
      return state.set('activeNamespace', ns);
    }
    case ActionType.BeginImpersonate:
      return state.set('impersonate', {
        kind: action.payload.kind,
        name: action.payload.name,
        subprotocols: action.payload.subprotocols,
      });

    case ActionType.EndImpersonate:
      return state.delete('impersonate');

    case ActionType.SortList:
      return state.mergeIn(
        ['listSorts', action.payload.listId],
        _.pick(action.payload, ['field', 'func', 'orderBy']),
      );

    case ActionType.SetCreateProjectMessage:
      return state.set('createProjectMessage', action.payload.message);

    case ActionType.SetClusterID:
      return state.set('clusterID', action.payload.clusterID);

    case ActionType.SetUser:
      return state.set('user', action.payload.user);

    case ActionType.MonitoringDashboardsClearVariables:
      return state.setIn(['monitoringDashboards', 'variables'], ImmutableMap());

    case ActionType.MonitoringDashboardsPatchVariable:
      return state.mergeIn(
        ['monitoringDashboards', 'variables', action.payload.key],
        ImmutableMap(action.payload.patch),
      );

    case ActionType.MonitoringDashboardsPatchAllVariables:
      return state.setIn(
        ['monitoringDashboards', 'variables'],
        ImmutableMap(action.payload.variables),
      );

    case ActionType.MonitoringDashboardsSetEndTime:
      return state.setIn(['monitoringDashboards', 'endTime'], action.payload.endTime);

    case ActionType.MonitoringDashboardsSetPollInterval:
      return state.setIn(['monitoringDashboards', 'pollInterval'], action.payload.pollInterval);

    case ActionType.MonitoringDashboardsSetTimespan:
      return state.setIn(['monitoringDashboards', 'timespan'], action.payload.timespan);

    case ActionType.MonitoringDashboardsVariableOptionsLoaded: {
      const { key, newOptions } = action.payload;
      const { options, value } = state.getIn(['monitoringDashboards', 'variables', key]).toJS();
      const patch = _.isEqual(options, newOptions)
        ? { isLoading: false }
        : {
            isLoading: false,
            options: newOptions,
            value:
              value === MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY || newOptions.includes(value)
                ? value
                : newOptions[0],
          };
      return state.mergeIn(['monitoringDashboards', 'variables', key], ImmutableMap(patch));
    }
    case ActionType.MonitoringSetRules:
      return state.setIn(['monitoring', action.payload.key], action.payload.data);

    case ActionType.SetMonitoringData: {
      const alertKey = action.payload.data.perspective === 'admin' ? 'alerts' : 'devAlerts';
      const alerts =
        action.payload.key === alertKey
          ? action.payload.data
          : state.getIn(['monitoring', alertKey]);
      // notificationAlerts used by notification drawer and certain dashboards
      const notificationAlerts: NotificationAlerts =
        action.payload.key === 'notificationAlerts'
          ? action.payload.data
          : state.getIn(['monitoring', 'notificationAlerts']);
      const silences =
        action.payload.key === 'silences'
          ? action.payload.data
          : state.getIn(['monitoring', 'silences']);

      const isAlertFiring = (alert) =>
        alert?.state === AlertStates.Firing || alert?.state === AlertStates.Silenced;
      const firingAlerts = _.filter(alerts?.data, isAlertFiring);
      silenceFiringAlerts(firingAlerts, silences);
      silenceFiringAlerts(_.filter(notificationAlerts?.data, isAlertFiring), silences);
      notificationAlerts.data = _.reject(notificationAlerts.data, { state: AlertStates.Silenced });
      state = state.setIn(['monitoring', alertKey], alerts);
      state = state.setIn(['monitoring', 'notificationAlerts'], notificationAlerts);

      // For each Silence, store a list of the Alerts it is silencing
      _.each(_.get(silences, 'data'), (s) => {
        s.firingAlerts = _.filter(firingAlerts, (a) => isSilenced(a, s));
      });
      return state.setIn(['monitoring', 'silences'], silences);
    }
    case ActionType.ToggleMonitoringGraphs:
      return state.setIn(['monitoring', 'hideGraphs'], !state.getIn(['monitoring', 'hideGraphs']));

    case ActionType.NotificationDrawerToggleExpanded:
      return state.setIn(
        ['notifications', 'isExpanded'],
        !state.getIn(['notifications', 'isExpanded']),
      );

    case ActionType.QueryBrowserAddQuery:
      return state.setIn(
        ['queryBrowser', 'queries'],
        state.getIn(['queryBrowser', 'queries']).push(newQueryBrowserQuery()),
      );

    case ActionType.QueryBrowserDeleteAllQueries:
      return state.setIn(['queryBrowser', 'queries'], ImmutableList([newQueryBrowserQuery()]));

    case ActionType.QueryBrowserDeleteAllSeries: {
      return state.setIn(
        ['queryBrowser', 'queries'],
        state.getIn(['queryBrowser', 'queries']).map((q) => q.set('series', undefined)),
      );
    }

    case ActionType.QueryBrowserDeleteQuery: {
      let queries = state.getIn(['queryBrowser', 'queries']).delete(action.payload.index);
      if (queries.size === 0) {
        queries = queries.push(newQueryBrowserQuery());
      }
      return state.setIn(['queryBrowser', 'queries'], queries);
    }
    case ActionType.QueryBrowserDismissNamespaceAlert:
      return state.setIn(['queryBrowser', 'dismissNamespaceAlert'], true);

    case ActionType.QueryBrowserInsertText: {
      const { index, newText, replaceFrom, replaceTo } = action.payload;
      const oldText = state.getIn(['queryBrowser', 'queries', index, 'text'], '');
      const text =
        _.isInteger(replaceFrom) && _.isInteger(replaceTo)
          ? oldText.substring(0, replaceFrom) + newText + oldText.substring(replaceTo)
          : oldText + newText;
      return state.setIn(['queryBrowser', 'queries', index, 'text'], text);
    }
    case ActionType.QueryBrowserPatchQuery: {
      const { index, patch } = action.payload;
      const query = state.hasIn(['queryBrowser', 'queries', index])
        ? ImmutableMap(patch)
        : newQueryBrowserQuery().merge(patch);
      return state.mergeIn(['queryBrowser', 'queries', index], query);
    }
    case ActionType.QueryBrowserRunQueries: {
      const queries = state.getIn(['queryBrowser', 'queries']).map((q) => {
        const isEnabled = q.get('isEnabled');
        const query = q.get('query');
        const text = _.trim(q.get('text'));
        return isEnabled && query !== text ? q.merge({ query: text, series: undefined }) : q;
      });
      return state.setIn(['queryBrowser', 'queries'], queries);
    }
    case ActionType.QueryBrowserSetAllExpanded: {
      const queries = state.getIn(['queryBrowser', 'queries']).map((q) => {
        return q.set('isExpanded', action.payload.isExpanded);
      });
      return state.setIn(['queryBrowser', 'queries'], queries);
    }
    case ActionType.QueryBrowserSetMetrics:
      return state.setIn(['queryBrowser', 'metrics'], action.payload.metrics);

    case ActionType.QueryBrowserSetPollInterval:
      return state.setIn(['queryBrowser', 'pollInterval'], action.payload.pollInterval);

    case ActionType.QueryBrowserToggleIsEnabled: {
      const query = state.getIn(['queryBrowser', 'queries', action.payload.index]);
      const isEnabled = !query.get('isEnabled');
      return state.setIn(
        ['queryBrowser', 'queries', action.payload.index],
        query.merge({
          isEnabled,
          isExpanded: isEnabled,
          query: isEnabled ? query.get('text') : '',
        }),
      );
    }
    case ActionType.QueryBrowserToggleSeries:
      return state.updateIn(
        ['queryBrowser', 'queries', action.payload.index, 'disabledSeries'],
        (v) => _.xorWith(v, [action.payload.labels], _.isEqual),
      );

    case ActionType.SelectOverviewItem:
      return state.setIn(['overview', 'selectedUID'], action.payload.uid);

    case ActionType.SelectOverviewDetailsTab:
      return state.setIn(['overview', 'selectedDetailsTab'], action.payload.tab);

    case ActionType.DismissOverviewDetails:
      return state.mergeIn(['overview'], { selectedUID: '', selectedDetailsTab: '' });

    case ActionType.UpdateOverviewMetrics:
      return state.setIn(['overview', 'metrics'], action.payload.metrics);

    case ActionType.UpdateOverviewResources: {
      const newResources = ImmutableMap(_.keyBy(action.payload.resources, 'obj.metadata.uid'));
      return state.setIn(['overview', 'resources'], newResources);
    }

    case ActionType.UpdateOverviewSelectedGroup: {
      return state.setIn(['overview', 'selectedGroup'], action.payload.group);
    }

    case ActionType.UpdateOverviewLabels: {
      return state.setIn(['overview', 'labels'], action.payload.labels);
    }

    case ActionType.UpdateOverviewFilterValue: {
      return state.setIn(['overview', 'filterValue'], action.payload.value);
    }
    case ActionType.UpdateTimestamps:
      return state.set('lastTick', action.payload.lastTick);

    case ActionType.SetPodMetrics:
      return state.setIn(['metrics', 'pod'], action.payload.podMetrics);

    case ActionType.SetNamespaceMetrics:
      return state.setIn(['metrics', 'namespace'], action.payload.namespaceMetrics);
    case ActionType.SetNodeMetrics:
      return state.setIn(['metrics', 'node'], action.payload.nodeMetrics);
    case ActionType.SetPVCMetrics:
      return state.setIn(['metrics', 'pvc'], action.payload.pvcMetrics);
    case ActionType.SetUtilizationDuration:
      return state.setIn(['utilizationDuration', 'duration'], action.payload.duration);
    case ActionType.SetUtilizationDurationSelectedKey:
      return state.setIn(['utilizationDuration', 'selectedKey'], action.payload.key);
    case ActionType.SetUtilizationDurationEndTime:
      return state.setIn(['utilizationDuration', 'endTime'], action.payload.endTime);
    default:
      break;
  }
  return state;
};

export const createProjectMessageStateToProps = ({ UI }: RootState) => {
  return { createProjectMessage: UI.get('createProjectMessage') as string };
};

export const userStateToProps = ({ UI }: RootState) => {
  return { user: UI.get('user') };
};

export const impersonateStateToProps = ({ UI }: RootState) => {
  return { impersonate: UI.get('impersonate') };
};

export const getActiveNamespace = ({ UI }: RootState): string => UI.get('activeNamespace');

export const getActiveApplication = ({ UI }: RootState): string => UI.get('activeApplication');

export type NotificationAlerts = {
  data: Alert[];
  loaded: boolean;
  loadError?: {
    message?: string;
  };
};

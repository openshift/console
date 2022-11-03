import * as _ from 'lodash-es';
import { List as ImmutableList, Map as ImmutableMap } from 'immutable';
import { Alert, AlertStates, RuleStates, SilenceStates } from '@console/dynamic-plugin-sdk';

import { ActionType, ObserveAction } from '../actions/observe';
import {
  MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
  MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY,
} from '../components/monitoring/dashboards/types';
import { isSilenced } from '../components/monitoring/utils';

export type ObserveState = ImmutableMap<string, any>;

let nextSortOrderID: number = 0; 

// JZ2 returns a Key/Value Pair Map {id: 'query-browser-quer-123', Value:Map{isEnabled:true, isExpanded:true} }
const newQueryBrowserQuery2 = () : [[string, ImmutableMap<string, any>]] =>  {
  return [[
    // replace with lodash _.uniqueID 
    _.uniqueId('query-browser-query'), 
    ImmutableMap({
      isEnabled: true,
      isExpanded: true,
      query: "", 
      text: "",
      sortOrder: nextSortOrderID++
    }) 
  ]]
}

const newQueryBrowserQuery = (): ImmutableMap<string, any> =>
  ImmutableMap({
    id: _.uniqueId('query-browser-query'),
    isEnabled: true,
    isExpanded: true,
  });
    



export const silenceFiringAlerts = (firingAlerts, silences) => {
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

export default (state: ObserveState, action: ObserveAction): ObserveState => {
  if (!state) {
    return ImmutableMap({
      dashboards: ImmutableMap({
        dev: ImmutableMap({
          endTime: null,
          pollInterval: 30 * 1000,
          timespan: MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
          variables: ImmutableMap(),
        }),
        admin: ImmutableMap({
          endTime: null,
          pollInterval: 30 * 1000,
          timespan: MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
          variables: ImmutableMap(),
        }),
      }),

      // JZ1 
      // Create a ImmutableMap Similar in structure to the dashboards 
      queryBrowser2: ImmutableMap({
        metrics: [],
        pollInterval: null,
        queries2: ImmutableMap(newQueryBrowserQuery2()), // initialize queries Map with a Key:Value Pair 
        timespan: MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
      }),

      // intiial state creates an ImmutableList with one Query 
      queryBrowser: ImmutableMap({
        metrics: [],
        pollInterval: null,
        queries: ImmutableList([newQueryBrowserQuery()]),
        timespan: MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
      }),
    });
  }

 




  switch (action.type) {
    case ActionType.DashboardsPatchVariable:
      return state.mergeIn(
        ['dashboards', action.payload.perspective, 'variables', action.payload.key],
        ImmutableMap(action.payload.patch),
      );

    case ActionType.DashboardsPatchAllVariables:
      return state.setIn(
        ['dashboards', action.payload.perspective, 'variables'],
        ImmutableMap(action.payload.variables),
      );

    case ActionType.DashboardsClearVariables:
      return state.setIn(['dashboards', action.payload.perspective, 'variables'], ImmutableMap());

    case ActionType.DashboardsSetEndTime:
      return state.setIn(
        ['dashboards', action.payload.perspective, 'endTime'],
        action.payload.endTime,
      );

    case ActionType.DashboardsSetPollInterval:
      return state.setIn(
        ['dashboards', action.payload.perspective, 'pollInterval'],
        action.payload.pollInterval,
      );

    case ActionType.DashboardsSetTimespan:
      return state.setIn(
        ['dashboards', action.payload.perspective, 'timespan'],
        action.payload.timespan,
      );

    case ActionType.DashboardsVariableOptionsLoaded: {
      const { key, newOptions, perspective } = action.payload;
      const { options, value } = state.getIn(['dashboards', perspective, 'variables', key]).toJS();
      const patch = _.isEqual(options, newOptions)
        ? { isLoading: false }
        : {
            isLoading: false,
            options: newOptions,
            value:
              value === MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY || newOptions.includes(value)
                ? value
                : perspective === 'dev' && key === 'namespace'
                ? state.get('activeNamespace')
                : newOptions[0],
          };
      return state.mergeIn(['dashboards', perspective, 'variables', key], ImmutableMap(patch));
    }

    case ActionType.AlertingSetRules:
      return state.set(action.payload.key, action.payload.data);

    case ActionType.AlertingSetData: {
      const alertKey = action.payload.data.perspective === 'admin' ? 'alerts' : 'devAlerts';
      const alerts = action.payload.key === alertKey ? action.payload.data : state.get(alertKey);
      // notificationAlerts used by notification drawer and certain dashboards
      const notificationAlerts: NotificationAlerts =
        action.payload.key === 'notificationAlerts'
          ? action.payload.data
          : state.get('notificationAlerts');
      const silences =
        action.payload.key === 'silences' ? action.payload.data : state.get('silences');

      const isAlertFiring = (alert) =>
        alert?.state === AlertStates.Firing || alert?.state === AlertStates.Silenced;
      const firingAlerts = _.filter(alerts?.data, isAlertFiring);
      silenceFiringAlerts(firingAlerts, silences);
      silenceFiringAlerts(_.filter(notificationAlerts?.data, isAlertFiring), silences);
      notificationAlerts.data = _.reject(notificationAlerts.data, { state: AlertStates.Silenced });
      state = state.set(alertKey, alerts);
      state = state.set('notificationAlerts', notificationAlerts);

      // For each Silence, store a list of the Alerts it is silencing
      _.each(_.get(silences, 'data'), (s) => {
        s.firingAlerts = _.filter(firingAlerts, (a) => isSilenced(a, s));
      });
      return state.set('silences', silences);
    }

    case ActionType.ToggleGraphs:
      return state.set('hideGraphs', !state.get('hideGraphs'));

    case ActionType.QueryBrowserAddQuery2:
      return state.setIn(
        ['queryBrowser2', 'queries2'],
        state.getIn(['queryBrowser2', 'queries2']).merge(newQueryBrowserQuery2()),
      );

    case ActionType.QueryBrowserAddQuery:
      return state.setIn(
        ['queryBrowser', 'queries'],
        state.getIn(['queryBrowser', 'queries']).push(newQueryBrowserQuery()),
      );

    // TODO: delete 
    case ActionType.QueryBrowserDuplicateQuery: {
      const index = action.payload.index;
      const originQueryText = state.getIn(['queryBrowser', 'queries', index, 'text']);
      const duplicate = newQueryBrowserQuery().merge({
        text: originQueryText,
        isEnabled: false,
      });
      return state.setIn(
        ['queryBrowser', 'queries'],
        state.getIn(['queryBrowser', 'queries']).push(duplicate),
      );
    }

    case ActionType.QueryBrowserDuplicateQuery2: {    
      const id = action.payload.id;
      const originQueryText = state.getIn(['queryBrowser2', 'queries2', id, 'text']);
      const originSortOrder = state.getIn(['queryBrowser2', 'queries2', id, 'sortOrder']);

      // 3. Update the queries preceding duplicate 
      const updatedQueries = state.getIn(['queryBrowser2', 'queries2']).map((q) => {
        const sortOrder = q.get('sortOrder') 
        const newSortOrder = sortOrder + 1 
        return sortOrder > originSortOrder ?  q.merge({ sortOrder: newSortOrder }) : q;
      });

      // JZ NOTE: Left Off Here 11/2/22 9pm 
      // updated 'sortOrder > originSortOrder' need to be tested -- 
      // the output of these console logs should be the same 
      console.log("JZ Duplicate > updatedQueries : ", JSON.stringify(updatedQueries) )
      console.log("JZ Duplicate > setIn(updatedQueries) : ", JSON.stringify(state.setIn(['queryBrowser2', 'queries2'], updatedQueries)))


      // 4. Update sortOrderCounter 
      nextSortOrderID++


      // 5. Create Duplicate 
      // duplicate query appears on top of origin query
      var duplicate = newQueryBrowserQuery2()
      duplicate[0][1] = duplicate[0][1].mergeDeep({
        text: originQueryText,
        isEnabled: false,
        sortOrder: originSortOrder + 1
      });

      const updateAndDuplicateQueries = updatedQueries.merge(duplicate)

      console.log("JZ Duplicate > updateAndDuplicateQueries " + updateAndDuplicateQueries)

      return state
        .setIn(['queryBrowser2', 'queries2'], updateAndDuplicateQueries)
        // .setIn(['queryBrowser2', 'queries2'], state.getIn(['queryBrowser2', 'queries2']).merge(duplicate)); 

    }

    case ActionType.QueryBrowserDeleteAllQueries:
      return state.setIn(['queryBrowser', 'queries'], ImmutableList([newQueryBrowserQuery()]));

    case ActionType.QueryBrowserDeleteAllSeries: {
      return state.setIn(
        ['queryBrowser', 'queries'],
        state.getIn(['queryBrowser', 'queries']).map((q) => q.set('series', undefined)),
      );
    }

    case ActionType.QueryBrowserDeleteAllSeries2: {
      return state.setIn(
        ['queryBrowser2', 'queries2'],
        state.getIn(['queryBrowser2', 'queries2']).map((q) => q.set('series', undefined)),
      );
    }

    // TODO: delete 
    case ActionType.QueryBrowserDeleteQuery: {
      let queries = state.getIn(['queryBrowser', 'queries']).delete(action.payload.index);
      if (queries.size === 0) {
        queries = queries.push(newQueryBrowserQuery());
      }
      return state.setIn(['queryBrowser', 'queries'], queries);
    }

    case ActionType.QueryBrowserDeleteQuery2: {
      let queries = state.getIn(['queryBrowser2', 'queries2']).delete(action.payload.id);
      if (queries.size === 0) {
        queries = queries.merge(newQueryBrowserQuery2());
      }
      return state.setIn(['queryBrowser2', 'queries2'], queries);
    }

    case ActionType.QueryBrowserDismissNamespaceAlert:
      return state.setIn(['queryBrowser', 'dismissNamespaceAlert'], true);

    case ActionType.QueryBrowserPatchQuery: {
      const { index, patch } = action.payload;
      const query = state.hasIn(['queryBrowser', 'queries', index])
        ? ImmutableMap(patch)
        : newQueryBrowserQuery().merge(patch);
      return state.mergeIn(['queryBrowser', 'queries', index], query);
    }

    case ActionType.QueryBrowserPatchQuery2: {
      const { id, patch } = action.payload;
      const query = state.hasIn(['queryBrowser2', 'queries2', id])
        ? ImmutableMap(patch)
        : newQueryBrowserQuery2()[0][1].merge(patch);
      return state.mergeIn(['queryBrowser2', 'queries2', id], query);
    }

    case ActionType.QueryBrowserRunQueries: {
      const queries = state.getIn(['queryBrowser', 'queries']).map((q) => {
        const isEnabled = q.get('isEnabled');
        const query = q.get('query');
        const text = _.trim(q.get('text'));
        return isEnabled && query !== text ? q.merge({ query: text, series: undefined }) : q;
      });

      return state
        .setIn(['queryBrowser', 'queries'], queries)
        .setIn(['queryBrowser', 'lastRequestTime'], Date.now());
    }


    case ActionType.QueryBrowserRunQueries2: {
      const queries = state.getIn(['queryBrowser2', 'queries2']).map((q) => {
        const isEnabled = q.get('isEnabled');
        const query = q.get('query');
        const text = _.trim(q.get('text'));
        return isEnabled && query !== text ? q.merge({ query: text, series: undefined }) : q;
      });

      return state
        .setIn(['queryBrowser2', 'queries2'], queries)
        .setIn(['queryBrowser2', 'lastRequestTime'], Date.now());
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

    case ActionType.QueryBrowserSetTimespan:
      return state.setIn(['queryBrowser', 'timespan'], action.payload.timespan);

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

    case ActionType.QueryBrowserToggleIsEnabled2: {
      const query = state.getIn(['queryBrowser2', 'queries2', action.payload.id]);
      const isEnabled = !query.get('isEnabled');
      return state.setIn(
        ['queryBrowser2', 'queries2', action.payload.id],
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


    case ActionType.QueryBrowserToggleSeries2:
      return state.updateIn(
        ['queryBrowser2', 'queries2', action.payload.id, 'disabledSeries'],
        (v) => _.xorWith(v, [action.payload.labels], _.isEqual),
      );


    case ActionType.SetAlertCount:
      return state.set('alertCount', action.payload.alertCount);

    default:
      break;
  }
  return state;
};

export type NotificationAlerts = {
  data: Alert[];
  loaded: boolean;
  loadError?: {
    message?: string;
  };
};

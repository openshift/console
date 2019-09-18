import * as _ from 'lodash-es';
import { List as ImmutableList, Map as ImmutableMap } from 'immutable';

import { ActionType, UIAction } from '../actions/ui';
import {
  ALL_NAMESPACES_KEY,
  ALL_APPLICATIONS_KEY,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  NAMESPACE_LOCAL_STORAGE_KEY,
  LAST_PERSPECTIVE_LOCAL_STORAGE_KEY,
} from '../const';
import { AlertStates, isSilenced, SilenceStates } from '../reducers/monitoring';
import { legalNamePattern, getNamespace } from '../components/utils/link';
import { OverviewSpecialGroup } from '../components/overview/constants';
import { RootState } from '../redux';
import * as plugins from '../plugins';

export type UIState = ImmutableMap<string, any>;

export function getDefaultPerspective() {
  let activePerspective = localStorage.getItem(LAST_PERSPECTIVE_LOCAL_STORAGE_KEY);
  if (activePerspective && !plugins.registry.getPerspectives().some(p => p.properties.id === activePerspective)) {
    // invalid saved perspective
    activePerspective = undefined;
  }
  if (!activePerspective) {
    // assign default perspective
    const defaultPerspective = plugins.registry.getPerspectives().find(p => p.properties.default);
    if (defaultPerspective) {
      activePerspective = defaultPerspective.properties.id;
    }
  }
  return activePerspective || undefined;
}

const defaultQueryBrowserQuery = ImmutableMap({isEnabled: true, isExpanded: true});

export default (state: UIState, action: UIAction): UIState => {
  if (!state) {
    const { pathname } = window.location;

    let activeNamespace = getNamespace(pathname);
    if (!activeNamespace) {
      const parsedFavorite = localStorage.getItem(NAMESPACE_LOCAL_STORAGE_KEY);
      if (_.isString(parsedFavorite) && (parsedFavorite.match(legalNamePattern) || parsedFavorite === ALL_NAMESPACES_KEY)) {
        activeNamespace = parsedFavorite;
      } else {
        activeNamespace = localStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);
      }
    }

    return ImmutableMap({
      activeNavSectionId: 'workloads',
      location: pathname,
      activeNamespace: activeNamespace || 'default',
      activeApplication: ALL_APPLICATIONS_KEY,
      activePerspective: getDefaultPerspective(),
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
      consoleLinks: [],
      queryBrowser: ImmutableMap({
        metrics: [],
        queries: ImmutableList([defaultQueryBrowserQuery]),
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

      return state.set('activeApplication', ALL_APPLICATIONS_KEY).set('activeNamespace', action.payload.namespace);

    case ActionType.SetActivePerspective:
      return state.set('activePerspective', action.payload.perspective);

    case ActionType.SetCurrentLocation: {
      state = state.set('location', action.payload.location);
      const ns = getNamespace(action.payload.location);
      if (_.isUndefined(ns)) {
        return state;
      }
      return state.set('activeNamespace', ns);
    }
    case ActionType.BeginImpersonate:
      return state.set('impersonate', {kind: action.payload.kind, name: action.payload.name, subprotocols: action.payload.subprotocols});

    case ActionType.EndImpersonate:
      return state.delete('impersonate');

    case ActionType.SortList:
      return state.mergeIn(['listSorts', action.payload.listId], _.pick(action.payload, ['field', 'func', 'sortAsNumber', 'orderBy']));

    case ActionType.SetCreateProjectMessage:
      return state.set('createProjectMessage', action.payload.message);

    case ActionType.SetClusterID:
      return state.set('clusterID', action.payload.clusterID);

    case ActionType.SetUser:
      return state.set('user', action.payload.user);

    case ActionType.SetMonitoringData: {
      const alerts = action.payload.key === 'alerts' ? action.payload.data : state.getIn(['monitoring', 'alerts']);
      const firingAlerts = _.filter(_.get(alerts, 'data'), a => [AlertStates.Firing, AlertStates.Silenced].includes(a.state));
      const silences = action.payload.key === 'silences' ? action.payload.data : state.getIn(['monitoring', 'silences']);

      // For each Alert, store a list of the Silences that are silencing it and set its state to show it is silenced
      _.each(firingAlerts, a => {
        a.silencedBy = _.filter(_.get(silences, 'data'), s => _.get(s, 'status.state') === SilenceStates.Active && isSilenced(a, s));
        if (a.silencedBy.length) {
          a.state = AlertStates.Silenced;
          // Also set the state of Alerts in `rule.alerts`
          _.each(a.rule.alerts, ruleAlert => {
            if (_.some(a.silencedBy, s => isSilenced(ruleAlert, s))) {
              ruleAlert.state = AlertStates.Silenced;
            }
          });
        }
      });
      state = state.setIn(['monitoring', 'alerts'], alerts);

      // For each Silence, store a list of the Alerts it is silencing
      _.each(_.get(silences, 'data'), s => {
        s.firingAlerts = _.filter(firingAlerts, a => isSilenced(a, s));
      });
      return state.setIn(['monitoring', 'silences'], silences);
    }
    case ActionType.ToggleMonitoringGraphs:
      return state.setIn(['monitoring', 'hideGraphs'], !state.getIn(['monitoring', 'hideGraphs']));

    case ActionType.QueryBrowserAddQuery:
      return state.setIn(
        ['queryBrowser', 'queries'],
        state.getIn(['queryBrowser', 'queries']).push(defaultQueryBrowserQuery)
      );

    case ActionType.QueryBrowserDeleteAllQueries:
      return state.setIn(['queryBrowser', 'queries'], ImmutableList([defaultQueryBrowserQuery]));

    case ActionType.QueryBrowserDeleteQuery: {
      let queries = state.getIn(['queryBrowser', 'queries']).delete(action.payload.index);
      if (queries.size === 0) {
        queries = queries.push(defaultQueryBrowserQuery);
      }
      return state.setIn(['queryBrowser', 'queries'], queries);
    }
    case ActionType.QueryBrowserInsertText: {
      const {index, newText, replaceFrom, replaceTo} = action.payload;
      const oldText = state.getIn(['queryBrowser', 'queries', index, 'text'], '');
      const text = _.isInteger(replaceFrom) && _.isInteger(replaceTo)
        ? oldText.substring(0, replaceFrom) + newText + oldText.substring(replaceTo)
        : oldText + newText;
      return state.setIn(['queryBrowser', 'queries', index, 'text'], text);
    }
    case ActionType.QueryBrowserPatchQuery:
      return state.mergeIn(['queryBrowser', 'queries', action.payload.index], ImmutableMap(action.payload.patch));

    case ActionType.QueryBrowserRunQueries: {
      const queries = state.getIn(['queryBrowser', 'queries']).map(q => {
        const isEnabled = q.get('isEnabled');
        const query = q.get('query');
        const text = _.trim(q.get('text'));
        return isEnabled && query !== text ? q.merge({query: text, series: undefined}) : q;
      });
      return state.setIn(['queryBrowser', 'queries'], queries);
    }
    case ActionType.QueryBrowserSetAllExpanded: {
      const queries = state.getIn(['queryBrowser', 'queries']).map(q => {
        return q.set('isExpanded', action.payload.isExpanded);
      });
      return state.setIn(['queryBrowser', 'queries'], queries);
    }
    case ActionType.QueryBrowserSetMetrics:
      return state.setIn(['queryBrowser', 'metrics'], action.payload.metrics);

    case ActionType.QueryBrowserToggleIsEnabled: {
      const query = state.getIn(['queryBrowser', 'queries', action.payload.index]);
      const isEnabled = !query.get('isEnabled');
      return state.setIn(
        ['queryBrowser', 'queries', action.payload.index],
        query.merge({isEnabled, isExpanded: isEnabled, query: isEnabled ? query.get('text') : ''})
      );
    }
    case ActionType.QueryBrowserToggleSeries:
      return state.updateIn(
        ['queryBrowser', 'queries', action.payload.index, 'disabledSeries'],
        v => _.xorWith(v, [action.payload.labels], _.isEqual)
      );

    case ActionType.SelectOverviewItem:
      return state.setIn(['overview', 'selectedUID'], action.payload.uid);

    case ActionType.SelectOverviewDetailsTab:
      return state.setIn(['overview', 'selectedDetailsTab'], action.payload.tab);

    case ActionType.DismissOverviewDetails:
      return state.mergeIn(['overview'], {selectedUID: '', selectedDetailsTab: ''});

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

    case ActionType.SetConsoleLinks:
      return state.set('consoleLinks', action.payload.consoleLinks);

    default:
      break;
  }
  return state;
};

export const createProjectMessageStateToProps = ({UI}: RootState) => {
  return {createProjectMessage: UI.get('createProjectMessage') as string};
};

export const userStateToProps = ({UI}: RootState) => {
  return {user: UI.get('user')};
};

export const impersonateStateToProps = ({UI}: RootState) => {
  return {impersonate: UI.get('impersonate')};
};

export const getActiveNamespace = ({ UI }: RootState): string => UI.get('activeNamespace');

export const getActivePerspective = ({ UI }: RootState): string => UI.get('activePerspective');

export const getActiveApplication = ({ UI }: RootState): string => UI.get('activeApplication');

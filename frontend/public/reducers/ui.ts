import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';

import { ActionType, UIAction } from '../actions/ui';
import { ALL_NAMESPACES_KEY, LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY, NAMESPACE_LOCAL_STORAGE_KEY } from '../const';
import { AlertStates, isSilenced, SilenceStates } from '../reducers/monitoring';
import { legalNamePattern, getNamespace } from '../components/utils/link';
import { OverviewSpecialGroup } from '../components/overview/constants';
import { RootState } from '../redux';

export type UIState = ImmutableMap<string, any>;

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
      createProjectMessage: '',
      overview: ImmutableMap({
        metrics: {},
        resources: ImmutableMap({}),
        selectedDetailsTab: '',
        selectedUID: '',
        selectedView: 'resources',
        selectedGroup: OverviewSpecialGroup.GROUP_BY_APPLICATION,
        groupOptions: ImmutableMap(),
        filterValue: '',
      }),
      user: {},
      clusterID: '',
    });
  }

  switch (action.type) {
    case ActionType.SetActiveNamespace:
      if (!action.payload.namespace) {
        // eslint-disable-next-line no-console
        console.warn('setActiveNamespace: Not setting to falsy!');
        return state;
      }
      return state.set('activeNamespace', action.payload.namespace);

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
      return state.mergeIn(['listSorts', action.payload.listId], _.pick(action.payload, ['field', 'func', 'orderBy']));

    case ActionType.SetCreateProjectMessage:
      return state.set('createProjectMessage', action.payload.message);

    case ActionType.SetUser:
      return state.set('user', action.payload.user);

    case ActionType.SetClusterID:
      return state.set('clusterID', action.payload.clusterID);

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

    case ActionType.SelectOverviewView:
      return state.setIn(['overview', 'selectedView'], action.payload.view);

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

    case ActionType.UpdateOverviewGroupOptions: {
      return state.setIn(['overview', 'groupOptions'], ImmutableMap(action.payload.groups));
    }

    case ActionType.UpdateOverviewFilterValue: {
      return state.setIn(['overview', 'filterValue'], action.payload.value);
    }
    case ActionType.UpdateTimestamps:
      return state.set('lastTick', action.payload.lastTick);

    default:
      break;
  }
  return state;
};

export const clusterIDStateToProps = ({UI}: RootState) => {
  return {clusterID: UI.get('clusterID') as string};
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

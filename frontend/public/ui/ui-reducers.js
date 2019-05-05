import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';

import { types } from './ui-actions';
import { ALL_NAMESPACES_KEY, LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY, NAMESPACE_LOCAL_STORAGE_KEY } from '../const';
import { AlertStates, isSilenced, SilenceStates } from '../monitoring';
import { legalNamePattern, getNamespace } from '../components/utils/link';
import { OverviewSpecialGroup } from '../components/overview/constants';

export default (state, action) => {
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
      overview: new ImmutableMap({
        metrics: {},
        resources: new ImmutableMap({}),
        selectedDetailsTab: '',
        selectedUID: '',
        selectedView: 'resources',
        selectedGroup: OverviewSpecialGroup.GROUP_BY_APPLICATION,
        groupOptions: new ImmutableMap(),
        filterValue: '',
      }),
      user: {},
      clusterID: '',
    });
  }

  switch (action.type) {
    case types.setActiveNamespace:
      if (!action.value) {
        // eslint-disable-next-line no-console
        console.warn('setActiveNamespace: Not setting to falsy!');
        return state;
      }
      return state.set('activeNamespace', action.value);

    case types.setCurrentLocation: {
      state = state.set('location', action.location);
      const ns = getNamespace(action.location);
      if (_.isUndefined(ns)) {
        return state;
      }
      return state.set('activeNamespace', ns);
    }
    case types.startImpersonate:
      return state.set('impersonate', {kind: action.kind, name: action.name, subprotocols: action.subprotocols});

    case types.stopImpersonate:
      return state.delete('impersonate');

    case types.sortList:
      return state.mergeIn(['listSorts', action.listId], _.pick(action, ['field', 'func', 'orderBy']));

    case types.setCreateProjectMessage:
      return state.set('createProjectMessage', action.message);

    case types.setUser:
      return state.set('user', action.user);

    case types.setClusterID:
      return state.set('clusterID', action.clusterID);

    case types.setPodMemoryMetrics:
      return state.setIn(['pod', 'memory'], action.metrics);

    case types.setMonitoringData: {
      const alerts = action.key === 'alerts' ? action.data : state.getIn(['monitoring', 'alerts']);
      const firingAlerts = _.filter(_.get(alerts, 'data'), a => [AlertStates.Firing, AlertStates.Silenced].includes(a.state));
      const silences = action.key === 'silences' ? action.data : state.getIn(['monitoring', 'silences']);

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
    case types.toggleMonitoringGraphs:
      return state.setIn(['monitoring', 'hideGraphs'], !state.getIn(['monitoring', 'hideGraphs']));

    case types.selectOverviewView:
      return state.setIn(['overview', 'selectedView'], action.view);

    case types.selectOverviewItem:
      return state.setIn(['overview', 'selectedUID'], action.uid);

    case types.selectOverviewDetailsTab:
      return state.setIn(['overview', 'selectedDetailsTab'], action.tab);

    case types.dismissOverviewDetails:
      return state.mergeIn(['overview'], {selectedUID: '', selectedDetailsTab: ''});

    case types.updateOverviewMetrics:
      return state.setIn(['overview', 'metrics'], action.metrics);

    case types.updateOverviewResources: {
      const newResources = new ImmutableMap(_.keyBy(action.resources, 'obj.metadata.uid'));
      return state.setIn(['overview', 'resources'], newResources);
    }

    case types.updateOverviewSelectedGroup: {
      return state.setIn(['overview', 'selectedGroup'], action.group);
    }

    case types.updateOverviewGroupOptions: {
      return state.setIn(['overview', 'groupOptions'], new ImmutableMap(action.groups));
    }

    case types.updateOverviewFilterValue: {
      return state.setIn(['overview', 'filterValue'], action.value);
    }

    case types.updateTimestamps:
      return state.set('lastTick', action.lastTick);

    default:
      break;
  }
  return state;
};

export const clusterIDStateToProps = ({UI}) => {
  return {clusterID: UI.get('clusterID')};
};

export const createProjectMessageStateToProps = ({UI}) => {
  return {createProjectMessage: UI.get('createProjectMessage')};
};

export const userStateToProps = ({UI}) => {
  return {user: UI.get('user')};
};

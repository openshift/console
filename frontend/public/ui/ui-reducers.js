import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';

import { types } from './ui-actions';
import { ALL_NAMESPACES_KEY, LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY, NAMESPACE_LOCAL_STORAGE_KEY } from '../const';
import { AlertStates, isSilenced } from '../monitoring';
import { legalNamePattern, getNamespace } from '../components/utils/link';

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
        resources: new ImmutableMap({}),
        selectedDetailsTab: '',
        selectedUID: '',
      }),
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

    case types.setMonitoringData:
      state = state.setIn(['monitoring', action.key], action.data);

      // For Alerts that are silenced by at least one active Silence, set the Alert's state to indicate that
      if (action.key === 'rules' || action.key === 'silences') {
        const alerts = state.getIn(['monitoring', 'rules']);
        const silences = state.getIn(['monitoring', 'silences'], {}).data;

        _.each(_.get(alerts, 'data'), a => {
          if (a.state === AlertStates.Firing && _.some(silences, s => isSilenced(a, s))) {
            a.state = AlertStates.Silenced;
          }
        });
        state = state.setIn(['monitoring', 'rules'], alerts);
      }
      return state;

    case types.selectOverviewView:
      return state.setIn(['overview', 'selectedView'], action.view);

    case types.selectOverviewItem:
      return state.setIn(['overview', 'selectedUID'], action.uid);

    case types.selectOverviewDetailsTab:
      return state.setIn(['overview', 'selectedDetailsTab'], action.tab);

    case types.dismissOverviewDetails:
      return state.mergeIn(['overview'], {selectedUID: '', selectedDetailsTab: ''});

    case types.updateOverviewResources: {
      const newResources = new ImmutableMap(_.keyBy(action.resources, 'obj.metadata.uid'));
      return state.setIn(['overview', 'resources'], newResources);
    }
    default:
      break;
  }
  return state;
};

export const createProjectMessageStateToProps = ({UI}) => {
  return {createProjectMessage: UI.get('createProjectMessage')};
};

export const monitoringAlertsToProps = ({UI}) => UI.getIn(['monitoring', 'alerts'], {});
export const monitoringRulesToProps = ({UI}) => UI.getIn(['monitoring', 'rules'], {});
export const monitoringSilencesToProps = ({UI}) => UI.getIn(['monitoring', 'silences'], {});

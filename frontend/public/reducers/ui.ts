import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';

import { ActionType, UIAction } from '../actions/ui';
import { ALL_APPLICATIONS_KEY, ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { getNamespace } from '../components/utils/link';
import { OverviewSpecialGroup } from '../components/overview/constants';
import { RootState } from '../redux';
import { getImpersonate, getUser } from '@console/dynamic-plugin-sdk';

export type UIState = ImmutableMap<string, any>;

export default (state: UIState, action: UIAction): UIState => {
  if (!state) {
    const { pathname } = window.location;
    return ImmutableMap({
      activeNavSectionId: 'workloads',
      location: pathname,
      activeCluster: 'local-cluster',
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
    });
  }

  switch (action.type) {
    case ActionType.SetActiveApplication:
      return state.set('activeApplication', action.payload.application);

    case ActionType.SetActiveCluster:
      return state.set('activeCluster', action.payload.cluster);

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

    case ActionType.SortList:
      return state.mergeIn(
        ['listSorts', action.payload.listId],
        _.pick(action.payload, ['field', 'func', 'orderBy']),
      );

    case ActionType.SetCreateProjectMessage:
      return state.set('createProjectMessage', action.payload.message);

    case ActionType.SetClusterID:
      return state.set('clusterID', action.payload.clusterID);

    case ActionType.NotificationDrawerToggleExpanded:
      return state.setIn(
        ['notifications', 'isExpanded'],
        !state.getIn(['notifications', 'isExpanded']),
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

export const userStateToProps = (state: RootState) => {
  return { user: getUser(state) };
};

export const impersonateStateToProps = (state: RootState) => {
  return { impersonate: getImpersonate(state) };
};

export const getActiveCluster = ({ UI }: RootState): string => UI.get('activeCluster');

export const getActiveNamespace = ({ UI }: RootState): string => UI.get('activeNamespace');

export const getActiveApplication = ({ UI }: RootState): string => UI.get('activeApplication');

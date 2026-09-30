import * as _ from 'lodash';
import { getUser } from '@console/dynamic-plugin-sdk';
import { ALL_APPLICATIONS_KEY } from '@console/shared/src/constants/common';
import { ActionType } from '../actions/common';
import type { UIAction } from '../actions/ui';
import { OverviewSpecialGroup } from '../components/overview/constants';
import type { RootState } from '../redux';

export type UIState = Record<string, any>;

export default (state: UIState, action: UIAction): UIState => {
  if (!state) {
    const { pathname } = window.location;
    return {
      activeNavSectionId: 'workloads',
      location: pathname,
      showOperandsInAllNamespaces: true,
      activeApplication: ALL_APPLICATIONS_KEY,
      pluginCSPViolations: {},
      createProjectMessage: '',
      serviceLevel: {
        level: '',
        daysRemaining: null,
        trialDateEnd: null,
        hasSecretAccess: false,
        clusterID: '',
      },
      overview: {
        metrics: {},
        resources: {},
        selectedDetailsTab: 'Resources',
        selectedUID: '',
        selectedGroup: OverviewSpecialGroup.GROUP_BY_APPLICATION,
        groupOptions: {},
        filterValue: '',
      },
      user: {},
      utilizationDuration: {
        duration: null,
        endTime: null,
        selectedKey: null,
      },
      deprecatedOperator: {
        package: null,
        channel: null,
        version: null,
      },
    };
  }

  switch (action.type) {
    case ActionType.SetActiveApplication:
      return { ...state, activeApplication: action.payload.application };

    case ActionType.SetCurrentLocation:
      return { ...state, location: action.payload.location };
    case ActionType.SetServiceLevel:
      return {
        ...state,
        serviceLevel: {
          level: action.payload.serviceLevel,
          daysRemaining: action.payload.daysRemaining,
          clusterID: action.payload.clusterID,
          trialDateEnd: action.payload.trialDateEnd,
          hasSecretAccess: action.payload.hasSecretAccess,
        },
      };

    case ActionType.SortList:
      return {
        ...state,
        listSorts: {
          ...state.listSorts,
          [action.payload.listId]: {
            ...state.listSorts?.[action.payload.listId],
            ..._.pick(action.payload, ['field', 'func', 'orderBy']),
          },
        },
      };

    case ActionType.SetCreateProjectMessage:
      return { ...state, createProjectMessage: action.payload.message };

    case ActionType.SetClusterID:
      return { ...state, clusterID: action.payload.clusterID };

    case ActionType.NotificationDrawerToggleExpanded:
      return {
        ...state,
        notifications: {
          ...state.notifications,
          isExpanded: !state.notifications?.isExpanded,
        },
      };

    case ActionType.SelectOverviewItem:
      return {
        ...state,
        overview: { ...state.overview, selectedUID: action.payload.uid },
      };

    case ActionType.SelectOverviewDetailsTab:
      return {
        ...state,
        overview: { ...state.overview, selectedDetailsTab: action.payload.tab },
      };

    case ActionType.DismissOverviewDetails:
      return {
        ...state,
        overview: { ...state.overview, selectedUID: '', selectedDetailsTab: '' },
      };

    case ActionType.UpdateOverviewMetrics:
      return {
        ...state,
        overview: { ...state.overview, metrics: action.payload.metrics },
      };

    case ActionType.UpdateOverviewResources: {
      const newResources = _.keyBy(action.payload.resources, 'obj.metadata.uid');
      return {
        ...state,
        overview: { ...state.overview, resources: newResources },
      };
    }

    case ActionType.UpdateOverviewSelectedGroup:
      return {
        ...state,
        overview: { ...state.overview, selectedGroup: action.payload.group },
      };

    case ActionType.UpdateOverviewLabels:
      return {
        ...state,
        overview: { ...state.overview, labels: action.payload.labels },
      };

    case ActionType.UpdateOverviewFilterValue:
      return {
        ...state,
        overview: { ...state.overview, filterValue: action.payload.value },
      };

    case ActionType.SetPodMetrics:
      return {
        ...state,
        metrics: { ...state.metrics, pod: action.payload.podMetrics },
      };

    case ActionType.SetNamespaceMetrics:
      return {
        ...state,
        metrics: { ...state.metrics, namespace: action.payload.namespaceMetrics },
      };
    case ActionType.SetNodeMetrics:
      return {
        ...state,
        metrics: { ...state.metrics, node: action.payload.nodeMetrics },
      };
    case ActionType.SetPVCMetrics:
      return {
        ...state,
        metrics: { ...state.metrics, pvc: action.payload.pvcMetrics },
      };
    case ActionType.SetUtilizationDuration:
      return {
        ...state,
        utilizationDuration: {
          ...state.utilizationDuration,
          duration: action.payload.duration,
        },
      };
    case ActionType.SetUtilizationDurationSelectedKey:
      return {
        ...state,
        utilizationDuration: {
          ...state.utilizationDuration,
          selectedKey: action.payload.key,
        },
      };
    case ActionType.SetUtilizationDurationEndTime:
      return {
        ...state,
        utilizationDuration: {
          ...state.utilizationDuration,
          endTime: action.payload.endTime,
        },
      };
    case ActionType.SetShowOperandsInAllNamespaces:
      return { ...state, showOperandsInAllNamespaces: action.payload.value };
    case ActionType.SetDeprecatedPackage:
      return {
        ...state,
        deprecatedOperator: { ...state.deprecatedOperator, package: action.payload.value },
      };
    case ActionType.SetDeprecatedChannel:
      return {
        ...state,
        deprecatedOperator: { ...state.deprecatedOperator, channel: action.payload.value },
      };
    case ActionType.SetDeprecatedVersion:
      return {
        ...state,
        deprecatedOperator: { ...state.deprecatedOperator, version: action.payload.value },
      };
    case ActionType.SetPluginCSPViolations:
      return {
        ...state,
        pluginCSPViolations: {
          ...state.pluginCSPViolations,
          [action.payload.pluginName]: action.payload.hasViolation,
        },
      };
    default:
      break;
  }
  return state;
};

export const userStateToProps = (state: RootState) => ({ user: getUser(state) });

export const getActiveApplication = ({ UI }: RootState): string => UI.activeApplication;

export const isNotificationDrawerExpanded = ({ UI }: RootState): boolean =>
  !!UI.notifications?.isExpanded;

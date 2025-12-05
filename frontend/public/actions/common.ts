import { action } from 'typesafe-actions';

export enum ActionType {
  DismissOverviewDetails = 'dismissOverviewDetails',
  SelectOverviewDetailsTab = 'selectOverviewDetailsTab',
  SelectOverviewItem = 'selectOverviewItem',
  SetActiveApplication = 'setActiveApplication',
  SetActiveNamespace = 'setActiveNamespace',
  SetCreateProjectMessage = 'setCreateProjectMessage',
  SetCurrentLocation = 'setCurrentLocation',
  SetServiceLevel = 'setServiceLevel',
  NotificationDrawerToggleExpanded = 'notificationDrawerExpanded',
  SetClusterID = 'setClusterID',
  SortList = 'sortList',
  UpdateOverviewMetrics = 'updateOverviewMetrics',
  UpdateOverviewResources = 'updateOverviewResources',
  UpdateOverviewSelectedGroup = 'updateOverviewSelectedGroup',
  UpdateOverviewLabels = 'updateOverviewLabels',
  UpdateOverviewFilterValue = 'updateOverviewFilterValue',
  UpdateTimestamps = 'updateTimestamps',
  SetPodMetrics = 'setPodMetrics',
  SetNamespaceMetrics = 'setNamespaceMetrics',
  SetNodeMetrics = 'setNodeMetrics',
  SetPVCMetrics = 'setPVCMetrics',
  SetUtilizationDuration = 'SetUtilizationDuration',
  SetUtilizationDurationSelectedKey = 'SetUtilizationDurationSelectedKey',
  SetUtilizationDurationEndTime = 'SetUtilizationDurationEndTime',
  SetShowOperandsInAllNamespaces = 'setShowOperandsInAllNamespaces',
  SetDeprecatedPackage = 'setDeprecatedPackage',
  SetDeprecatedChannel = 'setDeprecatedChannel',
  SetDeprecatedVersion = 'setDeprecatedVersion',
  SetPluginCSPViolations = 'setPluginCSPViolations',
}

export const setClusterID = (clusterID: string) => action(ActionType.SetClusterID, { clusterID });
export const setCreateProjectMessage = (message: string) =>
  action(ActionType.SetCreateProjectMessage, { message });

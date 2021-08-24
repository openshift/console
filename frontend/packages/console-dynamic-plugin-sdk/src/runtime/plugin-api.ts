/* eslint-disable global-require, @typescript-eslint/no-require-imports */

export const exposePluginAPI = () => {
  window.api = {
    useK8sWatchResource: require('@console/internal/components/utils/k8s-watch-hook')
      .useK8sWatchResource,
    useK8sWatchResources: require('@console/internal/components/utils/k8s-watch-hook')
      .useK8sWatchResources,
    useResolvedExtensions: require('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions')
      .useResolvedExtensions,
    consoleFetch: require('@console/dynamic-plugin-sdk/src/utils/fetch').consoleFetch,
    consoleFetchJSON: require('@console/dynamic-plugin-sdk/src/utils/fetch').consoleFetchJSON,
    consoleFetchText: require('@console/dynamic-plugin-sdk/src/utils/fetch').consoleFetchText,
    HorizontalNav: require('@console/internal/components/utils/horizontal-nav').HorizontalNavFacade,
  };
  window.internalAPI = {
    AcitivityItem: require('@console/shared/src/components/dashboard/activity-card/ActivityItem')
      .default,
    ActivityBody: require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
      .default,
    RecentEventsBody: require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
      .RecentEventsBody,
    OngoingActivityBody: require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
      .OngoingActivityBody,

    AlertsBody: require('@console/shared/src/components/dashboard/status-card/AlertsBody').default,
    AlertItem: require('@console/shared/src/components/dashboard/status-card/AlertItem').default,
    HealthItem: require('@console/shared/src/components/dashboard/status-card/HealthItem').default,
    HealthBody: require('@console/shared/src/components/dashboard/status-card/HealthBody').default,

    DashboardCard: require('@console/shared/src/components/dashboard/dashboard-card/DashboardCard')
      .default,
    DashboardCardBody: require('@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody')
      .default,
    DashboardCardHeader: require('@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader')
      .default,
    DashboardCardTitle: require('@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle')
      .default,
    DashboardGrid: require('@console/shared/src/components/dashboard//DashboardGrid').default,

    ResourceInventoryItem: require('@console/shared/src/components/dashboard/inventory-card/InventoryItem')
      .ResourceInventoryItem,

    DetailItem: require('@console/shared/src/components/dashboard/details-card/DetailItem').default,
    DetailsBody: require('@console/shared/src/components/dashboard/details-card/DetailsBody')
      .default,

    UtilizationItem: require('@console/shared/src/components/dashboard/utilization-card/UtilizationItem')
      .default,
    UtilizationBody: require('@console/shared/src/components/dashboard/utilization-card/UtilizationBody')
      .default,
    useUtilizationDuration: require('@console/shared/src/hooks/useUtilizationDuration')
      .useUtilizationDuration,
    UtilizationDurationDropdown: require('@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown')
      .UtilizationDurationDropdown,

    usePrometheusPoll: require('@console/internal/components/graphs/prometheus-poll-hook')
      .usePrometheusPoll,
    GenericStatus: require('@console/shared/src/components/status/Status').default,
    Status: require('@console/shared/src/components/status/GenericStatus').default,
    StatusIconAndText: require('@console/shared/src/components/status/StatusIconAndText').default,
    ErrorStatus: require('@console/shared/src/components/status/statuses').ErrorStatus,
    SuccessStatus: require('@console/shared/src/components/status/statuses').SuccessStatus,
    PendingStatus: require('@console/shared/src/components/status/statuses').PendingStatus,
    ProgressStatus: require('@console/shared/src/components/status/statuses').ProgressStatus,
    InfoIcon: require('@console/shared/src/components/status/icons').BlueInfoCircleIcon,
    SuccessIcon: require('@console/shared/src/components/status/icons').GreenCheckCircleIcon,
    ErrorIcon: require('@console/shared/src/components/status/icons').RedExclamationCircleIcon,
    WarningIcon: require('@console/shared/src/components/status/icons')
      .YellowExclamationTriangleIcon,
  };
};

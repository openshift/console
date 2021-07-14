/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */

export const exposedAPIs = {
  useDashboardPrometheusQuery: require('@console/shared/src/components/dashboard/utilization-card/prometheus-hook')
    .usePrometheusQuery,
  useResolvedExtensions: require('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions')
    .useResolvedExtensions,

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
  DetailsBody: require('@console/shared/src/components/dashboard/details-card/DetailsBody').default,

  UtilizationItem: require('@console/shared/src/components/dashboard/utilization-card/UtilizationItem')
    .default,

  PageHeading: require('@console/internal/components/utils/headings').PageHeading,
  HorizontalNav: require('@console/internal/components/utils/horizontal-nav').HorizontalNav,
};

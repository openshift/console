/* eslint-disable */
import {
  ActivityItemProps,
  ActivityBodyProps,
  RecentEventsBodyProps,
  OngoingActivityBodyProps,
  AlertsBodyProps,
  AlertItemProps,
  HealthItemProps,
  DashboardCardProps,
  DashboardCardBodyProps,
  DashboardCardHeaderProps,
  DashboardCardTitleProps,
  DashboardGridProps,
  ResourceInventoryItemProps,
  DetailItemProps,
  DetailsBodyProps,
  UtilizationItemProps,
  UtilizationBodyProps,
  UtilizationDurationDropdownProps,
  UseUtilizationDuration,
  UsePrometheusPoll,
} from './internal-types';

import { safeRequire } from '../utils/require';

export const ActivityItem: React.FC<ActivityItemProps> = safeRequire('@console/shared/src/components/dashboard/activity-card/ActivityItem')
  .default;
export const ActivityBody: React.FC<ActivityBodyProps> = safeRequire('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .default;
export const RecentEventsBody: React.FC<RecentEventsBodyProps> = safeRequire('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .RecentEventsBody;
export const OngoingActivityBody: React.FC<OngoingActivityBodyProps> = safeRequire('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .OngoingActivityBody;
export const AlertsBody: React.FC<AlertsBodyProps> = safeRequire('@console/shared/src/components/dashboard/status-card/AlertsBody')
  .default;
export const AlertItem: React.FC<AlertItemProps> = safeRequire('@console/shared/src/components/dashboard/status-card/AlertItem')
  .default;
export const HealthItem: React.FC<HealthItemProps> = safeRequire('@console/shared/src/components/dashboard/status-card/HealthItem')
  .default;
export const HealthBody: React.FC = safeRequire('@console/shared/src/components/dashboard/status-card/HealthBody')
  .default;
export const DashboardCard: React.FC<DashboardCardProps> = safeRequire('@console/shared/src/components/dashboard/dashboard-card/DashboardCard')
  .default;
export const DashboardCardBody: React.FC<DashboardCardBodyProps> = safeRequire('@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody')
  .default;
export const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = safeRequire('@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader')
  .default;
export const DashboardCardTitle: React.FC<DashboardCardTitleProps> = safeRequire('@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle')
  .default;
export const DashboardGrid: React.FC<DashboardGridProps> = safeRequire('@console/shared/src/components/dashboard//DashboardGrid')
  .default;
export const ResourceInventoryItem: React.FC<ResourceInventoryItemProps> = safeRequire('@console/shared/src/components/dashboard/inventory-card/InventoryItem')
  .ResourceInventoryItem;
export const DetailItem: React.FC<DetailItemProps> = safeRequire('@console/shared/src/components/dashboard/details-card/DetailItem')
  .default;
export const DetailsBody: React.FC<DetailsBodyProps> = safeRequire('@console/shared/src/components/dashboard/details-card/DetailsBody')
  .default;
export const UtilizationItem: React.FC<UtilizationItemProps> = safeRequire('@console/shared/src/components/dashboard/utilization-card/UtilizationItem')
  .default;
export const UtilizationBody: React.FC<UtilizationBodyProps> = safeRequire('@console/shared/src/components/dashboard/utilization-card/UtilizationBody')
  .default;
export const useUtilizationDuration: UseUtilizationDuration = safeRequire('@console/shared/src/hooks/useUtilizationDuration')
  .useUtilizationDuration;
export const UtilizationDurationDropdown: React.FC<UtilizationDurationDropdownProps> = safeRequire('@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown')
  .UtilizationDurationDropdown;
export const usePrometheusPoll: UsePrometheusPoll = safeRequire('@console/internal/components/graphs/prometheus-poll-hook')
  .usePrometheusPoll;

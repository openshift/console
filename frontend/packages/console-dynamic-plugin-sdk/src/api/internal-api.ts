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
} from './internal-types';

export const ActivityItem: React.FC<ActivityItemProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityItem')
  .default;
export const ActivityBody: React.FC<ActivityBodyProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .default;
export const RecentEventsBody: React.FC<RecentEventsBodyProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .RecentEventsBody;
export const OngoingActivityBody: React.FC<OngoingActivityBodyProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .OngoingActivityBody;
export const AlertsBody: React.FC<AlertsBodyProps> = require('@console/shared/src/components/dashboard/status-card/AlertsBody')
  .default;
export const AlertItem: React.FC<AlertItemProps> = require('@console/shared/src/components/dashboard/status-card/AlertItem')
  .default;
export const HealthItem: React.FC<HealthItemProps> = require('@console/shared/src/components/dashboard/status-card/HealthItem')
  .default;
export const HealthBody: React.FC = require('@console/shared/src/components/dashboard/status-card/HealthBody')
  .default;
export const DashboardCard: React.FC<DashboardCardProps> = require('@console/shared/src/components/dashboard/dashboard-card/DashboardCard')
  .default;
export const DashboardCardBody: React.FC<DashboardCardBodyProps> = require('@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody')
  .default;
export const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = require('@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader')
  .default;
export const DashboardCardTitle: React.FC<DashboardCardTitleProps> = require('@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle')
  .default;
export const DashboardGrid: React.FC<DashboardGridProps> = require('@console/shared/src/components/dashboard//DashboardGrid')
  .default;
export const ResourceInventoryItem: React.FC<ResourceInventoryItemProps> = require('@console/shared/src/components/dashboard/inventory-card/InventoryItem')
  .ResourceInventoryItem;
export const DetailItem: React.FC<DetailItemProps> = require('@console/shared/src/components/dashboard/details-card/DetailItem')
  .default;
export const DetailsBody: React.FC<DetailsBodyProps> = require('@console/shared/src/components/dashboard/details-card/DetailsBody')
  .default;
export const UtilizationItem: React.FC<UtilizationItemProps> = require('@console/shared/src/components/dashboard/utilization-card/UtilizationItem')
  .default;
export const UtilizationBody: React.FC<UtilizationBodyProps> = require('@console/shared/src/components/dashboard/utilization-card/UtilizationBody')
  .default;
export const useUtilizationDuration: UseUtilizationDuration = require('@console/shared/src/hooks/useUtilizationDuration')
  .useUtilizationDuration;
export const UtilizationDurationDropdown: React.FC<UtilizationDurationDropdownProps> = require('@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown')
  .UtilizationDurationDropdown;

import {
  RecentEventsBodyProps,
  OngoingActivityBodyProps,
  AlertItemProps,
  HealthItemProps,
  DashboardCardProps,
  DashboardCardBodyProps,
  DashboardCardHeaderProps,
  DashboardCardTitleProps,
  ResourceInventoryItemProps,
  DetailsBodyProps,
  DetailItemProps,
  UtilizationItemProps,
  DashboardGridProps,
  UtilizationBodyProps,
  ActivityItemProps,
  ActivityBodyProps,
  AlertsBodyProps,
  UtilizationDurationDropdownProps,
  UseUtilizationDuration,
  UsePrometheusPoll,
} from './types';

const MockImpl = () => {
  throw new Error('Add the component in Webpack Externals.');
};

// Actity Card Related Components
export const ActivityItem: React.FC<ActivityItemProps> = MockImpl;
export const ActivityBody: React.FC<ActivityBodyProps> = MockImpl;
export const RecentEventsBody: React.FC<RecentEventsBodyProps> = MockImpl;
export const OngoingActivityBody: React.FC<OngoingActivityBodyProps> = MockImpl;

// Alerts Related Components
export const AlertsBody: React.FC<AlertsBodyProps> = MockImpl;
export const AlertItem: React.FC<AlertItemProps> = MockImpl;

// Status Card Related Components
export const HealthBody: React.FC = MockImpl;
export const HealthItem: React.FC<HealthItemProps> = MockImpl;

// Dashboard Card Related Items
export const DashboardCard: React.FC<DashboardCardProps> = MockImpl;
export const DashboardCardBody: React.FC<DashboardCardBodyProps> = MockImpl;
export const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = MockImpl;
export const DashboardCardTitle: React.FC<DashboardCardTitleProps> = MockImpl;
export const DashboardGrid: React.FC<DashboardGridProps> = MockImpl;

// ResourceInventoryItem
export const ResourceInventoryItem: React.FC<ResourceInventoryItemProps> = MockImpl;

// Details Card Related components
export const DetailItem: React.FC<DetailItemProps> = MockImpl;
export const DetailsBody: React.FC<DetailsBodyProps> = MockImpl;

// Utilization Card Related Components
export const UtilizationItem: React.FC<UtilizationItemProps> = MockImpl;
export const UtilizationBody: React.FC<UtilizationBodyProps> = MockImpl;
export const UtilizationDurationDropdown: React.FC<UtilizationDurationDropdownProps> = MockImpl;
export const useUtilizationDuration: UseUtilizationDuration = MockImpl;
export const usePrometheusPoll: UsePrometheusPoll = MockImpl;

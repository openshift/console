/* eslint-disable */
import type { FC } from 'react';
import {
  ActivityItemProps,
  ActivityBodyProps,
  RecentEventsBodyProps,
  OngoingActivityBodyProps,
  AlertsBodyProps,
  AlertItemProps,
  HealthItemProps,
  ResourceInventoryItemProps,
  UtilizationItemProps,
  UtilizationBodyProps,
  UtilizationDurationDropdownProps,
  UseUtilizationDuration,
  VirtualizedGridProps,
  LazyActionMenuProps,
  UseDashboardResources,
  QuickStartsLoaderProps,
  UseURLPoll,
  UseLastNamespace,
  ConsoleDataViewProps,
  DefinitionFor,
} from './internal-types';
import { UseUserSettings } from '../extensions/console-types';

export * from './internal-console-api';
export * from './internal-topology-api';

export const ActivityItem: FC<ActivityItemProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityItem')
  .default;

export const ActivityBody: FC<ActivityBodyProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .default;

export const RecentEventsBody: FC<RecentEventsBodyProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .RecentEventsBody;

export const OngoingActivityBody: FC<OngoingActivityBodyProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .OngoingActivityBody;

export const AlertsBody: FC<AlertsBodyProps> = require('@console/shared/src/components/dashboard/status-card/AlertsBody')
  .default;

export const AlertItem: FC<AlertItemProps> = require('@console/shared/src/components/dashboard/status-card/AlertItem')
  .default;

export const HealthItem: FC<HealthItemProps> = require('@console/shared/src/components/dashboard/status-card/HealthItem')
  .default;

export const HealthBody: FC = require('@console/shared/src/components/dashboard/status-card/HealthBody')
  .default;

export const ResourceInventoryItem: FC<ResourceInventoryItemProps> = require('@console/shared/src/components/dashboard/inventory-card/InventoryItem')
  .ResourceInventoryItem;

export const UtilizationItem: FC<UtilizationItemProps> = require('@console/shared/src/components/dashboard/utilization-card/UtilizationItem')
  .default;

export const UtilizationBody: FC<UtilizationBodyProps> = require('@console/shared/src/components/dashboard/utilization-card/UtilizationBody')
  .UtilizationBody;

export const UtilizationDurationDropdown: FC<UtilizationDurationDropdownProps> = require('@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown')
  .UtilizationDurationDropdown;

export const VirtualizedGrid: FC<VirtualizedGridProps> = require('@console/shared/src/components/virtualized-grid/VirtualizedGrid')
  .default;

export const LazyActionMenu: FC<LazyActionMenuProps> = require('@console/shared/src/components/actions/LazyActionMenu')
  .default;

export const QuickStartsLoader: FC<QuickStartsLoaderProps> = require('@console/app/src/components/quick-starts/loader/QuickStartsLoader')
  .QuickStartsLoader;

export const useUtilizationDuration: UseUtilizationDuration = require('@console/shared/src/hooks/useUtilizationDuration')
  .useUtilizationDuration;

export const useDashboardResources: UseDashboardResources = require('@console/shared/src/hooks/useDashboardResources')
  .useDashboardResources;

/**
 * @deprecated This hook is now exposed by core plugin SDK package.
 */
export const useUserSettings: UseUserSettings = require('@console/shared/src/hooks/useUserSettings')
  .useUserSettings;

export const useURLPoll: UseURLPoll = require('@console/internal/components/utils/url-poll-hook')
  .useURLPoll;

export const useLastNamespace: UseLastNamespace = require('@console/app/src/components/detect-namespace/useLastNamespace')
  .useLastNamespace;

export const ConsoleDataView: <
  TData,
  TCustomRowData = any,
  TFilters extends import('./internal-types').ResourceFilters = import('./internal-types').ResourceFilters
>(
  props: ConsoleDataViewProps<TData, TCustomRowData, TFilters>,
) => JSX.Element = require('@console/app/src/components/data-view/ConsoleDataView').ConsoleDataView;

export const cellIsStickyProps: import('./internal-types').CellIsStickyProps = require('@console/app/src/components/data-view/ConsoleDataView')
  .cellIsStickyProps;

export const getNameCellProps: import('./internal-types').GetNameCellProps = require('@console/app/src/components/data-view/ConsoleDataView')
  .getNameCellProps;

export const actionsCellProps: import('./internal-types').ActionsCellProps = require('@console/app/src/components/data-view/ConsoleDataView')
  .actionsCellProps;

export const initialFiltersDefault: import('./internal-types').ResourceFilters = require('@console/app/src/components/data-view/ConsoleDataView')
  .initialFiltersDefault;

export const definitionFor: DefinitionFor = require('@console/internal/module/k8s/swagger')
  .definitionFor;

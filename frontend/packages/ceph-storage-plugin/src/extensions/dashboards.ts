import { Extension, DashboardsExtensionProperties } from '@console/plugin-sdk';

namespace ExtensionProperties {
  export interface DashboardsStorageTopConsumerUsed extends DashboardsExtensionProperties {
    /** The name of the storage top consumer used */
    name: string;

    /** The metricType is Type of the metric */
    metricType: string;

    /** The query which will be used to query prometheus */
    query: string;
  }

  export interface DashboardsStorageTopConsumerRequested extends DashboardsExtensionProperties {
    /** The name of the storage top consumer requested  */
    name: string;

    /** The metricType is Type of the metric */
    metricType: string;

    /** The query which will be used to query prometheus */
    query: string;
  }

  export interface DashboardsStorageCapacityDropdownItem extends DashboardsExtensionProperties {
    /** The name of the metric */
    metric: string;

    /** The queries which will be used to query prometheus */
    queries: [string, string];
  }
}

export interface DashboardsStorageTopConsumerUsed
  extends Extension<ExtensionProperties.DashboardsStorageTopConsumerUsed> {
  type: 'Dashboards/Storage/TopConsumers/Used';
}

export interface DashboardsStorageTopConsumerRequested
  extends Extension<ExtensionProperties.DashboardsStorageTopConsumerRequested> {
  type: 'Dashboards/Storage/TopConsumers/Requested';
}

export interface DashboardsStorageCapacityDropdownItem
  extends Extension<ExtensionProperties.DashboardsStorageCapacityDropdownItem> {
  type: 'Dashboards/Storage/Capacity/Dropdown/Item';
}

export type DashboardsStorageTopConsumerExtension =
  | DashboardsStorageTopConsumerUsed
  | DashboardsStorageTopConsumerRequested;

export const isDashboardsStorageTopConsumerUsed = (
  e: Extension,
): e is DashboardsStorageTopConsumerUsed => e.type === 'Dashboards/Storage/TopConsumers/Used';

export const isDashboardsStorageTopConsumerRequested = (
  e: Extension,
): e is DashboardsStorageTopConsumerRequested =>
  e.type === 'Dashboards/Storage/TopConsumers/Requested';

export const isDashboardsStorageCapacityDropdownItem = (
  e: Extension,
): e is DashboardsStorageCapacityDropdownItem =>
  e.type === 'Dashboards/Storage/Capacity/Dropdown/Item';

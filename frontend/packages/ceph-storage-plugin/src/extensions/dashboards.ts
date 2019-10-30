import { Extension, DashboardsExtensionProperties } from '@console/plugin-sdk';

namespace ExtensionProperties {
  export interface DashboardsStorageCapacityDropdownItem extends DashboardsExtensionProperties {
    /** The name of the metric */
    metric: string;

    /** The queries which will be used to query prometheus */
    queries: [string, string];
  }
}

export interface DashboardsStorageCapacityDropdownItem
  extends Extension<ExtensionProperties.DashboardsStorageCapacityDropdownItem> {
  type: 'Dashboards/Storage/Capacity/Dropdown/Item';
}

export const isDashboardsStorageCapacityDropdownItem = (
  e: Extension,
): e is DashboardsStorageCapacityDropdownItem =>
  e.type === 'Dashboards/Storage/Capacity/Dropdown/Item';

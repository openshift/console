import { Extension } from '../extension';

namespace ExtensionProperties {
  interface DashboardExtension {
    /** Name of feature flag for this item. */
    required: string;
  }

  export interface DashboardsStorageTopConsumerUsed extends DashboardExtension {
    /** The name of the storage top consumer used */
    name: string;

    /** The metricType is Type of the metric */
    metricType: string;

    /** The query which will be used to query prometheus */
    query: string;
  }

  export interface DashboardsStorageTopConsumerRequested extends DashboardExtension {
    /** The name of the storage top consumer requested  */
    name: string;

    /** The metricType is Type of the metric */
    metricType: string;

    /** The query which will be used to query prometheus */
    query: string;
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

export const isDashboardsStorageTopConsumerUsed = (
  e: Extension<any>,
): e is DashboardsStorageTopConsumerUsed => e.type === 'Dashboards/Storage/TopConsumers/Used';

export const isDashboardsStorageTopConsumerRequested = (
  e: Extension<any>,
): e is DashboardsStorageTopConsumerRequested =>
  e.type === 'Dashboards/Storage/TopConsumers/Requested';

export type DashboardStorageExtension =
  | DashboardsStorageTopConsumerRequested
  | DashboardsStorageTopConsumerUsed;

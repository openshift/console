import { SubsystemHealth } from '@console/internal/components/dashboards-page/overview-dashboard/health-card';
import { GridPosition } from '@console/internal/components/dashboard/grid';
import { CapacityQuery } from '@console/internal/components/dashboards-page/overview-dashboard/capacity-query-types';
import { FirehoseResource } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { StatusGroupMapper } from '@console/internal/components/dashboard/inventory-card/inventory-item';

import { Extension } from './extension';
import { LazyLoader } from './types';

namespace ExtensionProperties {
  interface DashboardsOverviewHealthSubsystem<R> {
    /** The subsystem's display name */
    title: string;

    /** Resolve the subsystem's health */
    healthHandler: (response: R) => SubsystemHealth;
  }

  export interface DashboardsOverviewHealthURLSubsystem<R>
    extends DashboardsOverviewHealthSubsystem<R> {
    /**
     * The URL to fetch data from. It will be prefixed with base k8s URL.
     * For example: `healthz` will result in `<k8sBasePath>/healthz`
     */
    url: string;

    /**
     * Custom function to fetch data from the URL.
     * If none is specified, default one (`coFetchJson`) will be used.
     * Response is then parsed by `healthHandler`.
     */
    fetch?: (url: string) => Promise<R>;
  }

  export interface DashboardsOverviewHealthPrometheusSubsystem
    extends DashboardsOverviewHealthSubsystem<any> {
    /** The Prometheus query */
    query: string;
  }

  export interface DashboardsTab {
    /** The tab's ID which will be used as part of href within dashboards page */
    id: string;

    /** The tab title */
    title: string;
  }

  export interface DashboardsCard {
    /** The tab's ID where this card should be rendered */
    tab: string;

    /** The card position in the tab */
    position: GridPosition;

    /** Loader for the corresponding dashboard card component. */
    loader: LazyLoader<any>;
  }

  export interface DashboardsOverviewCapacityQuery {
    /** The original Prometheus query key to replace */
    queryKey: CapacityQuery;

    /** The Prometheus query */
    query: string;
  }

  export interface DashboardsOverviewInventoryItem {
    /** Resource which will be fetched and grouped by `mapper` function. */
    resource: FirehoseResource;

    /** Additional resources which will be fetched and passed to `mapper` function. */
    additionalResources?: FirehoseResource[];

    /** The model for `resource` which will be fetched. The model is used for getting model's label or abbr. */
    model: K8sKind;

    /** Defines whether model's label or abbr should be used when rendering the item. Defaults to false (label). */
    useAbbr?: boolean;

    /** Function which will map various statuses to groups. */
    mapper: StatusGroupMapper;
  }

  export interface DashboardsInventoryItemGroup {
    /** The ID of status group. */
    id: string;

    /** React component representing status group icon. */
    icon: React.ReactElement;
  }
}

export interface DashboardsOverviewHealthURLSubsystem<R>
  extends Extension<ExtensionProperties.DashboardsOverviewHealthURLSubsystem<R>> {
  type: 'Dashboards/Overview/Health/URL';
}

export const isDashboardsOverviewHealthURLSubsystem = (
  e: Extension<any>,
): e is DashboardsOverviewHealthURLSubsystem<any> => e.type === 'Dashboards/Overview/Health/URL';

export interface DashboardsOverviewHealthPrometheusSubsystem
  extends Extension<ExtensionProperties.DashboardsOverviewHealthPrometheusSubsystem> {
  type: 'Dashboards/Overview/Health/Prometheus';
}

export const isDashboardsOverviewHealthPrometheusSubsystem = (
  e: Extension<any>,
): e is DashboardsOverviewHealthPrometheusSubsystem =>
  e.type === 'Dashboards/Overview/Health/Prometheus';

export type DashboardsOverviewHealthSubsystem =
  | DashboardsOverviewHealthURLSubsystem<any>
  | DashboardsOverviewHealthPrometheusSubsystem;

export const isDashboardsOverviewHealthSubsystem = (
  e: Extension<any>,
): e is DashboardsOverviewHealthSubsystem =>
  isDashboardsOverviewHealthURLSubsystem(e) || isDashboardsOverviewHealthPrometheusSubsystem(e);

export interface DashboardsTab extends Extension<ExtensionProperties.DashboardsTab> {
  type: 'Dashboards/Tab';
}

export const isDashboardsTab = (e: Extension<any>): e is DashboardsTab =>
  e.type === 'Dashboards/Tab';

export interface DashboardsCard extends Extension<ExtensionProperties.DashboardsCard> {
  type: 'Dashboards/Card';
}

export const isDashboardsCard = (e: Extension<any>): e is DashboardsCard =>
  e.type === 'Dashboards/Card';

export interface DashboardsOverviewCapacityQuery
  extends Extension<ExtensionProperties.DashboardsOverviewCapacityQuery> {
  type: 'Dashboards/Overview/Capacity/Query';
}

export const isDashboardsOverviewCapacityQuery = (
  e: Extension<any>,
): e is DashboardsOverviewCapacityQuery => e.type === 'Dashboards/Overview/Capacity/Query';

export interface DashboardsOverviewInventoryItem
  extends Extension<ExtensionProperties.DashboardsOverviewInventoryItem> {
  type: 'Dashboards/Overview/Inventory/Item';
}

export const isDashboardsOverviewInventoryItem = (
  e: Extension<any>,
): e is DashboardsOverviewInventoryItem => e.type === 'Dashboards/Overview/Inventory/Item';

export interface DashboardsInventoryItemGroup
  extends Extension<ExtensionProperties.DashboardsInventoryItemGroup> {
  type: 'Dashboards/Inventory/Item/Group';
}

export const isDashboardsInventoryItemGroup = (
  e: Extension<any>,
): e is DashboardsInventoryItemGroup => e.type === 'Dashboards/Inventory/Item/Group';

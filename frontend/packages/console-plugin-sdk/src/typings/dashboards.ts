import { SubsystemHealth } from '@console/internal/components/dashboards-page/overview-dashboard/health-card';
import { CAPACITY_QUERY } from '@console/internal/components/dashboards-page/overview-dashboard/capacity-query-types';
import { GridPosition } from '@console/internal/components/dashboard/grid';

import { Extension } from './extension';

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

  export interface DashboardsOverviewCapacityQuery {
    /** The original Prometheus query key to replace */
    queryKey: CAPACITY_QUERY;

    /** The Prometheus query */
    query: string;
  }

  export interface DashboardsCard {
    /**
     * Tab href. Tab will be generated and it's title will be with capitalized first letter
     * example: `foo` will became `/dashboards/foo` tab with `Foo` title
     */
    tab: string;

    /** The card position in the tab. Defaults to `GridPosition.MAIN` */
    position?: GridPosition;

    /** The card component to render */
    component: React.ReactType;
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

export interface DashboardsOverviewCapacityQuery
  extends Extension<ExtensionProperties.DashboardsOverviewCapacityQuery> {
  type: 'Dashboards/Overview/Capacity/Query';
}

export const isDashboardsOverviewCapacityQuery = (
  e: Extension<any>,
): e is DashboardsOverviewCapacityQuery => e.type === 'Dashboards/Overview/Capacity/Query';

export interface DashboardsCard extends Extension<ExtensionProperties.DashboardsCard> {
  type: 'Dashboards/Card';
}

export const isDashboardsCard = (e: Extension<any>): e is DashboardsCard =>
  e.type === 'Dashboards/Card';

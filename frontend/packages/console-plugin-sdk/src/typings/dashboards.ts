import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { GridPosition } from '@console/internal/components/dashboard/grid';
import { FirehoseResource, Humanize, FirehoseResult } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  StatusGroupMapper,
  ExpandedComponentProps,
} from '@console/internal/components/dashboard/inventory-card/inventory-item';
import { OverviewQuery } from '@console/internal/components/dashboards-page/overview-dashboard/queries';
import { ConsumerMutator } from '@console/internal/components/dashboards-page/overview-dashboard/top-consumers-card';
import { MetricType } from '@console/internal/components/dashboard/top-consumers-card/metric-type';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { Extension } from './extension';
import { LazyLoader } from './types';

namespace ExtensionProperties {
  interface DashboardExtension {
    /** Name of feature flag for this item. */
    required?: string | string[];
  }

  interface DashboardsOverviewHealthSubsystem extends DashboardExtension {
    /** The subsystem's display name */
    title: string;
  }

  export interface DashboardsOverviewHealthURLSubsystem<R>
    extends DashboardsOverviewHealthSubsystem {
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

    /** Additional resource which will be fetched and passed to healthHandler  */
    additionalResource?: FirehoseResource;

    /** Resolve the subsystem's health */
    healthHandler: URLHealthHandler<R>;
  }

  export interface DashboardsOverviewHealthPrometheusSubsystem
    extends DashboardsOverviewHealthSubsystem {
    /** The Prometheus queries */
    queries: string[];

    /** Additional resource which will be fetched and passed to healthHandler  */
    additionalResource?: FirehoseResource;

    /** Resolve the subsystem's health */
    healthHandler: PrometheusHealthHandler;

    /**
     * Loader for popup content. If defined health item will be represented as link
     * which opens popup with given content.
     */
    popupComponent?: LazyLoader<any>;

    /**
     * Popup title
     */
    popupTitle?: string;
  }

  export interface DashboardsTab extends DashboardExtension {
    /** The tab's ID which will be used as part of href within dashboards page */
    id: string;

    /** The tab title */
    title: string;
  }

  export interface DashboardsCard extends DashboardExtension {
    /** The tab's ID where this card should be rendered */
    tab: string;

    /** The card position in the tab */
    position: GridPosition;

    /** Loader for the corresponding dashboard card component. */
    loader: LazyLoader<any>;

    /** Card's vertical span in the column. Ignored for small screens, defaults to 12. */
    span?: DashboardCardSpan;
  }

  export interface DashboardsOverviewQuery extends DashboardExtension {
    /** The original Prometheus query key to replace */
    queryKey: OverviewQuery;

    /** The Prometheus query */
    query: string;
  }

  export interface DashboardsOverviewTopConsumerItem extends DashboardExtension {
    /** The k8s model of top consumer item */
    model: K8sKind;

    /** The name of the top consumer item */
    name: string;

    /** The name of the metric */
    metric: string;

    /** The queries which will be used to query prometheus */
    queries: { [key in MetricType]?: string };

    /** Function which can mutate results of parsed prometheus data */
    mutator?: ConsumerMutator;
  }

  export interface DashboardsOverviewInventoryItem extends DashboardExtension {
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

    /** Loader for the component which will be used when item is expanded. */
    expandedComponent?: LazyLoader<ExpandedComponentProps>;
  }

  export interface DashboardsInventoryItemGroup extends DashboardExtension {
    /** The ID of status group. */
    id: string;

    /** React component representing status group icon. */
    icon: React.ReactElement;
  }

  export interface DashboardsOverviewUtilizationItem extends DashboardExtension {
    /** The utilization item title */
    title: string;

    /** The Prometheus utilization query */
    query: string;

    /** Function which will be used to format data from prometheus */
    humanizeValue: Humanize;
  }

  export interface DashboardsOverviewResourceActivity extends DashboardExtension {
    /** Resource to watch */
    k8sResource: FirehoseResource;

    /**
     * Function which will determine if given resource represents the action.
     * If the function is not defined, every resource represents activity.
     */
    isActivity?: (resource: K8sResourceKind) => boolean;

    /** Timestamp for given action, which will be used for ordering */
    getTimestamp: (resource: K8sResourceKind) => Date;

    /** Loader for corresponding action component */
    loader: LazyLoader<K8sActivityProps>;
  }

  export interface DashboardsOverviewPrometheusActivity extends DashboardExtension {
    /** Queries to watch */
    queries: string[];

    /** Function which will determine if given query results represent the action */
    isActivity: (results: PrometheusResponse[]) => boolean;

    /** Loader for corresponding action component */
    loader: LazyLoader<PrometheusActivityProps>;
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

export interface DashboardsOverviewQuery
  extends Extension<ExtensionProperties.DashboardsOverviewQuery> {
  type: 'Dashboards/Overview/Query';
}

export const isDashboardsOverviewQuery = (e: Extension<any>): e is DashboardsOverviewQuery =>
  e.type === 'Dashboards/Overview/Query';

export interface DashboardsOverviewUtilizationItem
  extends Extension<ExtensionProperties.DashboardsOverviewUtilizationItem> {
  type: 'Dashboards/Overview/Utilization/Item';
}

export const isDashboardsOverviewUtilizationItem = (
  e: Extension<any>,
): e is DashboardsOverviewUtilizationItem => e.type === 'Dashboards/Overview/Utilization/Item';

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

export interface DashboardsOverviewTopConsumerItem
  extends Extension<ExtensionProperties.DashboardsOverviewTopConsumerItem> {
  type: 'Dashboards/Overview/TopConsumers/Item';
}

export const isDashboardsOverviewTopConsumerItem = (
  e: Extension<any>,
): e is DashboardsOverviewTopConsumerItem => e.type === 'Dashboards/Overview/TopConsumers/Item';

export interface DashboardsOverviewResourceActivity
  extends Extension<ExtensionProperties.DashboardsOverviewResourceActivity> {
  type: 'Dashboards/Overview/Activity/Resource';
}

export const isDashboardsOverviewResourceActivity = (
  e: Extension<any>,
): e is DashboardsOverviewResourceActivity => e.type === 'Dashboards/Overview/Activity/Resource';

export interface DashboardsOverviewPrometheusActivity
  extends Extension<ExtensionProperties.DashboardsOverviewPrometheusActivity> {
  type: 'Dashboards/Overview/Activity/Prometheus';
}

export const isDashboardsOverviewPrometheusActivity = (
  e: Extension<any>,
): e is DashboardsOverviewPrometheusActivity =>
  e.type === 'Dashboards/Overview/Activity/Prometheus';

export type DashboardCardSpan = 4 | 6 | 12;

export type K8sActivityProps = {
  resource: K8sResourceKind;
};

export type PrometheusActivityProps = {
  results: PrometheusResponse[];
};

export type SubsystemHealth = {
  message?: string;
  state: HealthState;
};

export type URLHealthHandler<R> = (
  response: R,
  error: any,
  additionalResource?: FirehoseResult<K8sResourceKind | K8sResourceKind[]>,
) => SubsystemHealth;

export type PrometheusHealthHandler = (
  responses: PrometheusResponse[],
  errors: any[],
  additionalResource?: FirehoseResult<K8sResourceKind | K8sResourceKind[]>,
) => SubsystemHealth;

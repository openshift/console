import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { GridPosition } from '@console/shared/src/components/dashboard/DashboardGrid';
import {
  FirehoseResource,
  FirehoseResult,
  FirehoseResourcesResult,
} from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind, K8sResourceCommon } from '@console/internal/module/k8s';
import {
  StatusGroupMapper,
  ExpandedComponentProps,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import { Extension, LazyLoader } from './base';

export interface DashboardsExtensionProperties {
  /** Feature flags which are required for this extension to be effective. */
  required?: string | string[];
  /** Feature flags which are disallowed for this extension to be effective. */
  disallowed?: string | string[];
}

namespace ExtensionProperties {
  interface DashboardsOverviewHealthSubsystem extends DashboardsExtensionProperties {
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

  export interface DashboardsOverviewHealthOperator<R extends K8sResourceCommon>
    extends DashboardsOverviewHealthSubsystem {
    /** Title of operators section in popup */
    title: string;

    /** Resources which will be fetched and passed to healthHandler */
    resources: FirehoseResource[];

    /** Resolve status for operators */
    getOperatorsWithStatuses: GetOperatorsWithStatuses<R>;

    /** Loader for popup row component */
    operatorRowLoader: LazyLoader<OperatorRowProps<R>>;

    /**
     * Link to all resources page.
     * If not provided then a list page of first resource from resources prop is used.
     */
    viewAllLink?: string;
  }

  export interface DashboardsTab extends DashboardsExtensionProperties {
    /** The tab's ID which will be used as part of href within dashboards page */
    id: string;

    /** The tab title */
    title: string;
  }

  export interface DashboardsCard extends DashboardsExtensionProperties {
    /** The tab's ID where this card should be rendered */
    tab: string;

    /** The card position in the tab */
    position: GridPosition;

    /** Loader for the corresponding dashboard card component. */
    loader: LazyLoader;

    /** Card's vertical span in the column. Ignored for small screens, defaults to 12. */
    span?: DashboardCardSpan;
  }

  export interface DashboardsOverviewInventoryItem extends DashboardsExtensionProperties {
    /** The model for `resource` which will be fetched. The model is used for getting model's label or abbr. */
    model: K8sKind;

    /** Function which will map various statuses to groups. */
    mapper?: StatusGroupMapper;

    /** Additional resources which will be fetched and passed to `mapper` function. */
    additionalResources?: WatchK8sResources<any>;

    /** Defines whether model's label or abbr should be used when rendering the item. Defaults to false (label). */
    useAbbr?: boolean;

    /** Loader for the component which will be used when item is expanded. */
    expandedComponent?: LazyLoader<ExpandedComponentProps>;
  }

  export interface DashboardsInventoryItemGroup extends DashboardsExtensionProperties {
    /** The ID of status group. */
    id: string;

    /** React component representing status group icon. */
    icon: React.ReactElement;
  }

  export interface DashboardsOverviewUtilizationItem extends DashboardsExtensionProperties {
    /** The utilization item to be replaced */
    id: string;

    /** The Prometheus utilization query */
    query: string;

    /** The Prometheus total query */
    totalQuery: string;
  }

  export interface DashboardsOverviewResourceActivity extends DashboardsExtensionProperties {
    /** Resource to watch */
    k8sResource: FirehoseResource & { isList: true };

    /**
     * Function which will determine if given resource represents the action.
     * If the function is not defined, every resource represents activity.
     */
    isActivity?: (resource: K8sResourceKind) => boolean;

    /** Timestamp for given action, which will be used for ordering */
    getTimestamp?: (resource: K8sResourceKind) => Date;

    /** Loader for corresponding action component */
    loader: LazyLoader<K8sActivityProps>;
  }

  export interface DashboardsOverviewPrometheusActivity extends DashboardsExtensionProperties {
    /** Queries to watch */
    queries: string[];

    /** Function which will determine if given query results represent the action */
    isActivity: (results: PrometheusResponse[]) => boolean;

    /** Loader for corresponding action component */
    loader: LazyLoader<PrometheusActivityProps>;
  }

  export interface ProjectDashboardInventoryItem extends DashboardsExtensionProperties {
    /** The K8s model which will be scoped to project, fetched and passed to `mapper` function. */
    model: K8sKind;

    /** Additional resources which will be fetched and passed to `mapper` function. */
    additionalResources?: FirehoseResource[];

    /** Defines whether model's label or abbr should be used when rendering the item. Defaults to false (label). */
    useAbbr?: boolean;

    /** Function which will map various statuses to groups. */
    mapper: StatusGroupMapper;
  }
}

export interface DashboardsOverviewHealthURLSubsystem<R = any>
  extends Extension<ExtensionProperties.DashboardsOverviewHealthURLSubsystem<R>> {
  type: 'Dashboards/Overview/Health/URL';
}

export const isDashboardsOverviewHealthURLSubsystem = (
  e: Extension,
): e is DashboardsOverviewHealthURLSubsystem => e.type === 'Dashboards/Overview/Health/URL';

export interface DashboardsOverviewHealthPrometheusSubsystem
  extends Extension<ExtensionProperties.DashboardsOverviewHealthPrometheusSubsystem> {
  type: 'Dashboards/Overview/Health/Prometheus';
}

export const isDashboardsOverviewHealthPrometheusSubsystem = (
  e: Extension,
): e is DashboardsOverviewHealthPrometheusSubsystem =>
  e.type === 'Dashboards/Overview/Health/Prometheus';

export interface DashboardsOverviewHealthOperator<R extends K8sResourceCommon = K8sResourceCommon>
  extends Extension<ExtensionProperties.DashboardsOverviewHealthOperator<R>> {
  type: 'Dashboards/Overview/Health/Operator';
}

export const isDashboardsOverviewHealthOperator = (
  e: Extension,
): e is DashboardsOverviewHealthOperator => e.type === 'Dashboards/Overview/Health/Operator';

export type DashboardsOverviewHealthSubsystem =
  | DashboardsOverviewHealthURLSubsystem
  | DashboardsOverviewHealthPrometheusSubsystem
  | DashboardsOverviewHealthOperator;

export const isDashboardsOverviewHealthSubsystem = (
  e: Extension,
): e is DashboardsOverviewHealthSubsystem =>
  isDashboardsOverviewHealthURLSubsystem(e) ||
  isDashboardsOverviewHealthPrometheusSubsystem(e) ||
  isDashboardsOverviewHealthOperator(e);

export interface DashboardsTab extends Extension<ExtensionProperties.DashboardsTab> {
  type: 'Dashboards/Tab';
}

export const isDashboardsTab = (e: Extension): e is DashboardsTab => e.type === 'Dashboards/Tab';

export interface DashboardsCard extends Extension<ExtensionProperties.DashboardsCard> {
  type: 'Dashboards/Card';
}

export const isDashboardsCard = (e: Extension): e is DashboardsCard => e.type === 'Dashboards/Card';

export interface DashboardsOverviewUtilizationItem
  extends Extension<ExtensionProperties.DashboardsOverviewUtilizationItem> {
  type: 'Dashboards/Overview/Utilization/Item';
}

export const isDashboardsOverviewUtilizationItem = (
  e: Extension,
): e is DashboardsOverviewUtilizationItem => e.type === 'Dashboards/Overview/Utilization/Item';

export interface DashboardsOverviewInventoryItem
  extends Extension<ExtensionProperties.DashboardsOverviewInventoryItem> {
  type: 'Dashboards/Overview/Inventory/Item';
}

export const isDashboardsOverviewInventoryItem = (
  e: Extension,
): e is DashboardsOverviewInventoryItem => e.type === 'Dashboards/Overview/Inventory/Item';

export interface DashboardsInventoryItemGroup
  extends Extension<ExtensionProperties.DashboardsInventoryItemGroup> {
  type: 'Dashboards/Inventory/Item/Group';
}

export const isDashboardsInventoryItemGroup = (e: Extension): e is DashboardsInventoryItemGroup =>
  e.type === 'Dashboards/Inventory/Item/Group';

export interface DashboardsOverviewResourceActivity
  extends Extension<ExtensionProperties.DashboardsOverviewResourceActivity> {
  type: 'Dashboards/Overview/Activity/Resource';
}

export const isDashboardsOverviewResourceActivity = (
  e: Extension,
): e is DashboardsOverviewResourceActivity => e.type === 'Dashboards/Overview/Activity/Resource';

export interface DashboardsOverviewPrometheusActivity
  extends Extension<ExtensionProperties.DashboardsOverviewPrometheusActivity> {
  type: 'Dashboards/Overview/Activity/Prometheus';
}

export const isDashboardsOverviewPrometheusActivity = (
  e: Extension,
): e is DashboardsOverviewPrometheusActivity =>
  e.type === 'Dashboards/Overview/Activity/Prometheus';

export interface ProjectDashboardInventoryItem
  extends Extension<ExtensionProperties.ProjectDashboardInventoryItem> {
  type: 'Project/Dashboard/Inventory/Item';
}

export const isProjectDashboardInventoryItem = (e: Extension): e is ProjectDashboardInventoryItem =>
  e.type === 'Project/Dashboard/Inventory/Item';

export interface DashboardsOverviewInventoryItemReplacement
  extends Extension<ExtensionProperties.DashboardsOverviewInventoryItem> {
  type: 'Dashboards/Overview/Inventory/Item/Replacement';
}

export const isDashboardsOverviewInventoryItemReplacement = (
  e: Extension,
): e is DashboardsOverviewInventoryItemReplacement =>
  e.type === 'Dashboards/Overview/Inventory/Item/Replacement';

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

export type OperatorHealthHandler = (resources: FirehoseResourcesResult) => OperatorHealth;

export type OperatorHealth = {
  health: HealthState;
  count?: number;
};

export type GetOperatorsWithStatuses<R extends K8sResourceCommon = K8sResourceCommon> = (
  resources: FirehoseResourcesResult,
) => OperatorStatusWithResources<R>[];

export type OperatorStatusWithResources<R extends K8sResourceCommon = K8sResourceCommon> = {
  operators: R[];
  status: OperatorStatusPriority;
};

export type GetOperatorStatusPriority<R extends K8sResourceCommon = K8sResourceCommon> = (
  operator: R,
) => OperatorStatusPriority;

export type OperatorStatusPriority = {
  title: string;
  priority: number;
  icon: React.ReactNode;
  health: HealthState;
};

export type OperatorRowProps<R extends K8sResourceCommon = K8sResourceCommon> = {
  operatorStatus: OperatorStatusWithResources<R>;
};

import { TFunction } from 'i18next';
import { WatchK8sResources, ResourcesObject, WatchK8sResults } from '@console/dynamic-plugin-sdk';
import { PrometheusResponse } from '@console/internal/components/graphs';
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
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { Extension, LazyLoader } from './base';

namespace ExtensionProperties {
  interface DashboardsOverviewHealthSubsystem {
    /** The subsystem's display name */
    title: string;
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

  export interface DashboardsOverviewInventoryItem {
    /** The model for `resource` which will be fetched. The model is used for getting model's label or abbr. */
    model: K8sKind;

    /** Function which will map various statuses to groups. */
    mapper?: () => Promise<StatusGroupMapper>;

    /** Additional resources which will be fetched and passed to `mapper` function. */
    additionalResources?: WatchK8sResources<any>;

    /** Loader for the component which will be used when item is expanded. */
    expandedComponent?: LazyLoader<ExpandedComponentProps>;
  }

  export interface DashboardsInventoryItemGroup {
    /** The ID of status group. */
    id: string;

    /** React component representing status group icon. */
    icon: React.ReactElement;
  }

  export interface DashboardsOverviewUtilizationItem {
    /** The utilization item to be replaced */
    id: string;

    /** The Prometheus utilization query */
    query: string;

    /** The Prometheus total query */
    totalQuery: string;
  }

  export interface DashboardsOverviewResourceActivity {
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

  export interface DashboardsOverviewPrometheusActivity {
    /** Queries to watch */
    queries: string[];

    /** Function which will determine if given query results represent the action */
    isActivity: (results: PrometheusResponse[]) => boolean;

    /** Loader for corresponding action component */
    loader: LazyLoader<PrometheusActivityProps>;
  }

  export interface ProjectDashboardInventoryItem {
    /** The K8s model which will be scoped to project, fetched and passed to `mapper` function. */
    model: K8sKind;

    /** Additional resources which will be fetched and passed to `mapper` function. */
    additionalResources?: FirehoseResource[];

    /** Function which will map various statuses to groups. */
    mapper: StatusGroupMapper;
  }
}

export interface DashboardsOverviewHealthOperator<R extends K8sResourceCommon = K8sResourceCommon>
  extends Extension<ExtensionProperties.DashboardsOverviewHealthOperator<R>> {
  type: 'Dashboards/Overview/Health/Operator';
}

export const isDashboardsOverviewHealthOperator = (
  e: Extension,
): e is DashboardsOverviewHealthOperator => e.type === 'Dashboards/Overview/Health/Operator';

export type DashboardsOverviewHealthSubsystem = DashboardsOverviewHealthOperator;

export const isDashboardsOverviewHealthSubsystem = (
  e: Extension,
): e is DashboardsOverviewHealthSubsystem => isDashboardsOverviewHealthOperator(e);

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

export type ResourceHealthHandler<R extends ResourcesObject> = (
  resourcesResult: WatchK8sResults<R>,
  t?: TFunction,
) => SubsystemHealth;

export type OperatorHealthHandler = (resources: FirehoseResourcesResult) => OperatorHealth;

export type OperatorHealth = {
  health: keyof typeof HealthState;
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
  health: keyof typeof HealthState;
};

export type OperatorRowProps<R extends K8sResourceCommon = K8sResourceCommon> = {
  operatorStatus: OperatorStatusWithResources<R>;
};

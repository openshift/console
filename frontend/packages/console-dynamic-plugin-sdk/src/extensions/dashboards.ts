import { K8sKind } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef, ResolvedExtension } from '../types';
import {
  K8sResourceCommon,
  PrometheusResponse,
  ResourcesObject,
  StatusGroupMapper,
  WatchK8sResources,
  WatchK8sResults,
  FirehoseResource,
  FirehoseResult,
} from './console-types';
import {
  DashboardCardSpan,
  GetOperatorsWithStatuses,
  K8sActivityProps,
  OperatorRowProps,
  PrometheusActivityProps,
  PrometheusHealthHandler,
  PrometheusHealthPopupProps,
  ResourceHealthHandler,
  URLHealthHandler,
} from './dashboard-types';

/** Adds a new dashboard tab, placed after the Overview tab. */
export type DashboardsTab = ExtensionDeclaration<
  'console.dashboards/tab',
  {
    /** A unique tab identifier, used as tab link `href` and when adding cards to this tab. */
    id: string;
    /** NavSection to which the tab belongs to */
    navSection: 'home' | 'storage';
    /** The title of the tab. */
    title: string;
  }
>;

/** Adds a new dashboard card. */
export type DashboardsCard = ExtensionDeclaration<
  'console.dashboards/card',
  {
    /** The id of the dashboard tab to which the card will be added. */
    tab: string;
    /** The grid position of the card on the dashboard. */
    position: 'LEFT' | 'RIGHT' | 'MAIN';
    /** Dashboard card component. */
    component: CodeRef<React.ComponentType>;
    /** Card's vertical span in the column. Ignored for small screens, defaults to 12. */
    span?: DashboardCardSpan;
  }
>;

/** Adds a health subsystem to the status card of Overview dashboard where the source of status is Prometheus. */
export type DashboardsOverviewHealthPrometheusSubsystem = ExtensionDeclaration<
  'console.dashboards/overview/health/prometheus',
  {
    /** The display name of the subsystem. */
    title: string;
    /** The Prometheus queries */
    queries: string[];
    /** Resolve the subsystem's health. */
    healthHandler: CodeRef<PrometheusHealthHandler>;
    /** Additional resource which will be fetched and passed to `healthHandler`. */
    additionalResource?: CodeRef<FirehoseResource>;
    /** Loader for popup content. If defined, a health item will be represented as a link which opens popup with given content. */
    popupComponent?: CodeRef<React.ComponentType<PrometheusHealthPopupProps>>;
    /** The title of the popover. */
    popupTitle?: string;
    /** Cloud providers which for which the subsystem should be hidden. */
    disallowedProviders?: string[];
  }
>;

/** Adds a health subsystem to the status card of Overview dashboard where the source of status is a K8s REST API. */
export type DashboardsOverviewHealthURLSubsystem<
  T = any,
  R extends K8sResourceCommon | K8sResourceCommon[] = K8sResourceCommon | K8sResourceCommon[]
> = ExtensionDeclaration<
  'console.dashboards/overview/health/url',
  {
    /** The display name of the subsystem. */
    title: string;
    /** The URL to fetch data from. It will be prefixed with base k8s URL. */
    url: string;
    /** Resolve the subsystem's health. */
    healthHandler: CodeRef<URLHealthHandler<T>>;
    /** Additional resource which will be fetched and passed to `healthHandler`. */
    additionalResource?: CodeRef<FirehoseResource>;
    /** Loader for popup content. If defined, a health item will be represented as a link which opens popup with given content. */
    popupComponent?: CodeRef<
      React.ComponentType<{
        healthResult?: T;
        healthResultError?: any;
        k8sResult?: FirehoseResult<R>;
      }>
    >;
    /** The title of the popover. */
    popupTitle?: string;
  }
>;

/** Adds a health subsystem to the status card of Overview dashboard where the source of status is a K8s Resource. */
export type DashboardsOverviewHealthResourceSubsystem<
  T extends ResourcesObject = ResourcesObject
> = ExtensionDeclaration<
  'console.dashboards/overview/health/resource',
  {
    /** The display name of the subsystem. */
    title: string;
    /** Kubernetes resources which will be fetched and passed to `healthHandler`. */
    resources: CodeRef<WatchK8sResources<T>>;
    /** Resolve the subsystem's health. */
    healthHandler: CodeRef<ResourceHealthHandler<T>>;
    /** Loader for popup content. If defined, a health item will be represented as a link which opens popup with given content. */
    popupComponent?: CodeRef<WatchK8sResults<T>>;
    /** The title of the popover. */
    popupTitle?: string;
  }
>;

/** Adds a health subsystem to the status card of Overview dashboard where the source of status is a K8s REST API. */
export type DashboardsOverviewHealthOperator<
  T extends K8sResourceCommon = K8sResourceCommon
> = ExtensionDeclaration<
  'console.dashboards/overview/health/operator',
  {
    /** Title of operators section in the popup. */
    title: string;
    /** Kubernetes resources which will be fetched and passed to `healthHandler`. */
    resources: CodeRef<FirehoseResource[]>;
    /** Resolves status for the operators. */
    getOperatorsWithStatuses?: CodeRef<GetOperatorsWithStatuses<T>>;
    /** Loader for popup row component. */
    operatorRowLoader?: CodeRef<React.ComponentType<OperatorRowProps<T>>>;
    /** Links to all resources page. If not provided then a list page of the first resource from resources prop is used. */
    viewAllLink?: string;
  }
>;

/** Adds an inventory status group. */
export type DashboardsInventoryItemGroup = ExtensionDeclaration<
  'console.dashboards/overview/inventory/item/group',
  {
    /** The id of the status group. */
    id: string;
    /** React component representing the status group icon. */
    icon: CodeRef<React.ReactElement>;
  }
>;

/** Adds a resource tile to the overview utilization card. */
export type DashboardsOverviewUtilizationItem = ExtensionDeclaration<
  'console.dashboards/overview/utilization/item',
  {
    /** The utilization item to be replaced */
    id: string;
    /** The Prometheus utilization query */
    query: string;
    /** The Prometheus total query */
    totalQuery: string;
  }
>;

/** Adds a resource tile to the overview inventory card. */
export type DashboardsOverviewInventoryItem<
  T extends K8sKind = K8sKind,
  R extends { [key: string]: K8sResourceCommon[] } = { [key: string]: K8sResourceCommon[] }
> = ExtensionDeclaration<
  'console.dashboards/overview/inventory/item',
  DashboardsOverviewInventoryItemProperties<T, R> & {}
>;

/** Replaces an overview inventory card. */
export type DashboardsOverviewInventoryItemReplacement<
  T extends K8sKind = K8sKind,
  R extends { [key: string]: K8sResourceCommon[] } = { [key: string]: K8sResourceCommon[] }
> = ExtensionDeclaration<
  'console.dashboards/overview/inventory/item/replacement',
  DashboardsOverviewInventoryItemProperties<T, R> & {}
>;

/** Adds a resource tile to the project overview inventory card. */
export type ProjectDashboardInventoryItem<
  T extends K8sKind = K8sKind,
  R extends { [key: string]: K8sResourceCommon[] } = { [key: string]: K8sResourceCommon[] }
> = ExtensionDeclaration<
  'console.dashboards/project/overview/item',
  DashboardsOverviewInventoryItemProperties<T, R> & {}
>;

/** Adds an activity to the Activity Card of Overview Dashboard where the triggering of activity is based on watching a K8s resource. */
export type DashboardsOverviewResourceActivity<
  T extends K8sResourceCommon = K8sResourceCommon
> = ExtensionDeclaration<
  'console.dashboards/overview/activity/resource',
  {
    /** The utilization item to be replaced. */
    k8sResource: CodeRef<FirehoseResource & { isList: true }>;
    /** Function which determines if the given resource represents the action. If not defined, every resource represents activity. */
    isActivity?: CodeRef<(resource: T) => boolean>;
    /** Timestamp for the given action, which will be used for ordering. */
    getTimestamp?: CodeRef<(resource: T) => Date>;
    /** The action component. */
    component: CodeRef<React.ComponentType<K8sActivityProps<T>>>;
  }
>;

/** Adds an activity to the Activity Card of Prometheus Overview Dashboard where the triggering of activity is based on watching a K8s resource. */
export type DashboardsOverviewPrometheusActivity = ExtensionDeclaration<
  'console.dashboards/overview/prometheus/activity/resource',
  {
    /** Queries to watch */
    queries: string[];
    /** Function which determines if the given resource represents the action. If not defined, every resource represents activity. */
    isActivity?: CodeRef<(results: PrometheusResponse[]) => boolean>;
    /** The action component. */
    component: CodeRef<React.ComponentType<PrometheusActivityProps>>;
  }
>;

// Type guards

export const isDashboardsTab = (e: Extension): e is DashboardsTab =>
  e.type === 'console.dashboards/tab';

export const isDashboardsCard = (e: Extension): e is DashboardsCard =>
  e.type === 'console.dashboards/card';

export const isDashboardsOverviewHealthPrometheusSubsystem = (
  e: Extension,
): e is DashboardsOverviewHealthPrometheusSubsystem =>
  e.type === 'console.dashboards/overview/health/prometheus';

export const isResolvedDashboardsOverviewHealthPrometheusSubsystem = (
  e: Extension,
): e is ResolvedExtension<DashboardsOverviewHealthPrometheusSubsystem> =>
  e.type === 'console.dashboards/overview/health/prometheus';

export const isDashboardsOverviewHealthURLSubsystem = (
  e: Extension,
): e is DashboardsOverviewHealthURLSubsystem => e.type === 'console.dashboards/overview/health/url';

export const isResolvedDashboardsOverviewHealthURLSubsystem = (
  e: Extension,
): e is ResolvedExtension<DashboardsOverviewHealthURLSubsystem> =>
  e.type === 'console.dashboards/overview/health/url';

export const isDashboardsOverviewHealthResourceSubsystem = (
  e: Extension,
): e is DashboardsOverviewHealthResourceSubsystem =>
  e.type === 'console.dashboards/overview/health/resource';

export const isResolvedDashboardsOverviewHealthResourceSubsystem = (
  e: Extension,
): e is ResolvedExtension<DashboardsOverviewHealthResourceSubsystem> =>
  e.type === 'console.dashboards/overview/health/resource';

export const isDashboardsOverviewHealthOperator = (
  e: Extension,
): e is DashboardsOverviewHealthOperator =>
  e.type === 'console.dashboards/overview/health/operator';

export const isResolvedDashboardsOverviewHealthOperator = (
  e: Extension,
): e is ResolvedExtension<DashboardsOverviewHealthOperator> =>
  e.type === 'console.dashboards/overview/health/operator';

export const isDashboardsInventoryItemGroup = (e: Extension): e is DashboardsInventoryItemGroup =>
  e.type === 'console.dashboards/overview/inventory/item/group';

export const isDashboardsOverviewUtilizationItem = (
  e: Extension,
): e is DashboardsOverviewUtilizationItem =>
  e.type === 'console.dashboards/overview/utilization/item';

export const isDashboardsOverviewInventoryItem = (
  e: Extension,
): e is DashboardsOverviewInventoryItem => e.type === 'console.dashboards/overview/inventory/item';

export const isDashboardsOverviewInventoryItemReplacement = (
  e: Extension,
): e is DashboardsOverviewInventoryItemReplacement =>
  e.type === 'console.dashboards/overview/inventory/item/replacement';

export const isProjectDashboardInventoryItem = (e: Extension): e is ProjectDashboardInventoryItem =>
  e.type === 'console.dashboards/project/overview/item';

export const isDashboardsOverviewResourceActivity = (
  e: Extension,
): e is DashboardsOverviewResourceActivity =>
  e.type === 'console.dashboards/overview/activity/resource';

export const isDashboardsOverviewPrometheusActivity = (
  e: Extension,
): e is DashboardsOverviewPrometheusActivity =>
  e.type === 'console.dashboards/overview/prometheus/activity/resource';

export type DashboardsOverviewHealthSubsystem =
  | DashboardsOverviewHealthURLSubsystem
  | DashboardsOverviewHealthPrometheusSubsystem
  | DashboardsOverviewHealthResourceSubsystem
  | DashboardsOverviewHealthOperator;

export const isDashboardsOverviewHealthSubsystem = (
  e: Extension,
): e is DashboardsOverviewHealthSubsystem =>
  isDashboardsOverviewHealthURLSubsystem(e) ||
  isDashboardsOverviewHealthPrometheusSubsystem(e) ||
  isDashboardsOverviewHealthResourceSubsystem(e) ||
  isDashboardsOverviewHealthOperator(e);

type DashboardsOverviewInventoryItemProperties<
  T extends K8sKind = K8sKind,
  R extends { [key: string]: K8sResourceCommon[] } = { [key: string]: K8sResourceCommon[] }
> = {
  /** The model for `resource` which will be fetched. Used to get the model's `label` or `abbr`. */
  model: CodeRef<T>;
  /** Function which maps various statuses to groups. */
  mapper?: CodeRef<StatusGroupMapper<T, R>>;
  /** Additional resources which will be fetched and passed to the `mapper` function. */
  additionalResources?: CodeRef<WatchK8sResources<R>>;
};

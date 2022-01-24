import { ButtonProps } from '@patternfly/react-core';
import { TableGridBreakpoint, OnSelect, SortByDirection, ICell } from '@patternfly/react-table';
import { RouteComponentProps } from 'react-router';
import {
  ExtensionK8sGroupKindModel,
  K8sKind,
  PrometheusLabels,
  PrometheusValue,
  ResolvedExtension,
} from '../api/common-types';
import { Extension, ExtensionTypeGuard } from '../types';

export type OwnerReference = {
  name: string;
  kind: string;
  uid: string;
  apiVersion: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
};

export type ObjectReference = {
  kind?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  apiVersion?: string;
  resourceVersion?: string;
  fieldPath?: string;
};

export type ObjectMetadata = {
  annotations?: { [key: string]: string };
  clusterName?: string;
  creationTimestamp?: string;
  deletionGracePeriodSeconds?: number;
  deletionTimestamp?: string;
  finalizers?: string[];
  generateName?: string;
  generation?: number;
  labels?: { [key: string]: string };
  managedFields?: any[];
  name?: string;
  namespace?: string;
  ownerReferences?: OwnerReference[];
  resourceVersion?: string;
  uid?: string;
};

// Properties common to (almost) all Kubernetes resources.
export type K8sResourceCommon = {
  apiVersion?: string;
  kind?: string;
  metadata?: ObjectMetadata;
};

export type K8sVerb =
  | 'create'
  | 'get'
  | 'list'
  | 'update'
  | 'patch'
  | 'delete'
  | 'deletecollection'
  | 'watch';

export type AccessReviewResourceAttributes = {
  group?: string;
  resource?: string;
  subresource?: string;
  verb?: K8sVerb;
  name?: string;
  namespace?: string;
};

export enum Operator {
  Exists = 'Exists',
  DoesNotExist = 'DoesNotExist',
  In = 'In',
  NotIn = 'NotIn',
  Equals = 'Equals',
  NotEqual = 'NotEqual',
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
  NotEquals = 'NotEquals',
}

export type MatchExpression = {
  key: string;
  operator: Operator | string;
  values?: string[];
  value?: string;
};

export type MatchLabels = {
  [key: string]: string;
};

export type Selector = {
  matchLabels?: MatchLabels;
  matchExpressions?: MatchExpression[];
};

/**
 * GroupVersionKind unambiguously identifies a kind.
 * https://godoc.org/k8s.io/apimachinery/pkg/runtime/schema#GroupVersionKind
 * TODO: Change this to a regex-type if it ever becomes a thing (https://github.com/Microsoft/TypeScript/issues/6579)
 */
export type GroupVersionKind = string;

/**
 * The canonical, unique identifier for a Kubernetes resource type.
 * Maintains backwards-compatibility with references using the `kind` string field.
 */
export type K8sResourceKindReference = GroupVersionKind | string;

enum InventoryStatusGroup {
  WARN = 'WARN',
  ERROR = 'ERROR',
  PROGRESS = 'PROGRESS',
  NOT_MAPPED = 'NOT_MAPPED',
  UNKNOWN = 'UNKNOWN',
}

type StatusGroup = {
  [key in InventoryStatusGroup | string]: {
    filterType?: string;
    statusIDs: string[];
    count: number;
  };
};

export type StatusGroupMapper<
  T extends K8sResourceCommon = K8sResourceCommon,
  R extends { [key: string]: K8sResourceCommon[] } = { [key: string]: K8sResourceCommon[] }
> = (resources: T[], additionalResources?: R) => StatusGroup;

export enum HealthState {
  OK = 'OK',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  LOADING = 'LOADING',
  UNKNOWN = 'UNKNOWN',
  UPDATING = 'UPDATING',
  PROGRESS = 'PROGRESS',
  UPGRADABLE = 'UPGRADABLE',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

// Only covers range and instant vector responses for now.
export type PrometheusResult = {
  metric: PrometheusLabels;
  values?: PrometheusValue[];
  value?: PrometheusValue;
};

export type PrometheusData = {
  resultType: 'matrix' | 'vector' | 'scalar' | 'string';
  result: PrometheusResult[];
};

export type PrometheusResponse = {
  status: string;
  data: PrometheusData;
  errorType?: string;
  error?: string;
  warnings?: string[];
};

export type WatchK8sResource = {
  kind: K8sResourceKindReference;
  name?: string;
  namespace?: string;
  isList?: boolean;
  selector?: Selector;
  namespaced?: boolean;
  limit?: number;
  fieldSelector?: string;
  optional?: boolean;
  partialMetadata?: boolean;
};

export type ResourcesObject = { [key: string]: K8sResourceCommon | K8sResourceCommon[] };

export type WatchK8sResultsObject<R extends K8sResourceCommon | K8sResourceCommon[]> = {
  data: R;
  loaded: boolean;
  loadError: any;
};

export type WatchK8sResults<R extends ResourcesObject> = {
  [k in keyof R]: WatchK8sResultsObject<R[k]>;
};

export type WatchK8sResources<R extends ResourcesObject> = {
  [k in keyof R]: WatchK8sResource;
};

export type WatchK8sResourcesGeneric = {
  [key: string]: {
    model?: ExtensionK8sGroupKindModel;
    opts?: Partial<WatchK8sResource>;
  };
};

export type FirehoseResource = {
  kind: K8sResourceKindReference;
  name?: string;
  namespace?: string;
  isList?: boolean;
  selector?: Selector;
  prop: string;
  namespaced?: boolean;
  optional?: boolean;
  limit?: number;
  fieldSelector?: string;
};

export type FirehoseResult<
  R extends K8sResourceCommon | K8sResourceCommon[] = K8sResourceCommon[]
> = {
  loaded: boolean;
  loadError: string;
  optional?: boolean;
  data: R;
  kind?: string;
};

export type FirehoseResourcesResult = {
  [key: string]: FirehoseResult<K8sResourceCommon | K8sResourceCommon[]>;
};

export type WatchK8sResult<R extends K8sResourceCommon | K8sResourceCommon[]> = [R, boolean, any];

export type UseK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  initResource: WatchK8sResource | null,
) => WatchK8sResult<R>;

export type UseK8sWatchResources = <R extends ResourcesObject>(
  initResources: WatchK8sResources<R>,
) => WatchK8sResults<R>;

export type UseResolvedExtensions = <E extends Extension>(
  ...typeGuards: ExtensionTypeGuard<E>[]
) => [ResolvedExtension<E>[], boolean, any[]];

export type ConsoleFetch = (
  url: string,
  options?: RequestInit,
  timeout?: number,
) => Promise<Response>;

export type ConsoleFetchJSON<T = any> = {
  (url: string, method?: string, options?: RequestInit, timeout?: number): Promise<T>;
  delete(url: string, json?: any, options?: RequestInit, timeout?: number): Promise<T>;
  post(url: string, json: any, options?: RequestInit, timeout?: number): Promise<T>;
  put(url: string, json: any, options?: RequestInit, timeout?: number): Promise<T>;
  patch(url: string, json: any, options?: RequestInit, timeout?: number): Promise<T>;
};

export type ConsoleFetchText = (...args: Parameters<ConsoleFetch>) => Promise<string>;

/* Horizontal Nav Types */
export type NavPage = {
  href?: string;
  path?: string;
  name: string;
  component: React.ComponentType<RouteComponentProps>;
};

export type HorizontalNavProps = {
  resource?: K8sResourceCommon;
  pages: NavPage[];
};

export type TableColumn<D> = ICell & {
  title: string;
  id: string;
  additional?: boolean;
  sort?: ((data: D[], sortDirection: SortByDirection) => D[]) | string;
};

export type RowProps<D, R extends any = {}> = {
  obj: D;
  rowData: R;
  activeColumnIDs: Set<string>;
};

type VirtualizedTableProps<D, R extends any = {}> = {
  data: D[];
  unfilteredData: D[];
  loaded: boolean;
  loadError: any;
  columns: TableColumn<D>[];
  Row: React.ComponentType<RowProps<D, R>>;
  NoDataEmptyMsg?: React.ComponentType<{}>;
  EmptyMsg?: React.ComponentType<{}>;
  scrollNode?: () => HTMLElement;
  onSelect?: OnSelect;
  label?: string;
  'aria-label'?: string;
  gridBreakPoint?: TableGridBreakpoint;
  rowData?: R;
};

export type VirtualizedTableFC = <D, R extends any = {}>(
  props: VirtualizedTableProps<D, R>,
) => JSX.Element;

export type TableDataProps = {
  id: string;
  activeColumnIDs: Set<string>;
  className?: string;
};

export type UseActiveColumns = <D = any>({
  columns,
  showNamespaceOverride,
  columnManagementID,
}: {
  columns: TableColumn<D>[];
  showNamespaceOverride: boolean;
  columnManagementID: string;
}) => [TableColumn<D>[], boolean];

export type ListPageHeaderProps = {
  title: string;
  helpText?: React.ReactNode;
  badge?: React.ReactNode;
};

export type CreateWithPermissionsProps = {
  createAccessReview?: {
    groupVersionKind: GroupVersionKind;
    namespace?: string;
  };
};

export type ListPageCreateProps = CreateWithPermissionsProps & {
  groupVersionKind: GroupVersionKind;
};

export type ListPageCreateLinkProps = CreateWithPermissionsProps & {
  to: string;
};

export type ListPageCreateButtonProps = CreateWithPermissionsProps & ButtonProps;

export type ListPageCreateDropdownProps = CreateWithPermissionsProps & {
  items: {
    [key: string]: React.ReactNode;
  };
  onClick: (item: string) => void;
};

export type RowFilterItem = {
  id: string;
  title: string;
  hideIfEmpty?: string;
};

export type FilterValue = {
  selected?: string[];
  all?: string[];
};

type RowFilterBase<R> = {
  filterGroupName: string;
  type: string;
  items: RowFilterItem[];
  filter: (input: FilterValue, obj: R) => boolean;
  defaultSelected?: string[];
};

export type RowMatchFilter<R = any> = RowFilterBase<R> & {
  isMatch: (obj: R, id: string) => boolean;
};

export type RowReducerFilter<R = any> = RowFilterBase<R> & {
  reducer: (obj: R) => React.ReactText;
};

export type RowFilter<R = any> = RowMatchFilter<R> | RowReducerFilter<R>;

export type ColumnLayout = {
  id: string;
  columns: ManagedColumn[];
  selectedColumns: Set<string>;
  showNamespaceOverride?: boolean;
  type: string;
};

export type ManagedColumn = {
  id: string;
  title: string;
  additional?: boolean;
};

export type OnFilterChange = (type: string, value: FilterValue) => void;

export type ListPageFilterProps<D = any> = {
  data: D;
  loaded: boolean;
  rowFilters?: RowFilter[];
  nameFilterPlaceholder?: string;
  labelFilterPlaceholder?: string;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  columnLayout?: ColumnLayout;
  onFilterChange: OnFilterChange;
  hideColumnManagement?: boolean;
};

export type UseListPageFilter = <D, R>(
  data: D[],
  rowFilters?: RowFilter<R>[],
  staticFilters?: { [key: string]: FilterValue },
) => [D[], D[], OnFilterChange];

export type ResourceLinkProps = {
  kind: GroupVersionKind;
  className?: string;
  displayName?: string;
  inline?: boolean;
  linkTo?: boolean;
  name?: string;
  namespace?: string;
  hideIcon?: boolean;
  title?: string;
  dataTest?: string;
  onClick?: () => void;
};

export type UseK8sModel = (groupVersionKind?: GroupVersionKind) => [K8sKind, boolean];
export type UseK8sModels = () => [{ [key: string]: K8sKind }, boolean];

import * as React from 'react';
import { ButtonProps } from '@patternfly/react-core';
import { ICell, OnSelect, SortByDirection, TableGridBreakpoint } from '@patternfly/react-table';
import { LocationDescriptor } from 'history';
import MonacoEditor from 'react-monaco-editor/lib/editor';
import {
  ExtensionK8sGroupKindModel,
  K8sModel,
  MatchLabels,
  PrometheusEndpoint,
  PrometheusLabels,
  PrometheusValue,
  ResolvedExtension,
  Selector,
} from '../api/common-types';
import { Extension, ExtensionTypeGuard } from '../types';
import { CustomDataSource } from './dashboard-data-source';

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

export type K8sResourceKind = K8sResourceCommon & {
  spec?: {
    selector?: Selector | MatchLabels;
    [key: string]: any;
  };
  status?: { [key: string]: any };
  data?: { [key: string]: any };
};

export type K8sVerb =
  | 'create'
  | 'get'
  | 'list'
  | 'update'
  | 'patch'
  | 'delete'
  | 'deletecollection'
  | 'watch'
  | 'impersonate';

export type AccessReviewResourceAttributes = {
  group?: string;
  resource?: string;
  subresource?: string;
  verb?: K8sVerb;
  name?: string;
  namespace?: string;
};

/**
 * @deprecated Use K8sGroupVersionKind type instead. Support for type K8sResourceKindReference will be removed in a future release.
 * @see K8sGroupVersionKind
 * GroupVersionKind unambiguously identifies a kind.
 * https://godoc.org/k8s.io/apimachinery/pkg/runtime/schema#GroupVersionKind
 * TODO: Change this to a regex-type if it ever becomes a thing (https://github.com/Microsoft/TypeScript/issues/6579)
 */
export type GroupVersionKind = string;

/**
 * The canonical, unique identifier for a Kubernetes resource type.
 * Maintains backwards-compatibility with references using the `kind` string field.
 */
export type K8sResourceKindReference = string;

export type K8sGroupVersionKind = { group?: string; version: string; kind: string };

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

export type PrometheusPollProps = {
  /** Delay between polling requests */
  delay?: number;
  /** One of the well-defined Prometheus API endpoints */
  endpoint: PrometheusEndpoint;
  namespace?: string;
  /** Prometheus query, polling is skipped when empty or undefined */
  query?: string;
  /** A search parameter */
  timeout?: string;
  /** A vector-query search parameter */
  endTime?: number;
  /** A vector-query search parameter */
  samples?: number;
  /** A vector-query search parameter */
  timespan?: number;
  /** An object used to facilitate fetching from different data sources. */
  customDataSource?: CustomDataSource;
};

export type UsePrometheusPoll = (
  props: PrometheusPollProps,
) => [PrometheusResponse | undefined, boolean, unknown];

export type WatchK8sResource = {
  /** @deprecated Use groupVersionKind instead. The kind property will be removed in a future release. */
  kind?: K8sResourceKindReference;
  groupVersionKind?: K8sGroupVersionKind;
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
  component: React.ComponentType;
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

export type VirtualizedTableProps<D, R extends any = {}> = {
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
  mock?: boolean;
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
    groupVersionKind: K8sResourceKindReference | K8sGroupVersionKind;
    namespace?: string;
  };
};

export type ListPageCreateProps = CreateWithPermissionsProps & {
  groupVersionKind: K8sResourceKindReference | K8sGroupVersionKind;
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
  labelFilter?: string;
  labelPath?: string;
  nameFilterTitle?: string;
  nameFilterPlaceholder?: string;
  labelFilterPlaceholder?: string;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  columnLayout?: ColumnLayout;
  onFilterChange: OnFilterChange;
  hideColumnManagement?: boolean;
  nameFilter?: string;
};

export type UseListPageFilter = <D, R>(
  data: D[],
  rowFilters?: RowFilter<R>[],
  staticFilters?: { [key: string]: FilterValue },
) => [D[], D[], OnFilterChange];

export type ResourceLinkProps = {
  /** @deprecated Use groupVersionKind instead. The kind property will be removed in a future release. */
  kind?: K8sResourceKindReference;
  groupVersionKind?: K8sGroupVersionKind;
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
  truncate?: boolean;
  nameSuffix?: React.ReactNode;
  children?: React.ReactNode;
};

export type ResourceIconProps = {
  className?: string;
  /** @deprecated Use groupVersionKind instead. The kind property will be removed in a future release. */
  kind?: K8sResourceKindReference;
  groupVersionKind?: K8sGroupVersionKind;
};

export type UseK8sModel = (
  // Use K8sGroupVersionKind type instead of K8sResourceKindReference. Support for type K8sResourceKindReference will be removed in a future release.
  groupVersionKind?: K8sResourceKindReference | K8sGroupVersionKind,
) => [K8sModel, boolean];
export type UseK8sModels = () => [{ [key: string]: K8sModel }, boolean];

export type PerspectiveType = string;

export type UseActivePerspective = () => [
  PerspectiveType,
  React.Dispatch<React.SetStateAction<PerspectiveType>>,
];

export type QueryParams = {
  watch?: string;
  labelSelector?: string;
  fieldSelector?: string;
  resourceVersion?: string;
  [key: string]: string;
};

export type Patch = {
  op: string;
  path: string;
  value?: any;
};

export type Cause = {
  field: string;
  message: string;
  reason: string;
};

export type Status = {
  apiVersion: 'v1';
  kind: 'Status';
  details: {
    causes: Cause[];
    group: string;
    kind: string;
  };
  message: string;
  metadata: any;
  reason: string;
  status: string;
};

export type StatusComponentProps = {
  title?: string;
  iconOnly?: boolean;
  noTooltip?: boolean;
  className?: string;
  popoverTitle?: string;
};

export type OverviewProps = {
  className?: string;
  children: React.ReactNode;
};

export enum GridPosition {
  MAIN = 'MAIN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export type OverviewCardSpan = 4 | 6 | 12;

export type OverviewGridCard = {
  Card: React.ComponentType<any>;
  span?: OverviewCardSpan;
};

export type OverviewGridProps = {
  mainCards: OverviewGridCard[];
  leftCards?: OverviewGridCard[];
  rightCards?: OverviewGridCard[];
};

export type InventoryItemTitleProps = {
  children: React.ReactNode;
};

export type InventoryItemBodyProps = {
  error?: any;
};

export type InventoryItemStatusProps = {
  count: number;
  icon: React.ReactNode;
  linkTo?: string;
};

export type HumanizeResult = {
  string: string;
  value: number;
  unit: string;
};

export type Humanize = (
  value: string | number,
  initialUnit?: string,
  preferredUnit?: string,
) => HumanizeResult;

export enum LIMIT_STATE {
  'ERROR' = 'ERROR',
  'WARN' = 'WARN',
  'OK' = 'OK',
}

export type TopConsumerPopoverProps = {
  current: string;
  total?: string;
  available?: string;
  limit?: string;
  limitState?: LIMIT_STATE;
  requested?: string;
  requestedState?: LIMIT_STATE;
};

export type QueryWithDescription = {
  query: string;
  desc: string;
};

export type SelfSubjectAccessReviewKind = {
  apiVersion: string;
  kind: string;
  metadata?: ObjectMetadata;
  spec: {
    resourceAttributes?: AccessReviewResourceAttributes;
  };
  status?: {
    allowed: boolean;
    denied?: boolean;
    reason?: string;
    evaluationError?: string;
  };
};

// per https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#selfsubjectreview-v1-authentication-k8s-io
export type SelfSubjectReviewKind = {
  apiVersion: string;
  kind: string;
  metadata?: ObjectMetadata;
  status?: {
    userInfo?: UserInfo
  }
}

// per https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#userinfo-v1-authentication-k8s-io
export type UserInfo = {
  uid?: string;
  username?: string;
  group?: string[];
  extra?: { [key: string]: string[] };
}

export type CodeEditorProps = {
  value?: string;
  language?: string;
  options?: object;
  minHeight?: string | number;
  showShortcuts?: boolean;
  showMiniMap?: boolean;
  toolbarLinks?: React.ReactNodeArray;
  onChange?: (newValue, event) => void;
  onSave?: () => void;
};

export type CodeEditorRef = {
  editor?: MonacoEditor['editor'];
};

export type ResourceYAMLEditorProps = {
  initialResource: string | { [key: string]: any };
  header?: string;
  onSave?: (content: string) => void;
};

export type ResourceEventStreamProps = {
  resource: K8sResourceCommon;
};

export type TimestampProps = {
  timestamp: string | number | Date;
  simple?: boolean;
  omitSuffix?: boolean;
  className?: string;
};

export type NamespaceBarProps = {
  onNamespaceChange?: (namespace: string) => void;
  isDisabled?: boolean;
  children?: React.ReactNode;
};

export type ErrorBoundaryFallbackProps = {
  errorMessage: string;
  componentStack: string;
  stack: string;
  title: string;
};

export type FormatSeriesTitle = (labels: PrometheusLabels, i?: number) => string;

export type QueryBrowserProps = {
  customDataSource?: CustomDataSource;
  defaultSamples?: number;
  defaultTimespan?: number;
  disabledSeries?: PrometheusLabels[][];
  disableZoom?: boolean;
  filterLabels?: PrometheusLabels;
  fixedEndTime?: number;
  formatSeriesTitle?: FormatSeriesTitle;
  GraphLink?: React.ComponentType<{}>;
  hideControls?: boolean;
  isStack?: boolean;
  namespace?: string;
  onZoom?: (from: number, to: number) => void;
  pollInterval?: number;
  queries: string[];
  showLegend?: boolean;
  showStackedControl?: boolean;
  timespan?: number;
  units?: string;
};

export type StorageClass = K8sResourceCommon & {
  provisioner: string;
  parameters: object;
  reclaimPolicy?: string;
  volumeBindingMode?: string;
  allowVolumeExpansion?: boolean;
};

export type UseAnnotationsModal = (resource: K8sResourceCommon) => () => void;

export type UseDeleteModal = (
  resource: K8sResourceCommon,
  redirectTo?: LocationDescriptor,
  message?: JSX.Element,
  btnText?: React.ReactNode,
  deleteAllResources?: () => Promise<K8sResourceKind[]>,
) => () => void;

export type UseLabelsModal = (resource: K8sResourceCommon) => () => void;

export type UseValuesForNamespaceContext = () => {
  namespace: string;
  setNamespace: (ns: string) => void;
  loaded: boolean;
};

export type UseActiveNamespace = () => [string, (ns: string) => void];

export type TaintEffect = '' | 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';

export type Taint = {
  key: string;
  value: string;
  effect: TaintEffect;
};

export enum K8sResourceConditionStatus {
  True = 'True',
  False = 'False',
  Unknown = 'Unknown',
}

export type K8sResourceCondition = {
  type: string;
  status: keyof typeof K8sResourceConditionStatus;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
};

export type NodeCondition = {
  lastHeartbeatTime?: string;
} & K8sResourceCondition;

export type NodeKind = {
  spec: {
    taints?: Taint[];
    unschedulable?: boolean;
  };
  status?: {
    capacity?: {
      [key: string]: string;
    };
    conditions?: NodeCondition[];
    images?: {
      names: string[];
      sizeBytes?: number;
    }[];
    phase?: string;
    nodeInfo?: {
      operatingSystem: string;
    };
  };
} & K8sResourceCommon;

export type CertificateSigningRequestKind = {
  spec: {
    groups: string[];
    request: string;
    usages: string[];
    username: string;
    uid: string;
  };
  status?: {
    conditions: {
      type: string;
      [key: string]: string;
    }[];
  };
} & K8sResourceCommon;

export type NodeCertificateSigningRequestKind = CertificateSigningRequestKind & {
  metadata: K8sResourceCommon['metadata'] & { originalName: string };
};

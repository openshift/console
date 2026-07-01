import type {
  ComponentType,
  ReactNode,
  ReactText,
  ReactNodeArray,
  SetStateAction,
  Dispatch,
  ElementType,
} from 'react';
import type { K8sResourceCommon, ObjectMetadata } from '@openshift/api-types';
import type { QuickStartContextValues } from '@patternfly/quickstarts';
import type { CodeEditorProps as PfCodeEditorProps } from '@patternfly/react-code-editor';
import type { AlertVariant, ButtonProps } from '@patternfly/react-core';
import type {
  ICell,
  OnSelect,
  SortByDirection,
  TableGridBreakpoint,
} from '@patternfly/react-table';
import type { TFunction } from 'i18next';
import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type { To } from 'react-router';
import type {
  ExtensionK8sGroupKindModel,
  K8sModel,
  K8sVerb,
  MatchLabels,
  PrometheusEndpoint,
  PrometheusLabels,
  PrometheusValue,
  ResolvedExtension,
  Selector,
} from '../api/common-types';
import type { Extension, ExtensionTypeGuard } from '../types';
import type { CustomDataSource } from './dashboard-data-source';

/* eslint-disable no-barrel-files/no-barrel-files */
export type {
  ManagedFieldsEntry,
  OwnerReference,
  ObjectMetadata,
  K8sResourceCommon,
} from '@openshift/api-types';
/* eslint-enable no-barrel-files/no-barrel-files */

export type ObjectReference = {
  kind?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  apiVersion?: string;
  resourceVersion?: string;
  fieldPath?: string;
};

export type K8sResourceKind = K8sResourceCommon & {
  spec?: {
    selector?: Selector | MatchLabels;
    [key: string]: any;
  };
  status?: { [key: string]: any };
  data?: { [key: string]: any };
};

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

/**
 * WatchK8sResource with a `prop` field that serves as a key to identify
 * this resource in multi-resource watch results. Used by dashboard extensions
 * and legacy components that watch multiple K8s resources simultaneously.
 */
export type WatchK8sResourceWithProp = WatchK8sResource & {
  prop: string;
};

export type WatchK8sResult<R extends K8sResourceCommon | K8sResourceCommon[]> = [R, boolean, any];

/**
 * @deprecated Use WatchK8sResource with useK8sWatchResource hook instead.
 * FirehoseResource will be removed in a future release.
 * @see WatchK8sResource
 */
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

/**
 * @deprecated Use WatchK8sResultsObject instead. FirehoseResult will be removed in a future release.
 * @see WatchK8sResultsObject
 */
export type FirehoseResult<
  R extends K8sResourceCommon | K8sResourceCommon[] = K8sResourceCommon[]
> = {
  loaded: boolean;
  loadError: string;
  optional?: boolean;
  data: R;
  kind?: string;
};

/**
 * @deprecated Use WatchK8sResults instead. FirehoseResourcesResult will be removed in a future release.
 * @see WatchK8sResults
 */
export type FirehoseResourcesResult = {
  [key: string]: FirehoseResult<K8sResourceCommon | K8sResourceCommon[]>;
};

export type UseK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  initResource: WatchK8sResource | null,
) => WatchK8sResult<R>;

export type UseK8sWatchResources = <R extends ResourcesObject>(
  initResources: WatchK8sResources<R>,
) => WatchK8sResults<R>;

export type UseResolvedExtensions = <E extends Extension>(
  ...typeGuards: ExtensionTypeGuard<E>[]
) => [ResolvedExtension<E>[], boolean, any[]];

export type GetSegmentAnalytics = () => {
  // TODO: use proper Segment Analytics API type
  analytics: Record<string, (...args: any) => any>;
  analyticsEnabled: boolean;
};

/**
 * A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.
 * It also validates the response status code and throws an appropriate error or logs out the user if required.
 * @param url - The URL to fetch
 * @param options - The options to pass to fetch
 * @param timeout - The timeout in milliseconds
 * @returns A promise that resolves to the response.
 */
export type ConsoleFetch = (
  url: string,
  options?: RequestInit,
  timeout?: number,
) => Promise<Response>;

export type ConsoleFetchJSON<T = any> = {
  /**
   * A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.
   * It also validates the response status code and throws an appropriate error or logs out the user if required.
   * It returns the response as a JSON object.
   * Uses consoleFetch internally.
   * @param url The URL to fetch
   * @param method  The HTTP method to use. Defaults to GET
   * @param options The options to pass to fetch
   * @param timeout The timeout in milliseconds
   * @returns A promise that resolves to the response as text or JSON object.
   */
  (url: string, method?: string, options?: RequestInit, timeout?: number): Promise<T>;
  /**
   * A custom DELETE method of consoleFetchJSON.
   * It sends an optional JSON object as the body of the request and adds extra headers for patch request.
   * @param url The URL to delete the object
   * @param json The JSON to delete the object
   * @param options The options to pass to fetch
   * @param timeout The timeout in milliseconds
   */
  delete(url: string, json?: any, options?: RequestInit, timeout?: number): Promise<T>;
  /**
   * A custom POST method of consoleFetchJSON.
   * It sends the JSON object as the body of the request.
   * @param url The URL to post the object
   * @param json The JSON to POST the object
   * @param options The options to pass to fetch
   * @param timeout The timeout in milliseconds
   */
  post(url: string, json: any, options?: RequestInit, timeout?: number): Promise<T>;
  /**
   * A custom PUT method of consoleFetchJSON.
   * It sends the JSON object as the body of the request.
   * @param url The URL to put the object
   * @param json The JSON to PUT the object
   * @param options The options to pass to fetch
   * @param timeout The timeout in milliseconds
   */
  put(url: string, json: any, options?: RequestInit, timeout?: number): Promise<T>;
  /**
   * A custom PATCH method of consoleFetchJSON.
   * It sends the JSON object as the body of the request.
   * @param url The URL to patch the object
   * @param json The JSON to PATCH the object
   * @param options The options to pass to fetch
   * @param timeout The timeout in milliseconds
   */
  patch(url: string, json: any, options?: RequestInit, timeout?: number): Promise<T>;
};

/**
 * A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.
 * It also validates the response status code and throws an appropriate error or logs out the user if required.
 * It returns the response as a text.
 * Uses `consoleFetch` internally.
 * @param url The URL to fetch
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * @returns A promise that resolves to the response as text or JSON object.
 */
export type ConsoleFetchText<T = any> = (...args: Parameters<ConsoleFetch>) => Promise<T>;

/**
 * Headers that are added to all requests made by consoleFetch and consoleFetchJSON.
 *
 * These headers are used for impersonation and CSRF protection.
 */
export type ConsoleRequestHeaders = {
  'Impersonate-Group'?: string | string[];
  'Impersonate-User'?: string;
  'X-CSRFToken'?: string;
};

/**
 * A function that creates impersonation headers for API requests using current redux state.
 * @returns an object containing the appropriate impersonation requst headers, based on redux state
 */
export type GetConsoleRequestHeaders = () => ConsoleRequestHeaders;

/**
 * Normalizes console headers to be compatible with fetch API's HeadersInit.
 * Converts array values (like Impersonate-Group) to a format that fetch() accepts.
 * @param headers - Headers object that may contain array values
 * @returns Normalized headers object with only string values
 */
export type NormalizeConsoleHeaders = (
  headers: Record<string, string | string[] | undefined>,
) => Record<string, string>;

export type ConsoleTFunction = TFunction | ((key: string, options?: any) => string);

/* Horizontal Nav Types */
export type NavPage = {
  href?: string;
  path?: string;
  name: string;
  component: ComponentType;
};

export type HorizontalNavProps = {
  resource?: K8sResourceCommon;
  pages: NavPage[];
  customData?: object;
  contextId?: string;
};

export type TableColumn<D> = ICell & {
  title: string;
  id: string;
  additional?: boolean;
  sort?: ((data: D[], sortDirection: SortByDirection) => D[]) | string;
  resizableProps?: any;
};

export type RowProps<D, R extends any = {}> = {
  obj: D;
  rowData: R;
  activeColumnIDs: Set<string>;
  index: number;
  onSelect?: OnSelect;
};

export type OnRowsRendered = (params: any) => void;

export type VirtualizedTableProps<D, R extends any = {}> = {
  data: D[];
  unfilteredData: D[];
  loaded: boolean;
  loadError: any;
  columns: TableColumn<D>[];
  Row: ComponentType<RowProps<D, R>>;
  NoDataEmptyMsg?: ComponentType<{}>;
  EmptyMsg?: ComponentType<{}>;
  scrollNode?: () => HTMLElement;
  onSelect?: OnSelect;
  allRowsSelected?: boolean;
  canSelectAll?: boolean;
  label?: string;
  'aria-label'?: string;
  gridBreakPoint?: TableGridBreakpoint;
  rowData?: R;
  mock?: boolean;
  sortColumnIndex?: number;
  sortDirection?: SortByDirection;
  csvData?: string;
  onRowsRendered?: OnRowsRendered;
};

export type VirtualizedTableFC = <D, R extends any = {}>(
  props: VirtualizedTableProps<D, R>,
) => JSX.Element;

export type TableDataProps = {
  id: string;
  activeColumnIDs: Set<string>;
  className?: string;
  children?: ReactNode;
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
  /** A badge that is displayed next to the title of the heading */
  badge?: ReactNode;
  /** A primary action that is always rendered. */
  children?: ReactNode;
  /** An alert placed below the heading in the same PageSection. */
  helpAlert?: ReactNode;
  /** A subtitle placed below the title. */
  helpText?: ReactNode;
  /**
   * The "Add to favourites" button is shown by default while in the admin perspective.
   * This prop allows you to hide the button. It should be hidden when `ListPageHeader`
   * is not the primary page header to avoid having multiple favourites buttons.
   */
  hideFavoriteButton?: boolean;
  /** The heading title. If no title is set, only the `children`, `badge`, and `helpAlert` props will be rendered */
  title: string;
};

export type CreateWithPermissionsProps = {
  createAccessReview?: {
    groupVersionKind: K8sResourceKindReference | K8sGroupVersionKind;
    namespace?: string;
  };
  children?: ReactNode;
};

export type ListPageCreateProps = CreateWithPermissionsProps & {
  groupVersionKind: K8sResourceKindReference | K8sGroupVersionKind;
  children?: ReactNode;
};

export type ListPageCreateLinkProps = CreateWithPermissionsProps & {
  to: string;
  children?: ReactNode;
};

export type ListPageCreateButtonProps = CreateWithPermissionsProps & ButtonProps;

export type ListPageCreateDropdownProps = CreateWithPermissionsProps & {
  items: {
    [key: string]: ReactNode;
  };
  onClick: (item: string) => void;
  children?: ReactNode;
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
  reducer: (obj: R) => ReactText;
};

export type RowFilter<R = any> = RowMatchFilter<R> | RowReducerFilter<R>;

export type RowSearchFilter<R = any> = Omit<RowFilterBase<R>, 'items' | 'defaultSelected'> & {
  placeholder?: string;
};

export type AnyRowFilter<R = any> = RowFilter<R> | RowSearchFilter<R>;

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
  rowFilters?: RowFilter<D>[];
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
  rowSearchFilters?: RowSearchFilter<D>[];
};

export type UseListPageFilter = <D, R>(
  data: D[],
  rowFilters?: AnyRowFilter<R>[],
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
  nameSuffix?: ReactNode;
  children?: ReactNode;
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
  (perspective: string, next?: string) => void,
];

export type ToastOptions = {
  /** Optional ID identifying this toast. If not provided, one will be generated. */
  id?: string;
  /** The toast title. */
  title: string;
  /** The toast variant, one of: success, danger, warning, info, default */
  variant: AlertVariant;
  /** The toast content. */
  content: ReactNode;
  /** Optional actions to display in the toast. */
  actions?: {
    /** The action label. */
    label: string;
    /** The action callback. */
    callback: () => void;
    /** If `true`, executing this action will dismiss the toast. */
    dismiss?: boolean;
    /** Sets the base component to render. defaults to button */
    component?: ElementType<any> | ComponentType<any>;
    /** The data test id */
    dataTest?: string;
  }[];
  /** The data test id */
  dataTest?: string;
  /** If `true`, displays a close button. */
  dismissible?: boolean;
  /**
   * If set to true, the time out is 8000 milliseconds.
   * If a number is provided, alert will be dismissed after that amount of time in milliseconds.
   */
  timeout?: number | boolean;
  /** Callback when the toast is removed. */
  onRemove?: (id: string) => void;
  /** Callback to run when toast is dismissed with close button */
  onClose?: () => void;
  /** Optional group name for the notification drawer section. Omit to use the built-in default group (displayed as "Other Alerts"). Custom values are shown as-is and are not translated by Console. */
  drawerGroup?: string;
  /**
   * When `true`, the toast is excluded from the visible toast cap and overflow link.
   * Defaults to `true`.
   * When `persistInDrawer` is `true` and `skipOverflow` is not explicitly set, defaults to `false`.
   * Set `persistInDrawer: true` with `skipOverflow: true` for always-visible drawer-persisted toasts.
   */
  skipOverflow?: boolean;
  /**
   * When `true`, the toast is persisted in the notification drawer with read/unread state.
   * Defaults `skipOverflow` to `false` so drawer-persisted toasts participate in the overflow cap,
   * but an explicit `skipOverflow: true` is respected for always-visible toasts.
   * Defaults to `false`.
   */
  persistInDrawer?: boolean;
};

export type ToastContextValues = {
  /** Add a toast alert. Returns the toast ID. */
  addToast: (options: ToastOptions) => string;
  /** Remove a toast alert. */
  removeToast: (id: string) => void;
};

export type UseToast = () => ToastContextValues;

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
  children?: ReactNode;
};

export type OverviewProps = {
  className?: string;
  children?: ReactNode;
};

export enum GridPosition {
  MAIN = 'MAIN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export type OverviewCardSpan = 4 | 6 | 12;

export type OverviewGridCard = {
  Card: ComponentType<any>;
  span?: OverviewCardSpan;
};

export type OverviewGridProps = {
  mainCards: OverviewGridCard[];
  leftCards?: OverviewGridCard[];
  rightCards?: OverviewGridCard[];
};

export type InventoryItemProps = {
  children: ReactNode;
};

export type InventoryItemTitleProps = {
  children: ReactNode;
};

export type InventoryItemBodyProps = {
  error?: any;
  children?: ReactNode;
};

export type InventoryItemStatusProps = {
  count: number;
  icon: ReactNode;
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
    userInfo?: UserInfo;
  };
};

// per https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#userinfo-v1-authentication-k8s-io
export type UserInfo = {
  uid?: string;
  username?: string;
  groups?: string[];
  extra?: object;
};

export type CodeEditorToolbarProps = {
  /** Whether to show a toolbar with shortcuts on top of the editor. */
  showShortcuts?: boolean;
  /** Toolbar links section on the left side of the editor */
  toolbarLinks?: ReactNodeArray;
};

// Omit the ref as we have our own ref type, which is completely different
export type BasicCodeEditorProps = Partial<Omit<PfCodeEditorProps, 'ref'>>;

export type CodeEditorProps = Omit<BasicCodeEditorProps, 'code' | 'shortcutsPopoverProps'> &
  CodeEditorToolbarProps & {
    /** Additional props to override the default popover properties */
    shortcutsPopoverProps?: Partial<PfCodeEditorProps['shortcutsPopoverProps']>;
    /** Code displayed in code editor. */
    value?: string;
    /** Minimum editor height in valid CSS height values. */
    minHeight?: CSSStyleDeclaration['minHeight'];
    /** Callback that is run when CTRL / CMD + S is pressed */
    onSave?: () => void;
  };

export type CodeEditorRef = {
  editor: monaco.editor.IStandaloneCodeEditor;
  monaco: typeof monaco;
};

export type ResourceYAMLEditorProps = {
  initialResource: K8sResourceKind;
  header?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  create?: boolean;
  onChange?: (content: string) => void;
  hideHeader?: boolean;
};

export type ResourceEventStreamProps = {
  resource: K8sResourceCommon;
};

export type TimestampProps = {
  timestamp: string | undefined;
  simple?: boolean;
  omitSuffix?: boolean;
  className?: string;
};

export type NamespaceBarProps = {
  onNamespaceChange?: (namespace: string) => void;
  isDisabled?: boolean;
  children?: ReactNode;
};

export type ErrorBoundaryFallbackProps = {
  errorMessage: string;
  componentStack: string;
  stack: string;
  title: string;
  children?: ReactNode;
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
  GraphLink?: ComponentType<{}>;
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
  redirectTo?: To,
  message?: JSX.Element,
  btnText?: ReactNode,
  deleteAllResources?: () => Promise<K8sResourceKind[]>,
) => () => void;

export type UseLabelsModal = (resource: K8sResourceCommon) => () => void;

export type UseValuesForNamespaceContext = () => {
  namespace: string;
  setNamespace: (ns: string) => void;
  loaded: boolean;
};

export type UseActiveNamespace = () => [string, (ns: string) => void];

export type UseUserPreference = <T>(
  key: string,
  defaultValue?: T,
  sync?: boolean,
) => [T, Dispatch<SetStateAction<T>>, boolean];

export type UseQuickStartContext = () => QuickStartContextValues;

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

export type NodeAddress = {
  type: string;
  address: string;
};

export type NodeKind = {
  spec: {
    taints?: Taint[];
    unschedulable?: boolean;
    providerID?: string;
  };
  status?: {
    capacity?: {
      [key: string]: string;
    };
    allocatable?: {
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
      architecture: string;
    };
    addresses?: NodeAddress[];
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

export type MetricValuesByName = {
  [name: string]: number;
};

export type NamespaceMetrics = {
  cpu: MetricValuesByName;
  memory: MetricValuesByName;
};

export type OverviewItemAlerts = {
  [key: string]: {
    message: string;
    severity: string;
  };
};

export type PodReadiness = string;
export type PodPhase = string;

export enum AllPodStatus {
  Running = 'Running',
  NotReady = 'Not Ready',
  Warning = 'Warning',
  Empty = 'Empty',
  Failed = 'Failed',
  Pending = 'Pending',
  Succeeded = 'Succeeded',
  Terminating = 'Terminating',
  Unknown = 'Unknown',
  ScaledTo0 = 'Scaled to 0',
  Idle = 'Idle',
  AutoScaledTo0 = 'Autoscaled to 0',
  ScalingUp = 'Scaling Up',
  CrashLoopBackOff = 'CrashLoopBackOff',
}

export type ExtPodPhase =
  | AllPodStatus.Empty
  | AllPodStatus.Warning
  | AllPodStatus.Idle
  | AllPodStatus.NotReady
  | AllPodStatus.ScaledTo0
  | AllPodStatus.AutoScaledTo0
  | AllPodStatus.Terminating
  | AllPodStatus.ScalingUp;

export type ExtPodStatus = {
  phase: ExtPodPhase | PodPhase;
};

export type ExtPodKind = {
  status?: ExtPodStatus;
} & K8sResourceKind;

/** Describes `user.openshift.io~v1~User` */
export type UserKind = {
  fullName?: string;
  identities: string[];
} & K8sResourceCommon;

export type PodControllerOverviewItem = {
  alerts: OverviewItemAlerts;
  revision: number;
  obj: K8sResourceKind;
  phase?: string;
  pods: ExtPodKind[];
};

export interface PodRCData {
  current: PodControllerOverviewItem;
  previous: PodControllerOverviewItem;
  obj?: K8sResourceKind;
  isRollingOut: boolean;
  pods: ExtPodKind[];
}

export type DocumentTitleProps = {
  /** The title to display */
  children: string;
};

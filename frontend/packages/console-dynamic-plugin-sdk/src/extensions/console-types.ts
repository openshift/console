import type {
  ComponentType,
  ReactNode,
  ReactText,
  ReactNodeArray,
  SetStateAction,
  Dispatch,
} from 'react';
import type { QuickStartContextValues } from '@patternfly/quickstarts';
import type { CodeEditorProps as PfCodeEditorProps } from '@patternfly/react-code-editor';
import type { ButtonProps } from '@patternfly/react-core';
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

/**
 * ManagedFieldsEntry is a workflow-id, a FieldSet and the group version of the resource that the fieldset applies to.
 */
export interface ManagedFieldsEntry {
  /**
   * APIVersion defines the version of this resource that this field set applies to. The format is "group/version" just like the top-level APIVersion field. It is necessary to track the version of a field set because it cannot be automatically converted.
   */
  apiVersion?: string;
  /**
   * FieldsType is the discriminator for the different fields format and version. There is currently only one possible value: "FieldsV1"
   */
  fieldsType?: string;
  /**
   * FieldsV1 holds the first JSON version format as described in the "FieldsV1" type.
   */
  fieldsV1?: {};
  /**
   * Manager is an identifier of the workflow managing these fields.
   */
  manager?: string;
  /**
   * Operation is the type of operation which lead to this ManagedFieldsEntry being created. The only valid values for this field are 'Apply' and 'Update'.
   */
  operation?: string;
  /**
   * Subresource is the name of the subresource used to update that object, or empty string if the object was updated through the main resource. The value of this field is used to distinguish between managers, even if they share the same name. For example, a status update will be distinct from a regular update using the same manager name. Note that the APIVersion field is not related to the Subresource field and it always corresponds to the version of the main resource.
   */
  subresource?: string;
  /**
   * Time is the timestamp of when the ManagedFields entry was added. The timestamp will also be updated if a field is added, the manager changes any of the owned fields value or removes a field. The timestamp does not update when a field is removed from the entry because another manager took it over.
   */
  time?: string;
}

/**
 * OwnerReference contains enough information to let you identify an owning object. An owning object must be in the same namespace as the dependent, or be cluster-scoped, so there is no namespace field.
 */
export interface OwnerReference {
  /**
   * API version of the referent.
   */
  apiVersion: string;
  /**
   * If true, AND if the owner has the "foregroundDeletion" finalizer, then the owner cannot be deleted from the key-value store until this reference is removed. See https://kubernetes.io/docs/concepts/architecture/garbage-collection/#foreground-deletion for how the garbage collector interacts with this field and enforces the foreground deletion. Defaults to false. To set this field, a user needs "delete" permission of the owner, otherwise 422 (Unprocessable Entity) will be returned.
   */
  blockOwnerDeletion?: boolean;
  /**
   * If true, this reference points to the managing controller.
   */
  controller?: boolean;
  /**
   * Kind of the referent. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   */
  kind: string;
  /**
   * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names
   */
  name: string;
  /**
   * UID of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#uids
   */
  uid: string;
}

export type ObjectReference = {
  kind?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  apiVersion?: string;
  resourceVersion?: string;
  fieldPath?: string;
};

/**
 * ObjectMeta is metadata that all persisted resources must have, which includes all objects users must create.
 */
export interface ObjectMetadata {
  /**
   * Annotations is an unstructured key value map stored with a resource that may be set by external tools to store and retrieve arbitrary metadata. They are not queryable and should be preserved when modifying objects. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations
   */
  annotations?: { [k: string]: string };
  clusterName?: string;
  /**
   * CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.
   *
   * Populated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   */
  creationTimestamp?: string;
  /**
   * Number of seconds allowed for this object to gracefully terminate before it will be removed from the system. Only set when deletionTimestamp is also set. May only be shortened. Read-only.
   */
  deletionGracePeriodSeconds?: number;
  /**
   * DeletionTimestamp is RFC 3339 date and time at which this resource will be deleted. This field is set by the server when a graceful deletion is requested by the user, and is not directly settable by a client. The resource is expected to be deleted (no longer visible from resource lists, and not reachable by name) after the time in this field, once the finalizers list is empty. As long as the finalizers list contains items, deletion is blocked. Once the deletionTimestamp is set, this value may not be unset or be set further into the future, although it may be shortened or the resource may be deleted prior to this time. For example, a user may request that a pod is deleted in 30 seconds. The Kubelet will react by sending a graceful termination signal to the containers in the pod. After that 30 seconds, the Kubelet will send a hard termination signal (SIGKILL) to the container and after cleanup, remove the pod from the API. In the presence of network partitions, this object may still exist after this timestamp, until an administrator or automated process can determine the resource is fully terminated. If not set, graceful deletion of the object has not been requested.
   *
   * Populated by the system when a graceful deletion is requested. Read-only. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   */
  deletionTimestamp?: string;
  /**
   * Must be empty before the object is deleted from the registry. Each entry is an identifier for the responsible component that will remove the entry from the list. If the deletionTimestamp of the object is non-nil, entries in this list can only be removed. Finalizers may be processed and removed in any order.  Order is NOT enforced because it introduces significant risk of stuck finalizers. finalizers is a shared field, any actor with permission can reorder it. If the finalizer list is processed in order, then this can lead to a situation in which the component responsible for the first finalizer in the list is waiting for a signal (field value, external system, or other) produced by a component responsible for a finalizer later in the list, resulting in a deadlock. Without enforced ordering finalizers are free to order amongst themselves and are not vulnerable to ordering changes in the list.
   */
  finalizers?: string[];
  /**
   * GenerateName is an optional prefix, used by the server, to generate a unique name ONLY IF the Name field has not been provided. If this field is used, the name returned to the client will be different than the name passed. This value will also be combined with a unique suffix. The provided value has the same validation rules as the Name field, and may be truncated by the length of the suffix required to make the value unique on the server.
   *
   * If this field is specified and the generated name exists, the server will return a 409.
   *
   * Applied only if Name is not specified. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#idempotency
   */
  generateName?: string;
  /**
   * A sequence number representing a specific generation of the desired state. Populated by the system. Read-only.
   */
  generation?: number;
  /**
   * Map of string keys and values that can be used to organize and categorize (scope and select) objects. May match selectors of replication controllers and services. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels
   */
  labels?: { [k: string]: string };
  /**
   * ManagedFields maps workflow-id and version to the set of fields that are managed by that workflow. This is mostly for internal housekeeping, and users typically shouldn't need to set or understand this field. A workflow can be the user's name, a controller's name, or the name of a specific apply path like "ci-cd". The set of fields is always in the version that the workflow used when modifying the object.
   */
  managedFields?: ManagedFieldsEntry[];
  /**
   * Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names
   */
  name?: string;
  /**
   * Namespace defines the space within which each name must be unique. An empty namespace is equivalent to the "default" namespace, but "default" is the canonical representation. Not all objects are required to be scoped to a namespace - the value of this field for those objects will be empty.
   *
   * Must be a DNS_LABEL. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces
   */
  namespace?: string;
  /**
   * List of objects depended by this object. If ALL objects in the list have been deleted, this object will be garbage collected. If this object is managed by a controller, then an entry in this list will point to this controller, with the controller field set to true. There cannot be more than one managing controller.
   */
  ownerReferences?: OwnerReference[];
  /**
   * An opaque value that represents the internal version of this object that can be used by clients to determine when objects have changed. May be used for optimistic concurrency, change detection, and the watch operation on a resource or set of resources. Clients must treat these values as opaque and passed unmodified back to the server. They may only be valid for a particular resource or set of resources.
   *
   * Populated by the system. Read-only. Value must be treated as opaque by clients and . More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#concurrency-control-and-consistency
   */
  resourceVersion?: string;
  /**
   * Deprecated: selfLink is a legacy read-only field that is no longer populated by the system.
   *
   * @deprecated
   */
  selfLink?: string;
  /**
   * UID is the unique in time and space value for this object. It is typically generated by the server on successful creation of a resource and is not allowed to change on PUT operations.
   *
   * Populated by the system. Read-only. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#uids
   */
  uid?: string;
}

// Properties common to (almost) all Kubernetes resources.
/** Properties common to (almost) all Kubernetes resources. */
export interface K8sResourceCommon {
  /**
   * APIVersion defines the versioned schema of this representation of an object.
   * Servers should convert recognized schemas to the latest internal value, and
   * may reject unrecognized values.
   * More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
   */
  apiVersion?: string;
  /**
   * Kind is a string value representing the REST resource this object represents.
   * Servers may infer this from the endpoint the client submits requests to.
   * Cannot be updated.
   * In CamelCase.
   * More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   */
  kind?: string;
  /**
   * metadata is the standard object metadata.
   * More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   */
  metadata?: ObjectMetadata;
}

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

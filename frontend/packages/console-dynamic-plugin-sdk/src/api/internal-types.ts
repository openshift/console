import type { ReactNode, ComponentType, SetStateAction, Dispatch } from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import { Map as ImmutableMap } from 'immutable';
import {
  FirehoseResult,
  HealthState,
  K8sResourceCommon,
  LIMIT_STATE,
  PrometheusResponse,
  QueryParams,
  StatusGroupMapper,
  TopConsumerPopoverProps,
} from '../extensions/console-types';
import type { TableColumn, ColumnLayout, RowProps } from '../extensions/console-types';
import { Alert, K8sModel } from './common-types';

type WithClassNameProps<R = {}> = R & {
  className?: string;
};

export type ActivityItemProps = WithClassNameProps<{
  children?: ReactNode;
}>;

export type ActivityBodyProps = WithClassNameProps<{
  children: ReactNode;
}>;

export type AlertsBodyProps = WithClassNameProps<{
  error?: boolean;
  children?: ReactNode;
}>;

export type RecentEventsBodyProps = {
  events: FirehoseResult<EventKind[]>;
  filter?: (arg: EventKind) => boolean;
  moreLink?: string;
};

type OngoingActvityProps<T> = {
  resource: T;
};

export type OngoingActivityBodyProps = {
  resourceActivities?: (OngoingActvityProps<K8sResourceCommon> & {
    timestamp: Date;
    component?: ComponentType<Partial<OngoingActvityProps<K8sResourceCommon>>>;
  })[];
  prometheusActivities?: {
    results: PrometheusResponse[];
    loader?: () => Promise<ComponentType<{ results?: PrometheusResponse[] }>>;
    component?: ComponentType<{ results: PrometheusResponse[] }>;
  }[];
  loaded: boolean;
};

export type AlertItemProps = {
  alert: Alert;
  documentationLink?: string;
};

export type HealthItemProps = WithClassNameProps<{
  title: string;
  details?: string;
  state?: HealthState;
  popupTitle?: string;
  popupClassname?: string;
  popupBodyContent?: ReactNode | ((hide: () => void) => ReactNode);
  popupKeepOnOutsideClick?: boolean;
  noIcon?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}>;

export type ResourceInventoryItemProps = {
  resources: K8sResourceCommon[];
  additionalResources?: { [key: string]: [] };
  mapper?: StatusGroupMapper;
  kind: K8sModel;
  isLoading: boolean;
  namespace?: string;
  error: boolean;
  showLink?: boolean;
  TitleComponent?: ComponentType<{ children?: ReactNode }>;
  title?: string;
  titlePlural?: string;
  ExpandedComponent?: ComponentType<{}>;
  basePath?: string;
  dataTest?: string;
};

export type DetailItemProps = {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  error?: boolean;
  valueClassName?: string;
  errorMessage?: string;
};

export type UtilizationBodyProps = {
  children: ReactNode;
};

export enum ByteDataTypes {
  BinaryBytes = 'binaryBytes',
  BinaryBytesWithoutB = 'binaryBytesWithoutB',
  DecimalBytes = 'decimalBytes',
  DecimalBytesWithoutB = 'decimalBytesWithoutB',
}

export type UtilizationItemProps = {
  title: string;
  utilization?: PrometheusResponse;
  limit?: PrometheusResponse;
  requested?: PrometheusResponse;
  isLoading: boolean;
  // Todo(bipuladh): Make huamnize type Humanize once unit.js is converted
  humanizeValue: Function;
  query: string | string[];
  error: boolean;
  max?: number;
  byteDataType?: ByteDataTypes;
  TopConsumerPopover?: ComponentType<TopConsumerPopoverProps>;
  setLimitReqState?: (state: { limit: LIMIT_STATE; requested: LIMIT_STATE }) => void;
};

type EventInvolvedObject = {
  apiVersion?: string;
  kind?: string;
  name?: string;
  uid?: string;
  namespace?: string;
};

export type EventKind = {
  action?: string;
  count?: number;
  type?: string;
  involvedObject: EventInvolvedObject;
  message?: string;
  eventTime?: string;
  lastTimestamp?: string;
  firstTimestamp?: string;
  reason?: string;
  source: {
    component: string;
    host?: string;
  };
  series?: {
    count?: number;
    lastObservedTime?: string;
    state?: string;
  };
} & K8sResourceCommon;

export type UtilizationDurationDropdownProps = {
  adjustDuration?: (duration: number) => number;
};

type UtilizationDurationState = {
  duration: number;
  endDate: Date;
  selectedKey: string;
  startDate: Date;
  updateDuration: (duration: number) => void;
  updateEndDate: (endDate: Date) => void;
  updateSelectedKey: (key: string) => void;
};

export type UseUtilizationDuration = (
  adjustDuration?: (duration: number) => number,
) => UtilizationDurationState;

export type Options = {
  ns?: string;
  name?: string;
  path?: string;
  queryParams?: QueryParams;
  cluster?: string;
};

export type UseLastNamespace = () => [string, Dispatch<SetStateAction<string>>, boolean];

export type VirtualizedGridProps = {
  items: VirtualizedGridItem[] | VirtualizedGridGroupedItems;
  renderCell: VirtualizedGridRenderCell;
  /**
   * should be set when items are grouped/ `isItemGrouped` is set to true and each group has a heading
   */
  renderHeader?: VirtualizedGridRenderHeader;
  /**
   * Default value: false
   * should be set true when items are grouped
   */
  isItemsGrouped?: boolean;

  /** Grid styles */
  className?: string;

  /** Cell Measurements */
  cellWidth?: number;
  cellMargin?: number;
  celldefaultHeight?: number;
  estimatedCellHeight?: number;

  overscanRowCount?: number;
  headerHeight?: number;
};

export type VirtualizedGridItem = {
  [key: string]: any;
};

export type VirtualizedGridGroupedItems = {
  [key: string]: VirtualizedGridItem[];
};

export type VirtualizedGridRenderHeader = (heading: string) => ReactNode;

export type VirtualizedGridRenderCell = (item: VirtualizedGridItem) => ReactNode;

export type LazyActionMenuProps = {
  context: ActionContext;
  variant?: ActionMenuVariant;
  label?: string;
  isDisabled?: boolean;
};

export type ActionContext = {
  [contextId: string]: any;
};

export enum ActionMenuVariant {
  KEBAB = 'plain',
  DROPDOWN = 'default',
}

type Request<R> = {
  active: boolean;
  timeout: NodeJS.Timer;
  inFlight: boolean;
  data: R;
  error: any;
};

export type RequestMap<R> = ImmutableMap<string, Request<R>>;

export type Fetch = (url: string) => Promise<any>;
export type WatchURLProps = {
  url: string;
  fetch?: Fetch;
};

export type WatchPrometheusQueryProps = {
  query: string;
  namespace?: string;
  timespan?: number;
};

export type UseDashboardResources = ({
  prometheusQueries,
  urls,
  notificationAlertLabelSelectors,
}: {
  prometheusQueries?: WatchPrometheusQueryProps[];
  urls?: WatchURLProps[];
  notificationAlertLabelSelectors?: { [k: string]: string };
}) => {
  urlResults: RequestMap<any>;
  prometheusResults: RequestMap<PrometheusResponse>;
  notificationAlerts: {
    alerts: Alert[];
    loaded: boolean;
    loadError: Error;
  };
};

export type QuickStartsLoaderProps = {
  children: (quickStarts: QuickStart[], loaded: boolean) => ReactNode;
};

export type UseURLPoll = <R>(
  url: string,
  delay?: number,
  ...dependencies: any[]
) => [R, any, boolean];

export type ResourceFilters = {
  name: string;
  label: string;
};

export type ResourceMetadata = {
  name: string;
  labels?: { [key: string]: string };
};

export type ConsoleDataViewColumn<TData> = {
  id: string;
  title: string;
  sortFunction?: string | ((filteredData: TData[], sortDirection: 'asc' | 'desc') => TData[]);
};

export type ConsoleDataViewRow = any[];

export type GetDataViewRows<TData, TCustomRowData = any> = (
  data: RowProps<TData, TCustomRowData>[],
  columns: ConsoleDataViewColumn<TData>[],
) => ConsoleDataViewRow[];

export type ConsoleDataViewProps<
  TData,
  TCustomRowData = any,
  TFilters extends ResourceFilters = ResourceFilters
> = {
  label?: string;
  data: TData[];
  loaded: boolean;
  loadError?: unknown;
  columns: TableColumn<TData>[];
  columnLayout?: ColumnLayout;
  columnManagementID?: string;
  initialFilters?: TFilters;
  additionalFilterNodes?: ReactNode[];
  getObjectMetadata?: (obj: TData) => ResourceMetadata;
  matchesAdditionalFilters?: (obj: TData, filters: TFilters) => boolean;
  getDataViewRows: GetDataViewRows<TData, TCustomRowData>;
  customRowData?: TCustomRowData;
  showNamespaceOverride?: boolean;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
  mock?: boolean;
};

export type SwaggerDefinition = {
  definitions?: SwaggerDefinitions;
  description?: string;
  type?: string[] | string;
  enum?: string[];
  $ref?: string;
  items?: SwaggerDefinition;
  required?: string[];
  properties?: {
    [prop: string]: SwaggerDefinition;
  };
};

export type SwaggerDefinitions = {
  [name: string]: SwaggerDefinition;
};

export type DefinitionFor = (model: K8sModel) => SwaggerDefinition;

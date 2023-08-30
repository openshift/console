import * as React from 'react';
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
import { Alert, K8sModel } from './common-types';

type WithClassNameProps<R = {}> = R & {
  className?: string;
};

export type ActivityItemProps = WithClassNameProps;

export type ActivityBodyProps = WithClassNameProps<{
  children: React.ReactNode;
}>;

export type AlertsBodyProps = WithClassNameProps<{
  error?: boolean;
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
    loader?: () => Promise<React.ComponentType<Partial<OngoingActvityProps<K8sResourceCommon>>>>;
    component?: React.ComponentType<Partial<OngoingActvityProps<K8sResourceCommon>>>;
  })[];
  prometheusActivities?: {
    results: PrometheusResponse[];
    loader?: () => Promise<React.ComponentType<{ results?: PrometheusResponse[] }>>;
    component?: React.ComponentType<{ results: PrometheusResponse[] }>;
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
  popupBodyContent?: React.ReactNode | ((hide: () => void) => React.ReactNode);
  popupKeepOnOutsideClick?: boolean;
  noIcon?: boolean;
  icon?: React.ReactNode;
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
  TitleComponent?: React.ComponentType<{}>;
  title?: string;
  titlePlural?: string;
  ExpandedComponent?: React.ComponentType<{}>;
  basePath?: string;
  dataTest?: string;
};

export type DetailItemProps = {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: boolean;
  valueClassName?: string;
  errorMessage?: string;
};

export type DetailsBodyProps = {
  children?: React.ReactNode;
};

export type UtilizationBodyProps = {
  children: React.ReactNode;
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
  TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProps>;
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

export type UseLastNamespace = () => [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  boolean,
];

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

export type VirtualizedGridRenderHeader = (heading: string) => React.ReactNode;

export type VirtualizedGridRenderCell = (item: VirtualizedGridItem) => React.ReactNode;

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
  notificationAlerts: { alerts: Alert[]; loaded: boolean; loadError: Error };
};

export type UseUserSettings = <T>(
  key: string,
  defaultValue?: T,
  sync?: boolean,
) => [T, React.Dispatch<React.SetStateAction<T>>, boolean];

export type QuickStartsLoaderProps = {
  children: (quickStarts: QuickStart[], loaded: boolean) => React.ReactNode;
};

export type UseURLPoll = <R>(
  url: string,
  delay?: number,
  ...dependencies: any[]
) => [R, any, boolean];

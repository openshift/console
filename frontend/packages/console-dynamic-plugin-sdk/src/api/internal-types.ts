import { CardProps, CardBodyProps } from '@patternfly/react-core';
import {
  K8sResourceCommon,
  FirehoseResult,
  PrometheusResponse,
  HealthState,
  StatusGroupMapper,
} from '../extensions/console-types';
import { K8sKind, Alert } from './common-types';

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
};

export type HealthItemProps = WithClassNameProps<{
  title: string;
  details?: string;
  state?: HealthState;
  popupTitle?: string;
  noIcon?: boolean;
  icon?: React.ReactNode;
}>;

export type DashboardCardProps = CardProps & {
  className?: string;
  children: React.ReactNode;
  gradient?: boolean;
};

export type DashboardCardBodyProps = CardBodyProps & {
  classname?: string;
  children: React.ReactNode;
  isLoading?: boolean;
};

export type DashboardCardHeaderProps = WithClassNameProps<{
  children: React.ReactNode;
}>;

export type DashboardCardTitleProps = WithClassNameProps<{
  children?: React.ReactNode;
}>;

export type ResourceInventoryItemProps = {
  resources: K8sResourceCommon[];
  additionalResources?: { [key: string]: [] };
  mapper?: StatusGroupMapper;
  kind: K8sKind;
  isLoading: boolean;
  namespace?: string;
  error: boolean;
  showLink?: boolean;
  TitleComponent?: React.ComponentType<{}>;
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

type LIMIT_STATE = 'ERROR' | 'WARN' | 'OK';

export type TopConsumerPopoverProp = {
  current: string;
  max?: string;
  limit?: string;
  available?: string;
  requested?: string;
  total?: string;
  limitState?: LIMIT_STATE;
  requestedState?: string;
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
  TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProp>;
  setLimitReqState?: (state: { limit: LIMIT_STATE; requested: LIMIT_STATE }) => void;
};

type GridDashboarCard = {
  Card: React.ComponentType<any>;
  span?: 4 | 6 | 12;
};

export type DashboardGridProps = {
  mainCards: GridDashboarCard[];
  leftCards?: GridDashboarCard[];
  rightCards?: GridDashboarCard[];
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

export enum PrometheusEndpoint {
  LABEL = 'api/v1/label',
  RULES = 'api/v1/rules',
  QUERY = 'api/v1/query',
  QUERY_RANGE = 'api/v1/query_range',
}

type PrometheusPollProps = {
  delay?: number;
  endpoint: PrometheusEndpoint;
  endTime?: number;
  namespace?: string;
  query: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
};

export type UsePrometheusPoll = (props: PrometheusPollProps) => [PrometheusResponse, any, boolean];

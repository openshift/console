import {
  K8sResourceCommon,
  FirehoseResult,
  PrometheusResponse,
  HealthState,
  StatusGroupMapper,
  K8sKind,
  Alert,
} from '../internal-types/types';

export type UseDashboardPrometheusQuery<R = { string: string; value: number; unit: string }> = (
  query: string,
  parser?: () => R,
) => [R, any, number];

export type WithClassNameProps<R = K8sResourceCommon> = R & {
  className?: string;
};

export type RecentEventsBodyProps<R = K8sResourceCommon> = {
  events: FirehoseResult<R>;
  filter?: (arg: R) => boolean;
  moreLink?: string;
};

type OngoingActvityProps = {
  resource: K8sResourceCommon;
};

export type OngoingActivityBodyProps = {
  resourceActivities?: (OngoingActvityProps & {
    timestamp: Date;
    loader?: Promise<React.ComponentType<Partial<OngoingActvityProps>>>;
    component?: React.ComponentType<OngoingActvityProps>;
  })[];
  prometheusActivities?: {
    results: PrometheusResponse[];
    loader?: Promise<React.ComponentType<Partial<OngoingActvityProps>>>;
    component?: React.ComponentType<OngoingActvityProps>;
  }[];
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

export type DashboardCardProps = {
  className?: string;
  children: React.ReactNode;
  gradient?: boolean;
};

export type DashboardCardBodyProps = {
  className?: string;
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
  resources: [];
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
  timestamps: Date[];
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

export type UtilizationItemProps = {
  title: string;
  utilization?: PrometheusResponse;
  limit?: PrometheusResponse;
  requested?: PrometheusResponse;
  isLoading: boolean;
  humanizeValue: Function;
  query: string | string[];
  error: boolean;
  max?: number;
  byteDataType?: string;
  TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProp>;
  setLimitReqState?: (state: { limit: LIMIT_STATE; requested: LIMIT_STATE }) => void;
  setTimestamps?: (timestamps: Date[]) => void;
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

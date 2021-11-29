export const enum AlertStates {
  Firing = 'firing',
  NotFiring = 'not-firing',
  Pending = 'pending',
  Silenced = 'silenced',
}

export const enum SilenceStates {
  Active = 'active',
  Expired = 'expired',
  Pending = 'pending',
}

export const enum AlertSeverity {
  Critical = 'critical',
  Info = 'info',
  None = 'none',
  Warning = 'warning',
}

export const enum RuleStates {
  Firing = 'firing',
  Inactive = 'inactive',
  Pending = 'pending',
  Silenced = 'silenced',
}

export type Silence = {
  comment: string;
  createdBy: string;
  endsAt: string;
  firingAlerts: Alert[];
  id?: string;
  matchers: { name: string; value: string; isRegex: boolean }[];
  name?: string;
  startsAt: string;
  status?: { state: SilenceStates };
  updatedAt?: string;
};

export type PrometheusAlert = {
  activeAt?: string;
  annotations: PrometheusLabels;
  labels: PrometheusLabels & {
    alertname: string;
    severity?: AlertSeverity | string;
  };
  state: AlertStates;
  value?: number | string;
};

export type Alert = PrometheusAlert & {
  rule: Rule;
  silencedBy?: Silence[];
};

export type PrometheusRule = {
  alerts: PrometheusAlert[];
  annotations: PrometheusLabels;
  duration: number;
  labels: PrometheusLabels & {
    severity?: string;
  };
  name: string;
  query: string;
  state: RuleStates;
  type: string;
};

export type Rule = PrometheusRule & {
  id: string;
  silencedBy?: Silence[];
};

export type PrometheusLabels = { [key: string]: string };
export type PrometheusValue = [number, string];

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

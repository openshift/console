import { APIError } from '@console/shared';
import {
  Silence,
  AlertStates,
  PrometheusAlert,
  Alert,
  SilenceStates,
  AlertSeverity,
  RuleStates,
  PrometheusRule,
  PrometheusLabels,
  PrometheusValue,
  Rule,
} from '@console/dynamic-plugin-sdk';

import { RowFunctionArgs } from '../factory';
import { RowFilter } from '../filter-toolbar';

export {
  Silence,
  AlertStates,
  PrometheusAlert,
  Alert,
  SilenceStates,
  AlertSeverity,
  RuleStates,
  PrometheusRule,
  PrometheusLabels,
  PrometheusValue,
  Rule,
};

export const enum AlertSource {
  Platform = 'platform',
  User = 'user',
}

export type MonitoringResource = {
  abbr: string;
  kind: string;
  label: string;
  plural: string;
};

export type Silences = {
  data: Silence[];
  loaded: boolean;
  loadError?: string;
};

export type Alerts = {
  data: Alert[];
  loaded: boolean;
  loadError?: string;
};

export type Rules = {
  data: Rule[];
  loaded: boolean;
  loadError?: string;
};

type Group = {
  rules: PrometheusRule[];
  file: string;
  name: string;
};

export type PrometheusAPIError = {
  response?: {
    status: number;
  };
  json?: {
    error?: string;
  };
} & APIError;

export type PrometheusRulesResponse = {
  data: {
    groups: Group[];
  };
  status: string;
};

export type ListPageProps = {
  CreateButton?: React.ComponentType<{}>;
  data: Alert[] | Rule[] | Silence[];
  defaultSortField: string;
  Header: (...args) => any[];
  hideLabelFilter?: boolean;
  kindPlural: string;
  labelFilter?: string;
  labelPath?: string;
  loaded: boolean;
  loadError?: string;
  nameFilterID: string;
  reduxID: string;
  Row: React.FC<RowFunctionArgs>;
  rowFilters: RowFilter[];
  showTitle?: boolean;
};

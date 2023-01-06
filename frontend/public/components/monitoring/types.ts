import {
  Alert,
  PrometheusLabels,
  PrometheusRule,
  Rule,
  Silence,
} from '@console/dynamic-plugin-sdk';

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
  loadError?: string | Error;
};

export type Alerts = {
  data: Alert[];
  loaded: boolean;
  loadError?: string | Error;
};

export type Rules = {
  data: Rule[];
  loaded: boolean;
  loadError?: string | Error;
};

type Group = {
  rules: PrometheusRule[];
  file: string;
  name: string;
};

export type PrometheusAPIError = {
  json: {
    error?: string;
  };
  message?: string;
  response: {
    status: number;
  };
};

export type PrometheusRulesResponse = {
  data: {
    groups: Group[];
  };
  status: string;
};

export type Target = {
  discoveredLabels: PrometheusLabels;
  globalUrl: string;
  health: 'up' | 'down';
  labels: PrometheusLabels;
  lastError: string;
  lastScrape: string;
  lastScrapeDuration: number;
  scrapePool: string;
  scrapeUrl: string;
};

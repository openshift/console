import { ServiceType } from './capacity-breakdown';

export const BUCKET_CLASS = 'Bucket Class';

export enum Breakdown {
  ACCOUNTS = 'Accounts',
  PROVIDERS = 'Providers',
}

export enum Metrics {
  IOPS = 'I/O Operations',
  LOGICAL = 'Logial Used Capacity',
  EGRESS = 'Egress',
  PHY_VS_LOG = 'Physical Vs Logical Usage',
  LATENCY = 'Latency',
  BANDWIDTH = 'Bandwidth',
  TOTAL = 'TOTAL',
}

export const CHART_LABELS = {
  [Metrics.LOGICAL]: 'Logical used capacity per account',
  [Metrics.PHY_VS_LOG]: 'Physical vs. Logical used capacity',
  [Metrics.EGRESS]: 'Egress Per Provider',
  [Metrics.IOPS]: 'I/O Operations count',
  [Metrics.BANDWIDTH]: 'Bandwidth',
  [Metrics.LATENCY]: 'Latency',
};

export enum Groups {
  BREAKDOWN = 'Break By',
  METRIC = 'Metric',
  SERVICE = 'Service Type',
}

export namespace DataConsumption {
  export const defaultMetrics = {
    [ServiceType.RGW]: Metrics.BANDWIDTH,
    [ServiceType.MCG]: Metrics.IOPS,
  };
}

export const defaultBreakdown = {
  [ServiceType.MCG]: Breakdown.ACCOUNTS,
};

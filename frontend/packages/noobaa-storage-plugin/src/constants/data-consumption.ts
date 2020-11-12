import { TFunction } from 'i18next';
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

export const CHART_LABELS = (metric, t: TFunction) => {
  switch (metric) {
    case [Metrics.LOGICAL]:
      return t('noobaa-storage-plugin~Logical used capacity per account');
    case [Metrics.PHY_VS_LOG]:
      return t('noobaa-storage-plugin~Physical vs. Logical used capacity');
    case [Metrics.EGRESS]:
      return t('noobaa-storage-plugin~Egress Per Provider');
    case [Metrics.IOPS]:
      return t('noobaa-storage-plugin~I/O Operations count');
    case [Metrics.BANDWIDTH]:
      return t('noobaa-storage-plugin~Bandwidth');
    case [Metrics.LATENCY]:
      return t('noobaa-storage-plugin~Latency');
    default:
      return '';
  }
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

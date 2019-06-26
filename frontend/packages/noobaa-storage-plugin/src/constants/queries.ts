export enum ObjectServiceDashboardQuery {
  ACCOUNTS_BY_IOPS = 'ACCOUNTS_BY_IOPS',
  ACCOUNTS_BY_LOGICAL_USAGE = 'ACCOUNTS_BY_LOGICAL_USAGE',
  PROVIDERS_BY_IOPS = 'PROVIDERS_BY_IOPS',
  PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE = 'PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE',
  PROVIDERS_BY_EGRESS = 'PROVIDERS_BY_EGRESS',
}

export const DATA_CONSUMPTION_QUERIES = {
  [ObjectServiceDashboardQuery.ACCOUNTS_BY_IOPS]: 'NooBaa_accounts_io_usage',
  [ObjectServiceDashboardQuery.ACCOUNTS_BY_LOGICAL_USAGE]: 'NooBaa_accounts_io_usage',
  [ObjectServiceDashboardQuery.PROVIDERS_BY_IOPS]: 'NooBaa_providers_ops',
  [ObjectServiceDashboardQuery.PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE]:
    'NooBaa_providers_physical_logical',
  [ObjectServiceDashboardQuery.PROVIDERS_BY_EGRESS]: 'NooBaa_providers_bandwidth',
};

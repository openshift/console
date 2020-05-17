export enum ObjectServiceDashboardQuery {
  ACCOUNTS_BY_IOPS = 'ACCOUNTS_BY_IOPS',
  ACCOUNTS_BY_LOGICAL_USAGE = 'ACCOUNTS_BY_LOGICAL_USAGE',
  PROVIDERS_BY_IOPS = 'PROVIDERS_BY_IOPS',
  PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE = 'PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE',
  PROVIDERS_BY_EGRESS = 'PROVIDERS_BY_EGRESS',
}

export const DATA_CONSUMPTION_QUERIES: DataConsumptionQueriesType = {
  [ObjectServiceDashboardQuery.ACCOUNTS_BY_IOPS]: {
    read: 'topk(5,NooBaa_accounts_usage_read_count)',
    write: 'topk(5,NooBaa_accounts_usage_write_count)',
    totalRead: 'sum(topk(5,NooBaa_accounts_usage_read_count))',
    totalWrite: 'sum(topk(5,NooBaa_accounts_usage_write_count))',
  },
  [ObjectServiceDashboardQuery.ACCOUNTS_BY_LOGICAL_USAGE]: {
    logicalUsage: 'topk(5,NooBaa_accounts_usage_logical)',
    totalLogicalUsage: 'sum(topk(5,NooBaa_accounts_usage_logical))',
  },
  [ObjectServiceDashboardQuery.PROVIDERS_BY_IOPS]: {
    read: 'topk(5,NooBaa_providers_ops_read_num)',
    write: 'topk(5,NooBaa_providers_ops_write_num)',
    totalRead: 'sum(topk(5,NooBaa_providers_ops_read_num))',
    totalWrite: 'sum(topk(5,NooBaa_providers_ops_write_num))',
  },
  [ObjectServiceDashboardQuery.PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE]: {
    physicalUsage: 'topk(5,NooBaa_providers_physical_size)',
    logicalUsage: 'topk(5,NooBaa_providers_logical_size)',
    totalPhysicalUsage: 'sum(topk(5,NooBaa_providers_physical_size))',
    totalLogicalUsage: 'sum(topk(5,NooBaa_providers_logical_size))',
  },
  [ObjectServiceDashboardQuery.PROVIDERS_BY_EGRESS]: {
    egress: 'topk(5,NooBaa_providers_bandwidth_read_size + NooBaa_providers_bandwidth_write_size)',
  },
};

export type DataConsumptionQueriesType = {
  [key: string]: {
    [key: string]: string;
  };
};

export enum NoobaaQueries {
  ACCOUNTS_BY_IOPS = 'ACCOUNTS_BY_IOPS',
  ACCOUNTS_BY_LOGICAL_USAGE = 'ACCOUNTS_BY_LOGICAL_USAGE',
  PROVIDERS_BY_IOPS = 'PROVIDERS_BY_IOPS',
  PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE = 'PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE',
  PROVIDERS_BY_EGRESS = 'PROVIDERS_BY_EGRESS',
  CAPACITY_USAGE_PROJECT_QUERY = 'CAPACITY_USAGE_PROJECT_QUERY',
  CAPACITY_USAGE_BUCKET_CLASS_QUERY = 'CAPACITY_USAGE_BUCKET_CLASS_QUERY',
  BUCKETS_COUNT = 'BUCKETS_COUNT',
  UNHEALTHY_BUCKETS = 'UNHEALTHY_BUCKETS',
  NOOBAA_SYSTEM_NAME_QUERY = 'NOOBAA_SYSTEM_NAME_QUERY',
}

const commonQueries = {
  [NoobaaQueries.NOOBAA_SYSTEM_NAME_QUERY]: 'NooBaa_system_info',
  [NoobaaQueries.BUCKETS_COUNT]: 'NooBaa_num_buckets',
  [NoobaaQueries.UNHEALTHY_BUCKETS]: 'NooBaa_num_unhealthy_buckets',
  [NoobaaQueries.CAPACITY_USAGE_PROJECT_QUERY]: 'NooBaa_projects_capacity_usage',
  [NoobaaQueries.CAPACITY_USAGE_BUCKET_CLASS_QUERY]: 'NooBaa_bucket_class_capacity_usage',
};

export const DetailsCardQuery = {
  [NoobaaQueries.NOOBAA_SYSTEM_NAME_QUERY]: commonQueries[NoobaaQueries.NOOBAA_SYSTEM_NAME_QUERY],
};

export const ResourceProviderQueries = {
  PROVIDERS_TYPES: ' NooBaa_cloud_types',
  UNHEALTHY_PROVIDERS_TYPES: 'NooBaa_unhealthy_cloud_types',
  RESOURCES_LINK_QUERY: commonQueries[NoobaaQueries.NOOBAA_SYSTEM_NAME_QUERY],
};

export const BucketsCardQueries = {
  BUCKETS_LINK_QUERY: commonQueries[NoobaaQueries.NOOBAA_SYSTEM_NAME_QUERY],
  BUCKETS_COUNT: commonQueries[NoobaaQueries.BUCKETS_COUNT],
  UNHEALTHY_BUCKETS: commonQueries[NoobaaQueries.UNHEALTHY_BUCKETS],
  BUCKET_CLAIMS_COUNT: 'NooBaa_num_buckets_claims',
  UNHEALTHY_BUCKETS_CLAIMS: 'NooBaa_num_unhealthy_bucket_claims',
  BUCKET_OBJECTS_COUNT: 'NooBaa_num_objects',
  BUCKET_CLAIMS_OBJECTS_COUNT: 'NooBaa_num_objects_buckets_claims',
};

export const HealthCardQueries = {
  BUCKETS_COUNT: commonQueries[NoobaaQueries.BUCKETS_COUNT],
  UNHEALTHY_BUCKETS: commonQueries[NoobaaQueries.UNHEALTHY_BUCKETS],
  POOLS_COUNT: 'NooBaa_num_pools',
  UNHEALTHY_POOLS: 'NooBaa_num_unhealthy_pools',
};

export const DataConsumptionQueries: DataConsumptionQueriesType = {
  [NoobaaQueries.ACCOUNTS_BY_IOPS]: {
    read: 'topk(5,NooBaa_accounts_usage_read_count)',
    write: 'topk(5,NooBaa_accounts_usage_write_count)',
    totalRead: 'sum(NooBaa_accounts_usage_read_count)',
    totalWrite: 'sum(NooBaa_accounts_usage_write_count)',
  },
  [NoobaaQueries.ACCOUNTS_BY_LOGICAL_USAGE]: {
    logicalUsage: 'topk(5,NooBaa_accounts_usage_logical)',
    totalLogicalUsage: 'sum(NooBaa_accounts_usage_logical)',
  },
  [NoobaaQueries.PROVIDERS_BY_IOPS]: {
    read: 'topk(5,NooBaa_providers_ops_read_num)',
    write: 'topk(5,NooBaa_providers_ops_write_num)',
    totalRead: 'sum(NooBaa_providers_ops_read_num)',
    totalWrite: 'sum(NooBaa_providers_ops_write_num)',
  },
  [NoobaaQueries.PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE]: {
    physicalUsage: 'topk(5,NooBaa_providers_physical_size)',
    logicalUsage: 'topk(5,NooBaa_providers_logical_size)',
    totalPhysicalUsage: 'sum(NooBaa_providers_physical_size)',
    totalLogicalUsage: 'sum(NooBaa_providers_logical_size)',
  },
  [NoobaaQueries.PROVIDERS_BY_EGRESS]: {
    egress: 'topk(5,NooBaa_providers_bandwidth_read_size + NooBaa_providers_bandwidth_write_size)',
  },
};

export const UsageBreakdownQueries: ObjectCapacityQueryType = {
  [NoobaaQueries.CAPACITY_USAGE_PROJECT_QUERY]: [
    `sort(topk(6, ${
      commonQueries[NoobaaQueries.CAPACITY_USAGE_PROJECT_QUERY]
    }{project!='Others'})) or ${
      commonQueries[NoobaaQueries.CAPACITY_USAGE_PROJECT_QUERY]
    }{project='Others'}`,
    `sum(${commonQueries[NoobaaQueries.CAPACITY_USAGE_PROJECT_QUERY]})`,
  ],
  [NoobaaQueries.CAPACITY_USAGE_BUCKET_CLASS_QUERY]: [
    `sort(topk(6, ${
      commonQueries[NoobaaQueries.CAPACITY_USAGE_BUCKET_CLASS_QUERY]
    }{bucket_class!='Others'})) or ${
      commonQueries[NoobaaQueries.CAPACITY_USAGE_BUCKET_CLASS_QUERY]
    }{bucket_class='Others'}`,
    `sum(${commonQueries[NoobaaQueries.CAPACITY_USAGE_BUCKET_CLASS_QUERY]})`,
  ],
};

export enum DataResiliencQueries {
  REBUILD_PROGRESS_QUERY = 'NooBaa_rebuild_progress',
  REBUILD_TIME_QUERY = 'NooBaa_rebuild_time',
}

export enum ObjectDataReductionQueries {
  EFFICIENCY_QUERY = 'NooBaa_reduction_ratio',
  SAVINGS_QUERY = '(NooBaa_object_savings_logical_size - NooBaa_object_savings_physical_size) >= 0',
  LOGICAL_SAVINGS_QUERY = 'NooBaa_object_savings_logical_size',
}

type ObjectCapacityQueryType = {
  [queryType: string]: [string, string];
};

export type DataConsumptionQueriesType = {
  [key: string]: {
    [key: string]: string;
  };
};

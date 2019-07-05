export enum DATA_RESILIENCE_QUERIES {
  REBUILD_PROGRESS_QUERY = 'NooBaa_rebuild_progress',
  REBUILD_TIME_QUERY = 'NooBaa_rebuild_time',
}

export const ObjectDataReductionQueries = {
  EFFICIENCY_QUERY: 'NooBaa_reduction_ratio',
  SAVINGS_QUERY: 'NooBaa_savings',
};

export enum HealthCardQueries {
  BUCKETS_COUNT = 'NooBaa_num_buckets',
  UNHEALTHY_BUCKETS = 'NooBaa_num_unhealthy_buckets',
  POOLS_COUNT = 'Noobaa_num_pools',
  UNHEALTHY_POOLS = 'Noobaa_num_unhealthy_pools',
}

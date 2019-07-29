export enum DATA_RESILIENCE_QUERIES {
  REBUILD_PROGRESS_QUERY = 'NooBaa_rebuild_progress',
  REBUILD_TIME_QUERY = 'NooBaa_rebuild_time',
}

export enum ObjectDataReductionQueries {
  EFFICIENCY_QUERY = 'NooBaa_reduction_ratio',
  SAVINGS_QUERY = '(NooBaa_object_savings_logical_size - NooBaa_object_savings_physical_size) > 0',
  LOGICAL_SAVINGS_QUERY = 'NooBaa_object_savings_logical_size',
}

export enum HealthCardQueries {
  BUCKETS_COUNT = 'NooBaa_num_buckets',
  UNHEALTHY_BUCKETS = 'NooBaa_num_unhealthy_buckets',
  POOLS_COUNT = 'NooBaa_num_pools',
  UNHEALTHY_POOLS = 'NooBaa_num_unhealthy_pools',
}

export const ObjectCapacityQueries = {
  PROJECT_QUERY: 'NooBaa_projects_capacity_usage',
  BUCKET_CLASS_QUERY: 'NooBaa_bucket_class_capacity_usage',
};

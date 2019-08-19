export enum ObjectDashboardQuery {
  CAPACITY_USAGE_PROJECT_QUERY = 'CAPACITY_USAGE_PROJECT_QUERY',
  CAPACITY_USAGE_BUCKET_CLASS_QUERY = 'CAPACITY_USAGE_BUCKET_CLASS_QUERY',
}

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

const PROJECT_CAPACITY_USAGE_QUERY = 'NooBaa_projects_capacity_usage';
const BUCKET_CLASS_CAPACITY_USAGE_QUERY = 'NooBaa_bucket_class_capacity_usage';
type ObjectCapacityQueryType = {
  [queryType: string]: [string, string];
};
export const ObjectCapacityQueries: ObjectCapacityQueryType = {
  [ObjectDashboardQuery.CAPACITY_USAGE_PROJECT_QUERY]: [
    `sort(topk(6, ${PROJECT_CAPACITY_USAGE_QUERY}{project!='Others'})) or ${PROJECT_CAPACITY_USAGE_QUERY}{project='Others'}`,
    `sum(${PROJECT_CAPACITY_USAGE_QUERY})`,
  ],
  [ObjectDashboardQuery.CAPACITY_USAGE_BUCKET_CLASS_QUERY]: [
    `sort(topk(6, ${BUCKET_CLASS_CAPACITY_USAGE_QUERY}{bucket_class!='Others'})) or ${BUCKET_CLASS_CAPACITY_USAGE_QUERY}{bucket_class='Others'}`,
    `sum(${BUCKET_CLASS_CAPACITY_USAGE_QUERY})`,
  ],
};

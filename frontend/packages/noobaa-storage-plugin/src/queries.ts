import { ProjectModel } from '@console/internal/models';
import { PROJECTS, BUCKET_CLASS } from './constants';
import { NooBaaBucketClassModel } from './models';

export enum ObjectDashboardQuery {
  CAPACITY_USAGE_PROJECT_QUERY = 'CAPACITY_USAGE_PROJECT_QUERY',
  CAPACITY_USAGE_BUCKET_CLASS_QUERY = 'CAPACITY_USAGE_BUCKET_CLASS_QUERY',
  PROJECTS_TOTAL_USED = 'PROJECTS_TOTAL_USED',
  PROJECTS_BY_USED = 'PROJECTS_BY_USED',
  BUCKETS_TOTAL_USED = 'BUCKETS_TOTAL_USED',
  BUCKETS_BY_USED = 'BUCKETS_BY_USED',
  NOOBAA_USED = 'NOOBAA_USED',
  NOOBAA_TOTAL = 'NOOBAA_TOTAL',
  PROJECTS_OTHERS = 'PROJECTS_OTHERS',
  BUCKETS_BY_OTHERS = 'BUCKETS_BY_OTHERS',
  PROJECT_CAPACITY_USAGE_QUERY = 'PROJECT_CAPACITY_USAGE_QUERY',
  BUCKET_CLASS_CAPACITY_USAGE_QUERY = 'BUCKET_CLASS_CAPACITY_USAGE_QUERY',
  PROJECTS_QUERY = 'PROJECTS_QUERY',
  BUCKETS_QUERY = 'BUCKETS_QUERY',
}

export enum DATA_RESILIENCE_QUERIES {
  REBUILD_PROGRESS_QUERY = 'NooBaa_rebuild_progress/100',
  REBUILD_TIME_QUERY = 'NooBaa_rebuild_time',
}

export enum ObjectDataReductionQueries {
  EFFICIENCY_QUERY = 'NooBaa_reduction_ratio',
  SAVINGS_QUERY = '(NooBaa_object_savings_logical_size - NooBaa_object_savings_physical_size)',
  LOGICAL_SAVINGS_QUERY = 'NooBaa_object_savings_logical_size',
}

export enum StatusCardQueries {
  HEALTH_QUERY = 'NooBaa_health_status',
  REBUILD_PROGRESS_QUERY = 'NooBaa_rebuild_progress',
}

export const CAPACITY_BREAKDOWN_QUERIES = {
  [ObjectDashboardQuery.PROJECTS_BY_USED]: 'NooBaa_projects_capacity_usage',
  [ObjectDashboardQuery.BUCKETS_BY_USED]: 'NooBaa_bucket_class_capacity_usage',
};

export const breakdownQueryMap = {
  [PROJECTS]: {
    model: ProjectModel,
    metric: 'project',
    queries: {
      [ObjectDashboardQuery.PROJECTS_BY_USED]: `sort_desc(topk(5, ${
        CAPACITY_BREAKDOWN_QUERIES[ObjectDashboardQuery.PROJECTS_BY_USED]
      }))`,
      [ObjectDashboardQuery.PROJECTS_TOTAL_USED]: `sum(${
        CAPACITY_BREAKDOWN_QUERIES[ObjectDashboardQuery.PROJECTS_BY_USED]
      })`,
    },
  },
  [BUCKET_CLASS]: {
    model: NooBaaBucketClassModel,
    metric: 'bucket_class',
    queries: {
      [ObjectDashboardQuery.BUCKETS_BY_USED]: `sort_desc(topk(5, ${
        CAPACITY_BREAKDOWN_QUERIES[ObjectDashboardQuery.BUCKETS_BY_USED]
      }))`,
      [ObjectDashboardQuery.BUCKETS_TOTAL_USED]: `sum(${
        CAPACITY_BREAKDOWN_QUERIES[ObjectDashboardQuery.BUCKETS_BY_USED]
      })`,
    },
  },
};

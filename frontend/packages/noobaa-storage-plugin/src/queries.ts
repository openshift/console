import { ProjectModel } from '@console/internal/models';
import { PROJECTS, BUCKET_CLASS } from './constants';
import { NooBaaBucketClassModel } from './models';

export enum ObjectServiceDashboardQuery {
  ACCOUNTS_BY_IOPS = 'ACCOUNTS_BY_IOPS',
  ACCOUNTS_BY_LOGICAL_USAGE = 'ACCOUNTS_BY_LOGICAL_USAGE',
  BUCKETS_BY_OTHERS = 'BUCKETS_BY_OTHERS',
  BUCKETS_BY_USED = 'BUCKETS_BY_USED',
  BUCKETS_QUERY = 'BUCKETS_QUERY',
  BUCKETS_TOTAL_USED = 'BUCKETS_TOTAL_USED',
  BUCKET_CLASS_CAPACITY_USAGE_QUERY = 'BUCKET_CLASS_CAPACITY_USAGE_QUERY',
  CAPACITY_USAGE_BUCKET_CLASS_QUERY = 'CAPACITY_USAGE_BUCKET_CLASS_QUERY',
  CAPACITY_USAGE_PROJECT_QUERY = 'CAPACITY_USAGE_PROJECT_QUERY',
  NOOBAA_TOTAL = 'NOOBAA_TOTAL',
  NOOBAA_USED = 'NOOBAA_USED',
  PROJECTS_BY_USED = 'PROJECTS_BY_USED',
  PROJECTS_OTHERS = 'PROJECTS_OTHERS',
  PROJECTS_QUERY = 'PROJECTS_QUERY',
  PROJECTS_TOTAL_USED = 'PROJECTS_TOTAL_USED',
  PROJECT_CAPACITY_USAGE_QUERY = 'PROJECT_CAPACITY_USAGE_QUERY',
  PROVIDERS_BY_EGRESS = 'PROVIDERS_BY_EGRESS',
  PROVIDERS_BY_IOPS = 'PROVIDERS_BY_IOPS',
  PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE = 'PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE',
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
  [ObjectServiceDashboardQuery.PROJECTS_BY_USED]: 'NooBaa_projects_capacity_usage',
  [ObjectServiceDashboardQuery.BUCKETS_BY_USED]: 'NooBaa_bucket_class_capacity_usage',
};

export const breakdownQueryMap = {
  [PROJECTS]: {
    model: ProjectModel,
    metric: 'project',
    queries: {
      [ObjectServiceDashboardQuery.PROJECTS_BY_USED]: `sort_desc(topk(5, ${
        CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.PROJECTS_BY_USED]
      }))`,
      [ObjectServiceDashboardQuery.PROJECTS_TOTAL_USED]: `sum(${
        CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.PROJECTS_BY_USED]
      })`,
    },
  },
  [BUCKET_CLASS]: {
    model: NooBaaBucketClassModel,
    metric: 'bucket_class',
    queries: {
      [ObjectServiceDashboardQuery.BUCKETS_BY_USED]: `sort_desc(topk(5, ${
        CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.BUCKETS_BY_USED]
      }))`,
      [ObjectServiceDashboardQuery.BUCKETS_TOTAL_USED]: `sum(${
        CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.BUCKETS_BY_USED]
      })`,
    },
  },
};

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

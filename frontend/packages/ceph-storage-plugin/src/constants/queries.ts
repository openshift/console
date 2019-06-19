export enum StorageDashboardQuery {
  CEPH_STATUS_QUERY = 'CEPH_STATUS_QUERY',
  CEPH_PG_CLEAN_AND_ACTIVE_QUERY = 'CEPH_PG_CLEAN_AND_ACTIVE_QUERY',
  CEPH_PG_TOTAL_QUERY = 'CEPH_PG_TOTAL_QUERY',
}

export const STORAGE_HEALTH_QUERIES = {
  [StorageDashboardQuery.CEPH_STATUS_QUERY]: 'ceph_health_status',
};

export const DATA_RESILIENCY_QUERIES = {
  [StorageDashboardQuery.CEPH_PG_CLEAN_AND_ACTIVE_QUERY]: 'ceph_pg_clean and ceph_pg_active',
  [StorageDashboardQuery.CEPH_PG_TOTAL_QUERY]: 'ceph_pg_total',
};

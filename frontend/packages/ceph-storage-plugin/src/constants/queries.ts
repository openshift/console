import { ONE_HR, SIX_HR, TWENTY_FOUR_HR } from './index';

export enum StorageDashboardQuery {
  CEPH_STATUS_QUERY = 'CEPH_STATUS_QUERY',
  CEPH_PG_CLEAN_AND_ACTIVE_QUERY = 'CEPH_PG_CLEAN_AND_ACTIVE_QUERY',
  CEPH_PG_TOTAL_QUERY = 'CEPH_PG_TOTAL_QUERY',
  UTILIZATION_IOPS_QUERY = 'UTILIZATION_IOPS_QUERY',
  UTILIZATION_LATENCY_QUERY = 'UTILIZATION_LATENCY_QUERY',
  UTILIZATION_THROUGHPUT_QUERY = 'UTILIZATION_THROUGHPUT_QUERY',
  UTILIZATION_RECOVERY_RATE_QUERY = 'UTILIZATION_RECOVERY_RATE_QUERY',
  CEPH_CAPACITY_TOTAL = 'CAPACITY_TOTAL',
  CEPH_CAPACITY_USED = 'CAPACITY_USED',
  PODS_BY_REQUESTED = 'PODS_BY_REQUESTED',
  PODS_BY_USED = 'PODS_BY_USED',
  PROJECTS_BY_REQUESTED = 'PROJECTS_BY_REQUESTED',
  PROJECTS_BY_USED = 'PROJECTS_BY_USED',
  STORAGE_CLASSES_BY_REQUESTED = 'STORAGE_CLASSES_BY_REQUESTED',
  STORAGE_CLASSES_BY_USED = 'STORAGE_CLASSES_BY_USED',
  VMS_BY_REQUESTED = 'VMS_BY_REQUESTED',
  VMS_BY_USED = 'VMS_BY_USED',
}

export const STORAGE_HEALTH_QUERIES = {
  [StorageDashboardQuery.CEPH_STATUS_QUERY]: 'ceph_health_status',
};

export const DATA_RESILIENCY_QUERIES = {
  [StorageDashboardQuery.CEPH_PG_CLEAN_AND_ACTIVE_QUERY]: 'ceph_pg_clean and ceph_pg_active',
  [StorageDashboardQuery.CEPH_PG_TOTAL_QUERY]: 'ceph_pg_total',
};

export const UTILIZATION_QUERY = {
  [StorageDashboardQuery.UTILIZATION_IOPS_QUERY]:
    '(sum(rate(ceph_pool_wr[1m])) + sum(rate(ceph_pool_rd[1m])))',
  [StorageDashboardQuery.UTILIZATION_LATENCY_QUERY]:
    '(quantile(.95,(cluster:ceph_disk_latency:join_ceph_node_disk_irate1m)))',
  [StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY]:
    '(sum(rate(ceph_pool_wr_bytes[1m]) + rate(ceph_pool_rd_bytes[1m])))',
  [StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY]:
    '(sum(ceph_pool_recovering_bytes_per_sec))',
};

export const UTILIZATION_QUERY_HOUR_MAP = {
  [ONE_HR]: '[1h:10m]',
  [SIX_HR]: '[6h:1h]',
  [TWENTY_FOUR_HR]: '[24h:4h]',
};

export const CAPACITY_USAGE_QUERIES = {
  [StorageDashboardQuery.CEPH_CAPACITY_TOTAL]: 'ceph_cluster_total_bytes',
  [StorageDashboardQuery.CEPH_CAPACITY_USED]: 'ceph_cluster_total_used_bytes[60m:5m]',
};

export const TOP_CONSUMER_QUERIES = {
  [StorageDashboardQuery.PODS_BY_REQUESTED]:
    '(sort(topk(5, sum(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(pod) kube_pod_spec_volumes_persistentvolumeclaims_info) by (pod))))[10m:1m]',
  [StorageDashboardQuery.PODS_BY_USED]:
    '(sort(topk(5, sum(avg_over_time(kubelet_volume_stats_used_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(pod) kube_pod_spec_volumes_persistentvolumeclaims_info) by (pod))))[10m:1m]',
  [StorageDashboardQuery.PROJECTS_BY_REQUESTED]:
    '(sort(topk(5, sum(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass) kube_persistentvolumeclaim_info) by (namespace))))[10m:1m]',
  [StorageDashboardQuery.PROJECTS_BY_USED]:
    '(sort(topk(5, sum(avg_over_time(kubelet_volume_stats_used_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass) kube_persistentvolumeclaim_info) by (namespace))))[10m:1m]',
  [StorageDashboardQuery.STORAGE_CLASSES_BY_REQUESTED]:
    '(sort(topk(5, sum(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass) kube_persistentvolumeclaim_info) by (storageclass))))[10m:1m]',
  [StorageDashboardQuery.STORAGE_CLASSES_BY_USED]:
    '(sort(topk(5, sum(avg_over_time(kubelet_volume_stats_used_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass) kube_persistentvolumeclaim_info) by (storageclass))))[10m:1m]',
  [StorageDashboardQuery.VMS_BY_REQUESTED]:
    '(sort(topk(5, sum(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(pod) kube_pod_spec_volumes_persistentvolumeclaims_info{pod=~"virt-launcher-.*"}) by (pod))))[10m:1m]',
  [StorageDashboardQuery.VMS_BY_USED]:
    '(sort(topk(5, sum(max(avg_over_time(kubelet_volume_stats_used_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(pod) kube_pod_spec_volumes_persistentvolumeclaims_info{pod=~"virt-launcher-.*"}) by (pod,persistentvolumeclaim)) by (pod))))[10m:1m]',
};

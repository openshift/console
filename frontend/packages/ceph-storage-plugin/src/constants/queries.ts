import { ProjectModel, PodModel, StorageClassModel } from '@console/internal/models';
import { STORAGE_CLASSES, PROJECTS, PODS } from '.';

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
  PODS_TOTAL_USED = 'PODS_TOTAL_USED',
  PODS_BY_USED = 'PODS_BY_USED',
  PROJECTS_TOTAL_USED = 'PROJECTS_TOTAL_USED',
  PROJECTS_BY_USED = 'PROJECTS_BY_USED',
  STORAGE_CLASSES_TOTAL_USED = 'STORAGE_CLASSES_TOTAL_USED',
  STORAGE_CLASSES_BY_USED = 'STORAGE_CLASSES_BY_USED',
  STORAGE_CEPH_CAPACITY_REQUESTED_QUERY = 'STORAGE_CEPH_CAPACITY_REQUESTED_QUERY',
  STORAGE_CEPH_CAPACITY_USED_QUERY = 'STORAGE_CEPH_CAPACITY_USED_QUERY',
  RESILIENCY_PROGRESS = 'RESILIENCY_PROGRESS',
  NODES_BY_USED = 'NODES_BY_USED',
}

export const STORAGE_HEALTH_QUERIES = {
  [StorageDashboardQuery.CEPH_STATUS_QUERY]: 'ceph_health_status',
};

export const DATA_RESILIENCY_QUERY = {
  [StorageDashboardQuery.RESILIENCY_PROGRESS]: '(ceph_pg_clean and ceph_pg_active)/ceph_pg_total',
};

export const UTILIZATION_QUERY = {
  [StorageDashboardQuery.CEPH_CAPACITY_USED]: 'ceph_cluster_total_used_bytes',
  [StorageDashboardQuery.UTILIZATION_IOPS_QUERY]:
    '(sum(rate(ceph_pool_wr[1m])) + sum(rate(ceph_pool_rd[1m])))',
  [StorageDashboardQuery.UTILIZATION_LATENCY_QUERY]:
    '(quantile(.95,(cluster:ceph_disk_latency:join_ceph_node_disk_irate1m)))',
  [StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY]:
    '(sum(rate(ceph_pool_wr_bytes[1m]) + rate(ceph_pool_rd_bytes[1m])))',
  [StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY]:
    '(sum(ceph_pool_recovering_bytes_per_sec))',
};

export const TOTAL_QUERY = {
  [StorageDashboardQuery.CEPH_CAPACITY_TOTAL]: 'ceph_cluster_total_bytes',
};

export const CAPACITY_USAGE_QUERIES = {
  [StorageDashboardQuery.CEPH_CAPACITY_TOTAL]: 'ceph_cluster_total_bytes',
  [StorageDashboardQuery.CEPH_CAPACITY_USED]: 'ceph_cluster_total_used_bytes',
  [StorageDashboardQuery.STORAGE_CEPH_CAPACITY_REQUESTED_QUERY]:
    'sum((kube_persistentvolumeclaim_resource_requests_storage_bytes * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"}))',
  [StorageDashboardQuery.STORAGE_CEPH_CAPACITY_USED_QUERY]:
    'sum((kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"}))',
};

export const CAPACITY_BREAKDOWN_QUERIES = {
  [StorageDashboardQuery.PROJECTS_TOTAL_USED]:
    'sum(sum(kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (namespace))',
  [StorageDashboardQuery.PROJECTS_BY_USED]:
    'sum(kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (namespace)',
  [StorageDashboardQuery.STORAGE_CLASSES_TOTAL_USED]:
    'sum(sum(kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass) group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (storageclass, provisioner))',
  [StorageDashboardQuery.STORAGE_CLASSES_BY_USED]:
    'sum(kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass) group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (storageclass, provisioner)',
  [StorageDashboardQuery.PODS_TOTAL_USED]:
    'sum(sum((kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (pod,namespace))',
  [StorageDashboardQuery.PODS_BY_USED]:
    'sum((kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (pod,namespace)',
  [StorageDashboardQuery.CEPH_CAPACITY_TOTAL]: 'ceph_cluster_total_bytes',
  [StorageDashboardQuery.CEPH_CAPACITY_USED]: 'ceph_cluster_total_used_bytes',
};

export const breakdownQueryMap = {
  [PROJECTS]: {
    model: ProjectModel,
    metric: 'namespace',
    queries: {
      [StorageDashboardQuery.PROJECTS_BY_USED]: `(topk(6,(${
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.PROJECTS_BY_USED]
      })))`,
      [StorageDashboardQuery.PROJECTS_TOTAL_USED]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.PROJECTS_TOTAL_USED],
      [StorageDashboardQuery.CEPH_CAPACITY_TOTAL]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_TOTAL],
      [StorageDashboardQuery.CEPH_CAPACITY_USED]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_USED],
    },
  },
  [STORAGE_CLASSES]: {
    model: StorageClassModel,
    metric: 'storageclass',
    queries: {
      [StorageDashboardQuery.STORAGE_CLASSES_BY_USED]: `(topk(6,(${
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.STORAGE_CLASSES_BY_USED]
      })))`,
      [StorageDashboardQuery.STORAGE_CLASSES_TOTAL_USED]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.STORAGE_CLASSES_TOTAL_USED],
      [StorageDashboardQuery.CEPH_CAPACITY_TOTAL]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_TOTAL],
      [StorageDashboardQuery.CEPH_CAPACITY_USED]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_USED],
    },
  },
  [PODS]: {
    model: PodModel,
    metric: 'pod',
    queries: {
      [StorageDashboardQuery.PODS_BY_USED]: `(topk(6,(${
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.PODS_BY_USED]
      })))`,
      [StorageDashboardQuery.PODS_TOTAL_USED]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.PODS_TOTAL_USED],
      [StorageDashboardQuery.CEPH_CAPACITY_TOTAL]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_TOTAL],
      [StorageDashboardQuery.CEPH_CAPACITY_USED]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_USED],
    },
  },
};

export const utilizationPopoverQueryMap = [
  {
    model: ProjectModel,
    metric: 'namespace',
    query: `(sort_desc(topk(25,(${
      CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.PROJECTS_BY_USED]
    }))))`,
  },
  {
    model: StorageClassModel,
    metric: 'storageclass',
    query: `(sort_desc(topk(25,(${
      CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.STORAGE_CLASSES_BY_USED]
    }))))`,
  },
  {
    model: PodModel,
    metric: 'pod',
    query: `(sort_desc(topk(25, (${
      CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.PODS_BY_USED]
    }))))`,
  },
];

export const getPVCUsedCapacityQuery = (pvcName: string): string =>
  `kubelet_volume_stats_used_bytes{persistentvolumeclaim='${pvcName}'}`;

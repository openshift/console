import * as _ from 'lodash';
import { ProjectModel, PodModel, StorageClassModel } from '@console/internal/models';
import { STORAGE_CLASSES, PROJECTS, PODS } from '../constants';

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
  USED_CAPACITY = 'USED_CAPACITY',
  REQUESTED_CAPACITY = 'REQUESTED_CAPACITY',
  CEPH_CAPACITY_AVAILABLE = 'CEPH_CAPACITY_AVAILABLE',
  // Pool Info
  POOL_CAPACITY_RATIO = 'POOL_CAPACITY_RATIO',
  POOL_SAVED_CAPACITY = 'POOL_SAVED_CAPACITY',
  POOL_RAW_CAPACITY_USED = 'POOL_RAW_CAPACITY_USED',
  POOL_MAX_CAPACITY_AVAILABLE = 'POOL_MAX_CAPACITY_AVAILABLE',
  POOL_UTILIZATION_IOPS_QUERY = 'POOL_UTILIZATION_IOPS_QUERY',
  POOL_UTILIZATION_THROUGHPUT_QUERY = 'POOL_UTILIZATION_THROUGHPUT_QUERY',
  // Capacity Info Card
  RAW_CAPACITY_TOTAL = 'RAW_TOTAL_CAPACITY',
  RAW_CAPACITY_USED = 'RAW_CAPACITY_USED',
}

export const INDEPENDENT_UTILIZATION_QUERIES = {
  [StorageDashboardQuery.REQUESTED_CAPACITY]:
    'sum((kube_persistentvolumeclaim_resource_requests_storage_bytes * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"}))',
  [StorageDashboardQuery.USED_CAPACITY]:
    'sum((kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"}))',
};

export const STORAGE_HEALTH_QUERIES = {
  [StorageDashboardQuery.CEPH_STATUS_QUERY]: 'ceph_health_status',
};

export const DATA_RESILIENCY_QUERY = {
  [StorageDashboardQuery.RESILIENCY_PROGRESS]: '(ceph_pg_clean and ceph_pg_active)/ceph_pg_total',
};

export const UTILIZATION_QUERY = {
  [StorageDashboardQuery.CEPH_CAPACITY_USED]:
    'sum(kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)"}))',
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

export const CAPACITY_INFO_QUERIES = {
  [StorageDashboardQuery.RAW_CAPACITY_TOTAL]: 'ceph_cluster_total_bytes',
  [StorageDashboardQuery.RAW_CAPACITY_USED]: 'ceph_cluster_total_used_raw_bytes',
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
    'sum (((max by(namespace,persistentvolumeclaim) (kubelet_volume_stats_used_bytes)) * on (namespace,persistentvolumeclaim) group_right() ((kube_running_pod_ready*0+1) * on(namespace, pod)  group_right() kube_pod_spec_volumes_persistentvolumeclaims_info)) * on(namespace,persistentvolumeclaim) group_left(provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"}))',
  [StorageDashboardQuery.PODS_BY_USED]:
    'sum by(namespace,pod) (((max by(namespace,persistentvolumeclaim) (kubelet_volume_stats_used_bytes)) * on (namespace,persistentvolumeclaim) group_right() ((kube_running_pod_ready*0+1) * on(namespace, pod)  group_right() kube_pod_spec_volumes_persistentvolumeclaims_info)) * on(namespace,persistentvolumeclaim) group_left(provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"}))',
  [StorageDashboardQuery.CEPH_CAPACITY_TOTAL]: 'ceph_cluster_total_bytes',
  [StorageDashboardQuery.CEPH_CAPACITY_USED]:
    'sum(kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)"}))',
  [StorageDashboardQuery.CEPH_CAPACITY_AVAILABLE]:
    'max(ceph_pool_max_avail * on (pool_id) group_left(name)ceph_pool_metadata{name=~"(.*file.*)|(.*block.*)"})',
};

export const POOL_STORAGE_EFFICIENCY_QUERIES = {
  [StorageDashboardQuery.POOL_CAPACITY_RATIO]:
    'sum(ceph_bluestore_bluestore_compressed_original) / clamp_min(sum(ceph_bluestore_bluestore_compressed_allocated),1)',
  [StorageDashboardQuery.POOL_SAVED_CAPACITY]:
    '(sum(ceph_bluestore_bluestore_compressed_original) - sum(ceph_bluestore_bluestore_compressed_allocated))',
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
      [StorageDashboardQuery.CEPH_CAPACITY_USED]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_USED],
    },
  },
};

export const breakdownIndependentQueryMap = {
  [PROJECTS]: {
    model: ProjectModel,
    metric: 'namespace',
    queries: {
      [StorageDashboardQuery.PROJECTS_BY_USED]: `(topk(6,(${
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.PROJECTS_BY_USED]
      })))`,
      [StorageDashboardQuery.PROJECTS_TOTAL_USED]:
        CAPACITY_BREAKDOWN_QUERIES[StorageDashboardQuery.PROJECTS_TOTAL_USED],
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

export const osdDiskInfoMetric = _.template(
  `ceph_disk_occupation{exported_instance=~'<%= nodeName %>'}`,
);

export const getPoolQuery = (poolNames: string[], queryName: StorageDashboardQuery) => {
  const names = poolNames.join('|');
  const queries = {
    [StorageDashboardQuery.POOL_RAW_CAPACITY_USED]: `ceph_pool_bytes_used * on (pool_id) group_left(name)ceph_pool_metadata{name=~'${names}'}`,
    [StorageDashboardQuery.POOL_MAX_CAPACITY_AVAILABLE]: `ceph_pool_max_avail * on (pool_id) group_left(name)ceph_pool_metadata{name=~'${names}'}`,
    [StorageDashboardQuery.POOL_UTILIZATION_IOPS_QUERY]: `(rate(ceph_pool_wr[1m]) + rate(ceph_pool_rd[1m])) * on (pool_id) group_left(name)ceph_pool_metadata{name=~'${names}'}`,
    [StorageDashboardQuery.POOL_UTILIZATION_THROUGHPUT_QUERY]: `(rate(ceph_pool_wr_bytes[1m]) + rate(ceph_pool_rd_bytes[1m])) * on (pool_id) group_left(name)ceph_pool_metadata{name=~'${names}'}`,
  };
  return queries[queryName];
};

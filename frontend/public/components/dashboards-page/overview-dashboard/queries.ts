export enum OverviewQuery {
  MEMORY_TOTAL = 'MEMORY_TOTAL',
  MEMORY_UTILIZATION = 'MEMORY_UTILIZATION',
  NETWORK_TOTAL = 'NETWORK_TOTAL',
  NETWORK_UTILIZATION = 'NETWORK_UTILIZATION',
  CPU_UTILIZATION = 'CPU_UTILIZATION',
  STORAGE_UTILIZATION = 'STORAGE_UTILIZATION',
  STORAGE_TOTAL = 'STORAGE_TOTAL',
  PODS_BY_CPU = 'PODS_BY_CPU',
  PODS_BY_MEMORY = 'PODS_BY_MEMORY',
  PODS_BY_STORAGE = 'PODS_BY_STORAGE',
  PODS_BY_NETWORK = 'PODS_BY_NETWORK',
  NODES_BY_CPU = 'NODES_BY_CPU',
  NODES_BY_MEMORY = 'NODES_BY_MEMORY',
  NODES_BY_STORAGE = 'NODES_BY_STORAGE',
  NODES_BY_NETWORK = 'NODES_BY_NETWORK',
}

const overviewQueries = {
  [OverviewQuery.MEMORY_TOTAL]: 'sum(kube_node_status_capacity_memory_bytes)',
  [OverviewQuery.MEMORY_UTILIZATION]: '(sum(kube_node_status_capacity_memory_bytes) - sum(kube_node_status_allocatable_memory_bytes))[60m:5m]',
  [OverviewQuery.NETWORK_TOTAL]: 'sum(avg by(instance)(node_network_speed_bytes))',
  [OverviewQuery.NETWORK_UTILIZATION]: 'sum(node:node_net_utilisation:sum_irate)',
  [OverviewQuery.CPU_UTILIZATION]: '((sum(node:node_cpu_utilisation:avg1m) / count(node:node_cpu_utilisation:avg1m)) * 100)[60m:5m]',
  [OverviewQuery.STORAGE_UTILIZATION]: '(sum(node_filesystem_size_bytes) - sum(node_filesystem_free_bytes))[60m:5m]',
  [OverviewQuery.STORAGE_TOTAL]: 'sum(node_filesystem_size_bytes)',
  [OverviewQuery.PODS_BY_CPU]: 'sort(topk(5, pod_name:container_cpu_usage:sum))',
  [OverviewQuery.PODS_BY_MEMORY]: 'sort(topk(5, pod_name:container_memory_usage_bytes:sum))',
  [OverviewQuery.PODS_BY_STORAGE]: 'sort(topk(5, avg by (pod_name)(irate(container_fs_io_time_seconds_total{container_name="POD", pod_name!=""}[1m]))))',
  [OverviewQuery.PODS_BY_NETWORK]: `sort(topk(5, sum by (pod_name)(irate(container_network_receive_bytes_total{container_name="POD", pod_name!=""}[1m]) + 
irate(container_network_transmit_bytes_total{container_name="POD", pod_name!=""}[1m]))))`,
  [OverviewQuery.NODES_BY_CPU]: 'sort(topk(5, node:node_cpu_utilisation:avg1m))',
  [OverviewQuery.NODES_BY_MEMORY]: 'sort(topk(5, node:node_memory_bytes_total:sum - node:node_memory_bytes_available:sum))',
  [OverviewQuery.NODES_BY_STORAGE]: 'sort(topk(5, node:node_disk_utilisation:avg_irate{cluster=""}))',
  [OverviewQuery.NODES_BY_NETWORK]: 'sort(topk(5, node:node_net_utilisation:sum_irate{cluster=""}))',
};

export const capacityQueries = {
  [OverviewQuery.MEMORY_TOTAL]: overviewQueries[OverviewQuery.MEMORY_TOTAL],
  [OverviewQuery.MEMORY_UTILIZATION]: overviewQueries[OverviewQuery.MEMORY_UTILIZATION],
  [OverviewQuery.NETWORK_TOTAL]: overviewQueries[OverviewQuery.NETWORK_TOTAL],
  [OverviewQuery.NETWORK_UTILIZATION]: overviewQueries[OverviewQuery.NETWORK_UTILIZATION],
  [OverviewQuery.CPU_UTILIZATION]: overviewQueries[OverviewQuery.CPU_UTILIZATION],
  [OverviewQuery.STORAGE_UTILIZATION]: overviewQueries[OverviewQuery.STORAGE_UTILIZATION],
  [OverviewQuery.STORAGE_TOTAL]: overviewQueries[OverviewQuery.STORAGE_TOTAL],
};

export const utilizationQueries = {
  [OverviewQuery.CPU_UTILIZATION]: overviewQueries[OverviewQuery.CPU_UTILIZATION],
  [OverviewQuery.MEMORY_UTILIZATION]: overviewQueries[OverviewQuery.MEMORY_UTILIZATION],
  [OverviewQuery.STORAGE_UTILIZATION]: overviewQueries[OverviewQuery.STORAGE_UTILIZATION],
};

export const topConsumersQueries = {
  [OverviewQuery.PODS_BY_CPU]: overviewQueries[OverviewQuery.PODS_BY_CPU],
  [OverviewQuery.PODS_BY_MEMORY]: overviewQueries[OverviewQuery.PODS_BY_MEMORY],
  [OverviewQuery.PODS_BY_STORAGE]: overviewQueries [OverviewQuery.PODS_BY_STORAGE],
  [OverviewQuery.PODS_BY_NETWORK]: overviewQueries[OverviewQuery.PODS_BY_NETWORK],
  [OverviewQuery.NODES_BY_CPU]: overviewQueries[OverviewQuery.NODES_BY_CPU],
  [OverviewQuery.NODES_BY_MEMORY]: overviewQueries[OverviewQuery.NODES_BY_MEMORY],
  [OverviewQuery.NODES_BY_STORAGE]: overviewQueries[OverviewQuery.NODES_BY_STORAGE],
  [OverviewQuery.NODES_BY_NETWORK]: overviewQueries[OverviewQuery.NODES_BY_NETWORK],
};

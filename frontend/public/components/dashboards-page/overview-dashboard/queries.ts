export enum OverviewQuery {
  MEMORY_TOTAL = 'MEMORY_TOTAL',
  MEMORY_UTILIZATION = 'MEMORY_UTILIZATION',
  NETWORK_TOTAL = 'NETWORK_TOTAL',
  NETWORK_UTILIZATION = 'NETWORK_UTILIZATION',
  CPU_UTILIZATION = 'CPU_UTILIZATION',
  STORAGE_UTILIZATION = 'STORAGE_UTILIZATION',
  STORAGE_TOTAL = 'STORAGE_TOTAL',
}

export const overviewQueries = {
  [OverviewQuery.MEMORY_TOTAL]: 'sum(kube_node_status_capacity_memory_bytes)',
  [OverviewQuery.MEMORY_UTILIZATION]: '(sum(kube_node_status_capacity_memory_bytes) - sum(kube_node_status_allocatable_memory_bytes))[60m:5m]',
  [OverviewQuery.NETWORK_TOTAL]: 'sum(avg by(instance)(node_network_speed_bytes))',
  [OverviewQuery.NETWORK_UTILIZATION]: 'sum(node:node_net_utilisation:sum_irate)',
  [OverviewQuery.CPU_UTILIZATION]: '((sum(node:node_cpu_utilisation:avg1m) / count(node:node_cpu_utilisation:avg1m)) * 100)[60m:5m]',
  [OverviewQuery.STORAGE_UTILIZATION]: '(sum(node_filesystem_size_bytes) - sum(node_filesystem_free_bytes))[60m:5m]',
  [OverviewQuery.STORAGE_TOTAL]: 'sum(node_filesystem_size_bytes)',
};

export const utilizationQueries = {
  [OverviewQuery.CPU_UTILIZATION]: overviewQueries[OverviewQuery.CPU_UTILIZATION],
  [OverviewQuery.MEMORY_UTILIZATION]: overviewQueries[OverviewQuery.MEMORY_UTILIZATION],
  [OverviewQuery.STORAGE_UTILIZATION]: overviewQueries[OverviewQuery.STORAGE_UTILIZATION],
};

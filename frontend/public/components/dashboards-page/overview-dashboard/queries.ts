export enum OverviewQuery {
  MEMORY_TOTAL = 'MEMORY_TOTAL',
  MEMORY_UTILIZATION = 'MEMORY_UTILIZATION',
  NETWORK_TOTAL = 'NETWORK_TOTAL',
  NETWORK_UTILIZATION = 'NETWORK_UTILIZATION',
  CPU_TOTAL = 'CPU_TOTAL',
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
  [OverviewQuery.MEMORY_TOTAL]: 'sum(cluster:capacity_memory_bytes:sum)',
  [OverviewQuery.MEMORY_UTILIZATION]: 'cluster:memory_usage_bytes:sum[60m:5m]',
  [OverviewQuery.NETWORK_TOTAL]: 'sum(avg by(instance)(node_network_speed_bytes))',
  [OverviewQuery.NETWORK_UTILIZATION]: 'sum(instance:node_network_transmit_bytes_excluding_lo:rate1m+instance:node_network_receive_bytes_excluding_lo:rate1m)',
  [OverviewQuery.CPU_TOTAL]: 'sum(cluster:capacity_cpu_cores:sum)',
  [OverviewQuery.CPU_UTILIZATION]: 'cluster:cpu_usage_cores:sum[60m:5m]',
  [OverviewQuery.STORAGE_UTILIZATION]: '(sum(node_filesystem_size_bytes) - sum(node_filesystem_free_bytes))[60m:5m]',
  [OverviewQuery.STORAGE_TOTAL]: 'sum(node_filesystem_size_bytes)',
  [OverviewQuery.PODS_BY_CPU]: 'sort_desc(sum(avg_over_time(pod_name:container_cpu_usage:sum{container="",pod_name!=""}[5m])) BY (pod_name, namespace))',
  [OverviewQuery.PODS_BY_MEMORY]: 'sort_desc(sum(avg_over_time(container_memory_working_set_bytes{container="",pod_name!=""}[5m])) BY (pod_name, namespace))',
  [OverviewQuery.PODS_BY_STORAGE]: 'sort_desc(sum(avg_over_time(pod_name:container_fs_usage_bytes:sum{container="", pod_name!=""}[5m])) BY (pod_name, namespace))',
  [OverviewQuery.PODS_BY_NETWORK]: 'sort_desc(sum by (pod_name, namespace)(irate(container_network_receive_bytes_total{container="POD", pod_name!=""}[1m])' +
    ' + irate(container_network_transmit_bytes_total{container="POD", pod_name!=""}[1m])))',
  [OverviewQuery.NODES_BY_CPU]: 'sort_desc(avg_over_time(instance:node_cpu:rate:sum[5m]))',
  [OverviewQuery.NODES_BY_MEMORY]: 'sort_desc(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)',
  [OverviewQuery.NODES_BY_STORAGE]: 'sort_desc(avg_over_time(instance:node_filesystem_usage:sum[5m]))',
  [OverviewQuery.NODES_BY_NETWORK]: 'sort_desc(sum by (instance) (instance:node_network_transmit_bytes_excluding_lo:rate1m+instance:node_network_receive_bytes_excluding_lo:rate1m))',
};

export const capacityQueries = {
  [OverviewQuery.MEMORY_TOTAL]: overviewQueries[OverviewQuery.MEMORY_TOTAL],
  [OverviewQuery.MEMORY_UTILIZATION]: overviewQueries[OverviewQuery.MEMORY_UTILIZATION],
  [OverviewQuery.NETWORK_TOTAL]: overviewQueries[OverviewQuery.NETWORK_TOTAL],
  [OverviewQuery.NETWORK_UTILIZATION]: overviewQueries[OverviewQuery.NETWORK_UTILIZATION],
  [OverviewQuery.CPU_TOTAL]: overviewQueries[OverviewQuery.CPU_TOTAL],
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

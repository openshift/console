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
  [OverviewQuery.MEMORY_TOTAL]: 'sum(node_memory_MemTotal_bytes)',
  [OverviewQuery.MEMORY_UTILIZATION]: 'sum(node_memory_Active_bytes)',
  [OverviewQuery.NETWORK_TOTAL]: 'sum(avg by(instance)(node_network_speed_bytes))',
  [OverviewQuery.NETWORK_UTILIZATION]:
    'sum(instance:node_network_transmit_bytes_excluding_lo:rate1m+instance:node_network_receive_bytes_excluding_lo:rate1m)',
  [OverviewQuery.CPU_UTILIZATION]:
    '(avg(instance:node_cpu_utilisation:rate1m{job="node-exporter"}) * 100)',
  [OverviewQuery.STORAGE_UTILIZATION]:
    '(sum(node_filesystem_size_bytes) - sum(node_filesystem_free_bytes))',
  [OverviewQuery.STORAGE_TOTAL]: 'sum(node_filesystem_size_bytes)',
  [OverviewQuery.PODS_BY_CPU]:
    'sort_desc(sum(rate(container_cpu_usage_seconds_total{container_name="",pod!=""}[5m])) BY (pod, namespace))',
  [OverviewQuery.PODS_BY_MEMORY]:
    'sort_desc(sum(container_memory_working_set_bytes{container="",pod!=""}) BY (pod, namespace))',
  [OverviewQuery.PODS_BY_STORAGE]:
    'sort_desc(avg by (pod, namespace)(irate(container_fs_io_time_seconds_total{container="POD", pod!=""}[1m])))',
  [OverviewQuery.PODS_BY_NETWORK]:
    'sort_desc(sum by (pod, namespace)(irate(container_network_receive_bytes_total{container="POD", pod!=""}[1m])' +
    ' + irate(container_network_transmit_bytes_total{container="POD", pod!=""}[1m])))',
  [OverviewQuery.NODES_BY_CPU]: 'sort_desc(instance:node_cpu_utilisation:rate1m)',
  [OverviewQuery.NODES_BY_MEMORY]:
    'sort_desc(node_memory_MemTotal_bytes{job="node-exporter"} - node_memory_MemAvailable_bytes{job="node-exporter"})',
  [OverviewQuery.NODES_BY_STORAGE]:
    'sort_desc(avg by (instance) (instance_device:node_disk_io_time_seconds:rate1m))',
  [OverviewQuery.NODES_BY_NETWORK]:
    'sort_desc(sum by (instance) (instance:node_network_transmit_bytes_excluding_lo:rate1m+instance:node_network_receive_bytes_excluding_lo:rate1m))',
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
  [OverviewQuery.PODS_BY_STORAGE]: overviewQueries[OverviewQuery.PODS_BY_STORAGE],
  [OverviewQuery.PODS_BY_NETWORK]: overviewQueries[OverviewQuery.PODS_BY_NETWORK],
  [OverviewQuery.NODES_BY_CPU]: overviewQueries[OverviewQuery.NODES_BY_CPU],
  [OverviewQuery.NODES_BY_MEMORY]: overviewQueries[OverviewQuery.NODES_BY_MEMORY],
  [OverviewQuery.NODES_BY_STORAGE]: overviewQueries[OverviewQuery.NODES_BY_STORAGE],
  [OverviewQuery.NODES_BY_NETWORK]: overviewQueries[OverviewQuery.NODES_BY_NETWORK],
};

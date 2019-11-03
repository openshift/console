export enum OverviewQuery {
  MEMORY_TOTAL = 'MEMORY_TOTAL',
  MEMORY_UTILIZATION = 'MEMORY_UTILIZATION',
  NETWORK_TOTAL = 'NETWORK_TOTAL',
  NETWORK_UTILIZATION = 'NETWORK_UTILIZATION',
  CPU_UTILIZATION = 'CPU_UTILIZATION',
  CPU_TOTAL = 'CPU_TOTAL',
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
  PROJECTS_BY_CPU = 'PROJECTS_BY_CPU',
  PROJECTS_BY_MEMORY = 'PROJECTS_BY_MEMORY',
  PROJECTS_BY_STORAGE = 'PROJECTS_BY_STORAGE',
  PROJECTS_BY_NETWORK = 'PROJECTS_BY_NETWORK',
}

const top25Queries = {
  [OverviewQuery.PODS_BY_CPU]:
    'topk(25, sort_desc(sum(rate(container_cpu_usage_seconds_total{container="",pod!=""}[5m])) BY (pod, namespace)))',
  [OverviewQuery.PODS_BY_MEMORY]:
    'topk(25, sort_desc(sum(container_memory_working_set_bytes{container="",pod!=""}) BY (pod, namespace)))',
  [OverviewQuery.PODS_BY_STORAGE]:
    'topk(25, sort_desc(avg by (pod, namespace)(irate(container_fs_io_time_seconds_total{container="POD", pod!=""}[1m]))))',
  [OverviewQuery.NODES_BY_CPU]: 'topk(5,sort_desc(instance:node_cpu_utilisation:rate1m))',
  [OverviewQuery.NODES_BY_MEMORY]:
    'topk(25,sort_desc(node_memory_MemTotal_bytes{job="node-exporter"} - node_memory_MemAvailable_bytes{job="node-exporter"}))',
  [OverviewQuery.NODES_BY_STORAGE]:
    'topk(25, sort_desc(avg by (instance) (instance_device:node_disk_io_time_seconds:rate1m)))',
  [OverviewQuery.PROJECTS_BY_CPU]:
    'topk(25, sort_desc(sum(rate(container_cpu_usage_seconds_total{container="",pod!=""}[5m])) BY (namespace)))',
  [OverviewQuery.PROJECTS_BY_MEMORY]:
    'topk(25, sort_desc(sum(container_memory_working_set_bytes{container="",pod!=""}) BY (namespace)))',
  [OverviewQuery.PROJECTS_BY_STORAGE]:
    'topk(25, sort_desc(avg by (namespace)(irate(container_fs_io_time_seconds_total{container="POD", pod!=""}[1m]))))',
};

const overviewQueries = {
  [OverviewQuery.MEMORY_TOTAL]: 'sum(node_memory_MemTotal_bytes)',
  [OverviewQuery.MEMORY_UTILIZATION]: 'sum(node_memory_Active_bytes)',
  [OverviewQuery.NETWORK_TOTAL]: 'sum(avg by(instance)(node_network_speed_bytes))',
  [OverviewQuery.NETWORK_UTILIZATION]:
    'sum(instance:node_network_transmit_bytes_excluding_lo:rate1m+instance:node_network_receive_bytes_excluding_lo:rate1m)',
  [OverviewQuery.CPU_UTILIZATION]: 'cluster:cpu_usage_cores:sum',
  [OverviewQuery.CPU_TOTAL]: 'sum(cluster:capacity_cpu_cores:sum)',
  [OverviewQuery.STORAGE_UTILIZATION]:
    '(sum(node_filesystem_size_bytes) - sum(node_filesystem_free_bytes))',
  [OverviewQuery.STORAGE_TOTAL]: 'sum(node_filesystem_size_bytes)',
  [OverviewQuery.PODS_BY_CPU]:
    'sort_desc(sum(rate(container_cpu_usage_seconds_total{container="",pod!=""}[5m])) BY (pod, namespace))',
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
  [OverviewQuery.CPU_UTILIZATION]: {
    utilization: overviewQueries[OverviewQuery.CPU_UTILIZATION],
    total: overviewQueries[OverviewQuery.CPU_TOTAL],
  },
  [OverviewQuery.MEMORY_UTILIZATION]: {
    utilization: overviewQueries[OverviewQuery.MEMORY_UTILIZATION],
    total: overviewQueries[OverviewQuery.MEMORY_TOTAL],
  },
  [OverviewQuery.STORAGE_UTILIZATION]: {
    utilization: overviewQueries[OverviewQuery.STORAGE_UTILIZATION],
    total: overviewQueries[OverviewQuery.STORAGE_TOTAL],
  },
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
  [OverviewQuery.PROJECTS_BY_CPU]: overviewQueries[OverviewQuery.PROJECTS_BY_CPU],
  [OverviewQuery.PROJECTS_BY_MEMORY]: overviewQueries[OverviewQuery.PROJECTS_BY_MEMORY],
  [OverviewQuery.PROJECTS_BY_STORAGE]: overviewQueries[OverviewQuery.PROJECTS_BY_STORAGE],
};

export const top25ConsumerQueries = {
  [OverviewQuery.PODS_BY_CPU]: top25Queries[OverviewQuery.PODS_BY_CPU],
  [OverviewQuery.PODS_BY_MEMORY]: top25Queries[OverviewQuery.PODS_BY_MEMORY],
  [OverviewQuery.PODS_BY_STORAGE]: top25Queries[OverviewQuery.PODS_BY_STORAGE],
  [OverviewQuery.NODES_BY_CPU]: top25Queries[OverviewQuery.NODES_BY_CPU],
  [OverviewQuery.NODES_BY_MEMORY]: top25Queries[OverviewQuery.NODES_BY_MEMORY],
  [OverviewQuery.NODES_BY_STORAGE]: top25Queries[OverviewQuery.NODES_BY_STORAGE],
  [OverviewQuery.PROJECTS_BY_CPU]: top25Queries[OverviewQuery.PROJECTS_BY_CPU],
  [OverviewQuery.PROJECTS_BY_MEMORY]: top25Queries[OverviewQuery.PROJECTS_BY_MEMORY],
  [OverviewQuery.PROJECTS_BY_STORAGE]: top25Queries[OverviewQuery.PROJECTS_BY_STORAGE],
};

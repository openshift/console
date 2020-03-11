export enum OverviewQuery {
  MEMORY_TOTAL = 'MEMORY_TOTAL',
  MEMORY_UTILIZATION = 'MEMORY_UTILIZATION',
  NETWORK_UTILIZATION = 'NETWORK_UTILIZATION',
  NETWORK_IN_UTILIZATION = 'NETWORK_IN_UTILIZATION',
  NETWORK_OUT_UTILIZATION = 'NETWORK_OUT_UTILIZATION',
  CPU_UTILIZATION = 'CPU_UTILIZATION',
  CPU_TOTAL = 'CPU_TOTAL',
  STORAGE_UTILIZATION = 'STORAGE_UTILIZATION',
  STORAGE_TOTAL = 'STORAGE_TOTAL',
  PODS_BY_CPU = 'PODS_BY_CPU',
  PODS_BY_MEMORY = 'PODS_BY_MEMORY',
  PODS_BY_STORAGE = 'PODS_BY_STORAGE',
  PODS_BY_NETWORK_IN = 'PODS_BY_NETWORK_IN',
  PODS_BY_NETWORK_OUT = 'PODS_BY_NETWORK_OUT',
  NODES_BY_CPU = 'NODES_BY_CPU',
  NODES_BY_MEMORY = 'NODES_BY_MEMORY',
  NODES_BY_STORAGE = 'NODES_BY_STORAGE',
  NODES_BY_NETWORK_IN = 'NODES_BY_NETWORK_IN',
  NODES_BY_NETWORK_OUT = 'NODES_BY_NETWORK_OUT',
  NODES_BY_PODS = 'NODES_BY_PODS',
  PROJECTS_BY_CPU = 'PROJECTS_BY_CPU',
  PROJECTS_BY_MEMORY = 'PROJECTS_BY_MEMORY',
  PROJECTS_BY_STORAGE = 'PROJECTS_BY_STORAGE',
  PROJECTS_BY_NETWORK_IN = 'PROJECTS_BY_NETWORK_IN',
  PROJECTS_BY_NETWORK_OUT = 'PROJECTS_BY_NETWORK_OUT',
  PROJECTS_BY_PODS = 'PROJECTS_BY_PODS',
  POD_UTILIZATION = 'POD_UTILIZATION',
}

const top25Queries = {
  [OverviewQuery.PODS_BY_CPU]:
    'topk(25, sort_desc(sum(avg_over_time(pod:container_cpu_usage:sum{container="",pod!=""}[5m])) BY (pod, namespace)))',
  [OverviewQuery.PODS_BY_MEMORY]:
    'topk(25, sort_desc(sum(avg_over_time(container_memory_working_set_bytes{container="",pod!=""}[5m])) BY (pod, namespace)))',
  [OverviewQuery.PODS_BY_STORAGE]:
    'topk(25, sort_desc(sum(avg_over_time(pod:container_fs_usage_bytes:sum{container="", pod!=""}[5m])) BY (pod, namespace)))',
  [OverviewQuery.PODS_BY_NETWORK_IN]:
    'topk(25, sort_desc(sum(rate(container_network_receive_bytes_total{ container="POD", pod!= ""}[5m])) BY (namespace, pod)))',
  [OverviewQuery.PODS_BY_NETWORK_OUT]:
    'topk(25, sort_desc(sum(rate(container_network_transmit_bytes_total{ container="POD", pod!= ""}[5m])) BY (namespace, pod)))',
  [OverviewQuery.NODES_BY_CPU]:
    'topk(25, sort_desc(avg_over_time(instance:node_cpu:rate:sum[5m])))',
  [OverviewQuery.NODES_BY_MEMORY]:
    'topk(25, sort_desc(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes))',
  [OverviewQuery.NODES_BY_STORAGE]:
    'topk(25, sort_desc(avg_over_time(instance:node_filesystem_usage:sum[5m])))',
  [OverviewQuery.NODES_BY_PODS]:
    'topk(25, sort_desc(sum(avg_over_time(kube_pod_info[5m])) BY (node)))',
  [OverviewQuery.NODES_BY_NETWORK_IN]:
    'topk(25, sort_desc(sum(rate(container_network_receive_bytes_total{ container="POD", pod!= ""}[5m])) BY (node)))',
  [OverviewQuery.NODES_BY_NETWORK_OUT]:
    'topk(25, sort_desc(sum(rate(container_network_transmit_bytes_total{ container="POD", pod!= ""}[5m])) BY (node)))',
  [OverviewQuery.PROJECTS_BY_CPU]:
    'topk(25, sort_desc(sum(avg_over_time(pod:container_cpu_usage:sum{container="",pod!=""}[5m])) BY (namespace)))',
  [OverviewQuery.PROJECTS_BY_MEMORY]:
    'topk(25, sort_desc(sum(avg_over_time(container_memory_working_set_bytes{container="",pod!=""}[5m])) BY (namespace)))',
  [OverviewQuery.PROJECTS_BY_STORAGE]:
    'topk(25, sort_desc(sum(avg_over_time(pod:container_fs_usage_bytes:sum{container="", pod!=""}[5m])) BY (namespace)))',
  [OverviewQuery.PROJECTS_BY_PODS]:
    'topk(25, sort_desc(sum(avg_over_time(kube_pod_info[5m])) BY (namespace)))',
  [OverviewQuery.PROJECTS_BY_NETWORK_IN]:
    'topk(25, sort_desc(sum(rate(container_network_receive_bytes_total{ container="POD", pod!= ""}[5m])) BY (namespace)))',
  [OverviewQuery.PROJECTS_BY_NETWORK_OUT]:
    'topk(25, sort_desc(sum(rate(container_network_transmit_bytes_total{ container="POD", pod!= ""}[5m])) BY (namespace)))',
};

const overviewQueries = {
  [OverviewQuery.MEMORY_TOTAL]: 'sum(node_memory_MemTotal_bytes)',
  [OverviewQuery.MEMORY_UTILIZATION]:
    'sum(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)',
  [OverviewQuery.NETWORK_UTILIZATION]:
    'sum(instance:node_network_transmit_bytes_excluding_lo:rate1m+instance:node_network_receive_bytes_excluding_lo:rate1m)',
  [OverviewQuery.CPU_UTILIZATION]: 'cluster:cpu_usage_cores:sum',
  [OverviewQuery.CPU_TOTAL]: 'sum(cluster:capacity_cpu_cores:sum)',
  [OverviewQuery.STORAGE_UTILIZATION]:
    '(sum(node_filesystem_size_bytes) - sum(node_filesystem_free_bytes))',
  [OverviewQuery.STORAGE_TOTAL]: 'sum(node_filesystem_size_bytes)',
  [OverviewQuery.POD_UTILIZATION]: 'count(kube_pod_info)',
  [OverviewQuery.NETWORK_IN_UTILIZATION]:
    'sum(rate(container_network_receive_bytes_total{container="POD",pod!=""}[5m]))',
  [OverviewQuery.NETWORK_OUT_UTILIZATION]:
    'sum(rate(container_network_transmit_bytes_total{container="POD",pod!=""}[5m]))',
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
  [OverviewQuery.POD_UTILIZATION]: {
    utilization: overviewQueries[OverviewQuery.POD_UTILIZATION],
  },
};

export const multilineQueries = {
  [OverviewQuery.NETWORK_UTILIZATION]: [
    { query: overviewQueries[OverviewQuery.NETWORK_IN_UTILIZATION], desc: 'In' },
    { query: overviewQueries[OverviewQuery.NETWORK_OUT_UTILIZATION], desc: 'Out' },
  ],
};

export const top25ConsumerQueries = {
  [OverviewQuery.PODS_BY_CPU]: top25Queries[OverviewQuery.PODS_BY_CPU],
  [OverviewQuery.PODS_BY_MEMORY]: top25Queries[OverviewQuery.PODS_BY_MEMORY],
  [OverviewQuery.PODS_BY_STORAGE]: top25Queries[OverviewQuery.PODS_BY_STORAGE],
  [OverviewQuery.PODS_BY_NETWORK_IN]: top25Queries[OverviewQuery.PODS_BY_NETWORK_IN],
  [OverviewQuery.PODS_BY_NETWORK_OUT]: top25Queries[OverviewQuery.PODS_BY_NETWORK_OUT],
  [OverviewQuery.NODES_BY_CPU]: top25Queries[OverviewQuery.NODES_BY_CPU],
  [OverviewQuery.NODES_BY_MEMORY]: top25Queries[OverviewQuery.NODES_BY_MEMORY],
  [OverviewQuery.NODES_BY_STORAGE]: top25Queries[OverviewQuery.NODES_BY_STORAGE],
  [OverviewQuery.NODES_BY_PODS]: top25Queries[OverviewQuery.NODES_BY_PODS],
  [OverviewQuery.NODES_BY_NETWORK_IN]: top25Queries[OverviewQuery.NODES_BY_NETWORK_IN],
  [OverviewQuery.NODES_BY_NETWORK_OUT]: top25Queries[OverviewQuery.NODES_BY_NETWORK_OUT],
  [OverviewQuery.PROJECTS_BY_CPU]: top25Queries[OverviewQuery.PROJECTS_BY_CPU],
  [OverviewQuery.PROJECTS_BY_MEMORY]: top25Queries[OverviewQuery.PROJECTS_BY_MEMORY],
  [OverviewQuery.PROJECTS_BY_STORAGE]: top25Queries[OverviewQuery.PROJECTS_BY_STORAGE],
  [OverviewQuery.PROJECTS_BY_PODS]: top25Queries[OverviewQuery.PROJECTS_BY_PODS],
  [OverviewQuery.PROJECTS_BY_NETWORK_IN]: top25Queries[OverviewQuery.PROJECTS_BY_NETWORK_IN],
  [OverviewQuery.PROJECTS_BY_NETWORK_OUT]: top25Queries[OverviewQuery.PROJECTS_BY_NETWORK_OUT],
};

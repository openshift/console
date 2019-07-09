export enum HostQuery {
  CPU_UTILIZATION = 'CPU_UTILIZATION',
  MEMORY_UTILIZATION = 'MEMORY_UTILIZATION',
  STORAGE_UTILIZATION = 'STORAGE_UTILIZATION',
  NETWORK_IN_UTILIZATION = 'NETWORK_IN_UTILIZATION',
  NETWORK_OUT_UTILIZATION = 'NETWORK_OUT_UTILIZATION',
  NUMBER_OF_PODS = 'NUMBER_OF_PODS',
}

const hostQueries = {
  [HostQuery.CPU_UTILIZATION]: 'instance:node_cpu:rate:sum',
  [HostQuery.MEMORY_UTILIZATION]: 'node_memory_Active_bytes',
  [HostQuery.STORAGE_UTILIZATION]: 'instance:node_filesystem_usage:sum',
  [HostQuery.NETWORK_IN_UTILIZATION]: 'instance:node_network_receive_bytes:rate:sum',
  [HostQuery.NETWORK_OUT_UTILIZATION]: 'instance:node_network_transmit_bytes:rate:sum',
  [HostQuery.NUMBER_OF_PODS]: 'kubelet_running_pod_count',
};

const getQueryForHost = (hostIP: string, query: string): string =>
  `${query}{instance=~'${hostIP}:.*'}[60m:5m]`;

export const getUtilizationQueries = (hostIP: string): HostQueryType => ({
  [HostQuery.CPU_UTILIZATION]: getQueryForHost(hostIP, hostQueries[HostQuery.CPU_UTILIZATION]),
  [HostQuery.MEMORY_UTILIZATION]: getQueryForHost(
    hostIP,
    hostQueries[HostQuery.MEMORY_UTILIZATION],
  ),
  [HostQuery.STORAGE_UTILIZATION]: getQueryForHost(
    hostIP,
    hostQueries[HostQuery.STORAGE_UTILIZATION],
  ),
  [HostQuery.NETWORK_IN_UTILIZATION]: getQueryForHost(
    hostIP,
    hostQueries[HostQuery.NETWORK_IN_UTILIZATION],
  ),
  [HostQuery.NETWORK_OUT_UTILIZATION]: getQueryForHost(
    hostIP,
    hostQueries[HostQuery.NETWORK_OUT_UTILIZATION],
  ),
  [HostQuery.NUMBER_OF_PODS]: getQueryForHost(hostIP, hostQueries[HostQuery.NUMBER_OF_PODS]),
});

type HostQueryType = {
  [key: string]: string;
};

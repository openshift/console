import * as _ from 'lodash';

export enum HostQuery {
  CPU_UTILIZATION = 'CPU_UTILIZATION',
  MEMORY_UTILIZATION = 'MEMORY_UTILIZATION',
  STORAGE_UTILIZATION = 'STORAGE_UTILIZATION',
  NETWORK_IN_UTILIZATION = 'NETWORK_IN_UTILIZATION',
  NETWORK_OUT_UTILIZATION = 'NETWORK_OUT_UTILIZATION',
  NUMBER_OF_PODS = 'NUMBER_OF_PODS',
  NUMBER_OF_FANS = 'NUMBER_OF_FANS',
  NUMBER_OF_PSUS = 'NUMBER_OF_PSUS',
}

const hostQueries = {
  [HostQuery.CPU_UTILIZATION]: 'instance:node_cpu:rate:sum',
  [HostQuery.MEMORY_UTILIZATION]: 'node_memory_Active_bytes',
  [HostQuery.STORAGE_UTILIZATION]: 'instance:node_filesystem_usage:sum',
  [HostQuery.NETWORK_IN_UTILIZATION]: 'instance:node_network_receive_bytes:rate:sum',
  [HostQuery.NETWORK_OUT_UTILIZATION]: 'instance:node_network_transmit_bytes:rate:sum',
  [HostQuery.NUMBER_OF_PODS]: 'kubelet_running_pod_count',
  [HostQuery.NUMBER_OF_FANS]: 'baremetal_fan_rpm',
  [HostQuery.NUMBER_OF_PSUS]: 'baremetal_current',
};

const getQueryForHost = (hostIP: string, query: string): string =>
  `${query}{instance=~'${hostIP}:.*'}[60m:5m]`;

const getSimpleQueryForHost = (hostIP: string, query: string): string =>
  `${query}{instance=~'${hostIP}:.*'}`;

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

export const getInventoryQueries = (hostIP: string): HostQueryType => ({
  [HostQuery.NUMBER_OF_PODS]: getSimpleQueryForHost(hostIP, hostQueries[HostQuery.NUMBER_OF_PODS]),
  [HostQuery.NUMBER_OF_FANS]: getSimpleQueryForHost(hostIP, hostQueries[HostQuery.NUMBER_OF_FANS]),
  [HostQuery.NUMBER_OF_PSUS]: getSimpleQueryForHost(hostIP, hostQueries[HostQuery.NUMBER_OF_PSUS]),
});

type HostQueryType = {
  [key: string]: string;
};

export const getHostQueryResultError = (result: any): boolean =>
  _.get(result, 'status', '') !== 'success';

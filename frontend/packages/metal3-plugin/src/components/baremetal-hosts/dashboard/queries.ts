import * as _ from 'lodash';
import { PrometheusResponse } from '@console/internal/components/graphs';

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

const hostQueriesByHostName = {
  [HostQuery.CPU_UTILIZATION]: 'instance:node_cpu:rate:sum',
  [HostQuery.MEMORY_UTILIZATION]: 'node_memory_Active_bytes',
  [HostQuery.STORAGE_UTILIZATION]: 'instance:node_filesystem_usage:sum',
  [HostQuery.NETWORK_IN_UTILIZATION]: 'instance:node_network_receive_bytes:rate:sum',
  [HostQuery.NETWORK_OUT_UTILIZATION]: 'instance:node_network_transmit_bytes:rate:sum',
  [HostQuery.NUMBER_OF_FANS]: 'baremetal_fan_rpm',
  [HostQuery.NUMBER_OF_PSUS]: 'baremetal_current',
};

const hostQueriesByIP = {
  [HostQuery.NUMBER_OF_PODS]: 'kubelet_running_pod_count',
};

const getQueryForHostName = (hostName: string, query: string): string =>
  `${query}{instance=~'${hostName}'}[60m:5m]`;

const getQueryForHostIP = (hostIP: string, query: string): string =>
  `${query}{instance=~'${hostIP}:.*'}[60m:5m]`;

const getSimpleQueryForHostIP = (hostIP: string, query: string): string =>
  `${query}{instance=~'${hostIP}:.*'}`;

export const getUtilizationQueries = (hostName: string, hostIP: string): HostQueryType => ({
  [HostQuery.CPU_UTILIZATION]: getQueryForHostName(
    hostName,
    hostQueriesByHostName[HostQuery.CPU_UTILIZATION],
  ),
  [HostQuery.MEMORY_UTILIZATION]: getQueryForHostName(
    hostName,
    hostQueriesByHostName[HostQuery.MEMORY_UTILIZATION],
  ),
  [HostQuery.STORAGE_UTILIZATION]: getQueryForHostName(
    hostName,
    hostQueriesByHostName[HostQuery.STORAGE_UTILIZATION],
  ),
  [HostQuery.NETWORK_IN_UTILIZATION]: getQueryForHostName(
    hostName,
    hostQueriesByHostName[HostQuery.NETWORK_IN_UTILIZATION],
  ),
  [HostQuery.NETWORK_OUT_UTILIZATION]: getQueryForHostName(
    hostName,
    hostQueriesByHostName[HostQuery.NETWORK_OUT_UTILIZATION],
  ),
  [HostQuery.NUMBER_OF_PODS]: getQueryForHostIP(hostIP, hostQueriesByIP[HostQuery.NUMBER_OF_PODS]),
});

export const getInventoryQueries = (hostIP: string): HostQueryType => ({
  [HostQuery.NUMBER_OF_PODS]: getSimpleQueryForHostIP(
    hostIP,
    hostQueriesByIP[HostQuery.NUMBER_OF_PODS],
  ),
});

type HostQueryType = {
  [key: string]: string;
};

export const getHostQueryResultError = (result: PrometheusResponse): boolean =>
  _.get(result, 'status', '') !== 'success';

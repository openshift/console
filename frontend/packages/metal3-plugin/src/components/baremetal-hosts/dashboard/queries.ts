import * as _ from 'lodash';
import { PrometheusResponse } from '@console/internal/components/graphs';

export enum HostQuery {
  CPU_UTILIZATION = 'CPU_UTILIZATION',
  MEMORY_UTILIZATION = 'MEMORY_UTILIZATION',
  MEMORY_TOTAL = 'MEMORY_TOTAL',
  STORAGE_UTILIZATION = 'STORAGE_UTILIZATION',
  NETWORK_IN_UTILIZATION = 'NETWORK_IN_UTILIZATION',
  NETWORK_OUT_UTILIZATION = 'NETWORK_OUT_UTILIZATION',
  NUMBER_OF_PODS = 'NUMBER_OF_PODS',
  NUMBER_OF_PODS_SIMPLE = 'NUMBER_OF_PODS_SIMPLE',
  NUMBER_OF_FANS = 'NUMBER_OF_FANS',
  NUMBER_OF_PSUS = 'NUMBER_OF_PSUS',
}

const hostQueriesByHostName = {
  [HostQuery.CPU_UTILIZATION]: _.template(
    `instance:node_cpu:rate:sum{instance=~'<%= host %>'}[60m:5m]`,
  ),
  [HostQuery.MEMORY_UTILIZATION]: _.template(
    `node_memory_Active_bytes{instance=~'<%= host %>'}[60m:5m]`,
  ),
  [HostQuery.MEMORY_TOTAL]: _.template(`node_memory_MemTotal_bytes{instance=~'<%= host %>'}`),
  [HostQuery.STORAGE_UTILIZATION]: _.template(
    `instance:node_filesystem_usage:sum{instance=~'<%= host %>'}[60m:5m]`,
  ),
  [HostQuery.NETWORK_IN_UTILIZATION]: _.template(
    `instance:node_network_receive_bytes:rate:sum{instance=~'<%= host %>'}[60m:5m]`,
  ),
  [HostQuery.NETWORK_OUT_UTILIZATION]: _.template(
    `instance:node_network_transmit_bytes:rate:sum{instance=~'<%= host %>'}[60m:5m]`,
  ),
  [HostQuery.NUMBER_OF_FANS]: _.template(`baremetal_fan_rpm`),
  [HostQuery.NUMBER_OF_PSUS]: _.template(`baremetal_current`),
};

const hostQueriesByIP = {
  [HostQuery.NUMBER_OF_PODS]: _.template(
    `kubelet_running_pod_count{instance=~'<%= host %>:.*'}[60m:5m]`,
  ),
  [HostQuery.NUMBER_OF_PODS_SIMPLE]: _.template(
    `kubelet_running_pod_count{instance=~'<%= host %>:.*'}`,
  ),
};

const getQuery = (host: string, query: _.TemplateExecutor): string => query({ host });

export const getUtilizationQueries = (hostName: string, hostIP: string): HostQueryType => ({
  [HostQuery.CPU_UTILIZATION]: getQuery(hostName, hostQueriesByHostName[HostQuery.CPU_UTILIZATION]),
  [HostQuery.MEMORY_UTILIZATION]: getQuery(
    hostName,
    hostQueriesByHostName[HostQuery.MEMORY_UTILIZATION],
  ),
  [HostQuery.MEMORY_TOTAL]: getQuery(hostName, hostQueriesByHostName[HostQuery.MEMORY_TOTAL]),
  [HostQuery.STORAGE_UTILIZATION]: getQuery(
    hostName,
    hostQueriesByHostName[HostQuery.STORAGE_UTILIZATION],
  ),
  [HostQuery.NETWORK_IN_UTILIZATION]: getQuery(
    hostName,
    hostQueriesByHostName[HostQuery.NETWORK_IN_UTILIZATION],
  ),
  [HostQuery.NETWORK_OUT_UTILIZATION]: getQuery(
    hostName,
    hostQueriesByHostName[HostQuery.NETWORK_OUT_UTILIZATION],
  ),
  [HostQuery.NUMBER_OF_PODS]: getQuery(hostIP, hostQueriesByIP[HostQuery.NUMBER_OF_PODS]),
});

export const getInventoryQueries = (hostIP: string): HostQueryType => ({
  [HostQuery.NUMBER_OF_PODS]: getQuery(hostIP, hostQueriesByIP[HostQuery.NUMBER_OF_PODS_SIMPLE]),
});

type HostQueryType = {
  [key: string]: string;
};

export const getHostQueryResultError = (result: PrometheusResponse): boolean =>
  _.get(result, 'status', '') !== 'success';

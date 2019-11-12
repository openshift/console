import * as _ from 'lodash';
import { PrometheusResponse } from '@console/internal/components/graphs';

export enum HostQuery {
  CPU_UTILIZATION = 'CPU_UTILIZATION',
  MEMORY_UTILIZATION = 'MEMORY_UTILIZATION',
  MEMORY_TOTAL = 'MEMORY_TOTAL',
  STORAGE_UTILIZATION = 'STORAGE_UTILIZATION',
  STORAGE_TOTAL = 'STORAGE_TOTAL',
  NETWORK_IN_UTILIZATION = 'NETWORK_IN_UTILIZATION',
  NETWORK_OUT_UTILIZATION = 'NETWORK_OUT_UTILIZATION',
  NUMBER_OF_PODS = 'NUMBER_OF_PODS',
  NUMBER_OF_PODS_SIMPLE = 'NUMBER_OF_PODS_SIMPLE',
  NUMBER_OF_FANS = 'NUMBER_OF_FANS',
  NUMBER_OF_PSUS = 'NUMBER_OF_PSUS',

  // popover queries
  PODS_BY_CPU = 'PODS_BY_CPU',
  PODS_BY_MEMORY = 'PODS_BY_MEMORY',
  PODS_BY_STORAGE = 'PODS_BY_STORAGE',
  PROJECTS_BY_CPU = 'PROJECTS_BY_CPU',
  PROJECTS_BY_MEMORY = 'PROJECTS_BY_MEMORY',
  PROJECTS_BY_STORAGE = 'PROJECTS_BY_STORAGE',
}

const hostQueriesByHostName = {
  [HostQuery.CPU_UTILIZATION]: _.template(`instance:node_cpu:rate:sum{instance=~'<%= host %>'}`),
  [HostQuery.MEMORY_UTILIZATION]: _.template(`node_memory_Active_bytes{instance=~'<%= host %>'}`),
  [HostQuery.MEMORY_TOTAL]: _.template(`node_memory_MemTotal_bytes{instance=~'<%= host %>'}`),
  [HostQuery.STORAGE_UTILIZATION]: _.template(
    `instance:node_filesystem_usage:sum{instance=~'<%= host %>'}`,
  ),
  [HostQuery.STORAGE_TOTAL]: _.template(`sum(node_filesystem_size_bytes{instance=~'<%= host %>'})`),
  [HostQuery.NETWORK_IN_UTILIZATION]: _.template(
    `instance:node_network_receive_bytes:rate:sum{instance=~'<%= host %>'}`,
  ),
  [HostQuery.NETWORK_OUT_UTILIZATION]: _.template(
    `instance:node_network_transmit_bytes:rate:sum{instance=~'<%= host %>'}`,
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
  [HostQuery.PODS_BY_CPU]: _.template(
    `topk(25, sort_desc(sum(rate(container_cpu_usage_seconds_total{instance=~"<%= host %>:.*",container_name="",pod!=""}[5m])) BY (pod, namespace)))`,
  ),
  [HostQuery.PROJECTS_BY_CPU]: _.template(
    `topk(25, sort_desc(sum(rate(container_cpu_usage_seconds_total{instance=~"<%= host %>:.*",container_name="",pod!=""}[5m])) BY (namespace)))`,
  ),
  [HostQuery.PODS_BY_MEMORY]: _.template(
    `topk(25, sort_desc(sum(container_memory_working_set_bytes{instance=~"<%= host %>:.*",container="",pod!=""}) BY (pod, namespace)))`,
  ),
  [HostQuery.PROJECTS_BY_MEMORY]: _.template(
    `topk(25, sort_desc(sum(container_memory_working_set_bytes{instance=~"<%= host %>:.*",container="",pod!=""}) BY (namespace)))`,
  ),
  [HostQuery.PODS_BY_STORAGE]: _.template(
    `topk(25, sort_desc(avg by (pod, namespace)(irate(container_fs_io_time_seconds_total{instance=~"<%= host %>:.*",container="POD", pod!=""}[1m]))))`,
  ),
  [HostQuery.PROJECTS_BY_STORAGE]: _.template(
    `topk(25, sort_desc(avg by (namespace)(irate(container_fs_io_time_seconds_total{instance=~"<%= host %>:.*",container="POD", pod!=""}[1m]))))`,
  ),
};

const getQuery = (host: string, query: _.TemplateExecutor, duration: string = '[60m:5m]'): string =>
  query({ host, duration });

export const getUtilizationQueries = (
  hostName: string,
  hostIP: string,
): HostUtilizationQueryType => ({
  [HostQuery.CPU_UTILIZATION]: {
    utilization: getQuery(hostName, hostQueriesByHostName[HostQuery.CPU_UTILIZATION]),
  },
  [HostQuery.MEMORY_UTILIZATION]: {
    utilization: getQuery(hostName, hostQueriesByHostName[HostQuery.MEMORY_UTILIZATION]),
    total: getQuery(hostName, hostQueriesByHostName[HostQuery.MEMORY_TOTAL]),
  },
  [HostQuery.STORAGE_UTILIZATION]: {
    utilization: getQuery(hostName, hostQueriesByHostName[HostQuery.STORAGE_UTILIZATION]),
    total: getQuery(hostName, hostQueriesByHostName[HostQuery.STORAGE_TOTAL]),
  },
  [HostQuery.NETWORK_IN_UTILIZATION]: {
    utilization: getQuery(hostName, hostQueriesByHostName[HostQuery.NETWORK_IN_UTILIZATION]),
  },
  [HostQuery.NETWORK_OUT_UTILIZATION]: {
    utilization: getQuery(hostName, hostQueriesByHostName[HostQuery.NETWORK_OUT_UTILIZATION]),
  },
  [HostQuery.NUMBER_OF_PODS]: {
    utilization: getQuery(hostIP, hostQueriesByIP[HostQuery.NUMBER_OF_PODS]),
  },
});

export const getInventoryQueries = (hostIP: string): HostQueryType => ({
  [HostQuery.NUMBER_OF_PODS]: getQuery(hostIP, hostQueriesByIP[HostQuery.NUMBER_OF_PODS_SIMPLE]),
});

type HostQueryType = {
  [key: string]: string;
};

type HostUtilizationQueryType = {
  [key: string]: { utilization: string; total?: string };
};

export const getHostQueryResultError = (result: PrometheusResponse): boolean =>
  _.get(result, 'status', '') !== 'success';

export const getTopConsumerQueries = (hostName: string, hostIP: string): HostQueryType => ({
  [HostQuery.PODS_BY_CPU]: getQuery(hostIP, hostQueriesByIP[HostQuery.PODS_BY_CPU], ''),
  [HostQuery.PROJECTS_BY_CPU]: getQuery(hostIP, hostQueriesByIP[HostQuery.PROJECTS_BY_CPU], ''),
  [HostQuery.PODS_BY_MEMORY]: getQuery(hostIP, hostQueriesByIP[HostQuery.PODS_BY_MEMORY], ''),
  [HostQuery.PROJECTS_BY_MEMORY]: getQuery(
    hostIP,
    hostQueriesByIP[HostQuery.PROJECTS_BY_MEMORY],
    '',
  ),
  [HostQuery.PODS_BY_STORAGE]: getQuery(hostIP, hostQueriesByIP[HostQuery.PODS_BY_STORAGE], ''),
  [HostQuery.PROJECTS_BY_STORAGE]: getQuery(
    hostIP,
    hostQueriesByIP[HostQuery.PROJECTS_BY_STORAGE],
    '',
  ),
});

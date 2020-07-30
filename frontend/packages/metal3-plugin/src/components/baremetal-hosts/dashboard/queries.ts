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
  NETWORK_UTILIZATION = 'NETWORK_UTILIZATION',
  NUMBER_OF_PODS = 'NUMBER_OF_PODS',
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

const nodeQueriesByNodeName = {
  [HostQuery.CPU_UTILIZATION]: _.template(`instance:node_cpu:rate:sum{instance=~'<%= node %>'}`),
  [HostQuery.MEMORY_UTILIZATION]: _.template(`node_memory_Active_bytes{instance=~'<%= node %>'}`),
  [HostQuery.MEMORY_TOTAL]: _.template(`node_memory_MemTotal_bytes{instance=~'<%= node %>'}`),
  [HostQuery.STORAGE_UTILIZATION]: _.template(
    `instance:node_filesystem_usage:sum{instance=~'<%= node %>'}`,
  ),
  [HostQuery.STORAGE_TOTAL]: _.template(`sum(node_filesystem_size_bytes{instance=~'<%= node %>'})`),
  [HostQuery.NETWORK_IN_UTILIZATION]: _.template(
    `instance:node_network_receive_bytes:rate:sum{instance=~'<%= node %>'}`,
  ),
  [HostQuery.NETWORK_OUT_UTILIZATION]: _.template(
    `instance:node_network_transmit_bytes:rate:sum{instance=~'<%= node %>'}`,
  ),
  [HostQuery.NUMBER_OF_PODS]: _.template(`kubelet_running_pod_count{node='<%= node %>'}`),
  [HostQuery.PODS_BY_CPU]: _.template(
    `topk(25, sort_desc(sum(rate(container_cpu_usage_seconds_total{node="<%= node %>",container_name="",pod!=""}[5m])) BY (pod, namespace)))`,
  ),
  [HostQuery.PROJECTS_BY_CPU]: _.template(
    `topk(25, sort_desc(sum(rate(container_cpu_usage_seconds_total{node="<%= node %>",container_name="",pod!=""}[5m])) BY (namespace)))`,
  ),
  [HostQuery.PODS_BY_MEMORY]: _.template(
    `topk(25, sort_desc(sum(container_memory_working_set_bytes{node="<%= node %>",container="",pod!=""}) BY (pod, namespace)))`,
  ),
  [HostQuery.PROJECTS_BY_MEMORY]: _.template(
    `topk(25, sort_desc(sum(container_memory_working_set_bytes{node="<%= node %>",container="",pod!=""}) BY (namespace)))`,
  ),
  [HostQuery.PODS_BY_STORAGE]: _.template(
    `topk(25, sort_desc(avg by (pod, namespace)(irate(container_fs_io_time_seconds_total{node="<%= node %>",container="POD", pod!=""}[1m]))))`,
  ),
  [HostQuery.PROJECTS_BY_STORAGE]: _.template(
    `topk(25, sort_desc(avg by (namespace)(irate(container_fs_io_time_seconds_total{node="<%= node %>",container="POD", pod!=""}[1m]))))`,
  ),
};

// TODO(jtomasek): enable and use these once ironic-exporter is available
// const nodeQueriesByHostName = {
//   [HostQuery.NUMBER_OF_FANS]: _.template(`baremetal_fan_rpm`),
//   [HostQuery.NUMBER_OF_PSUS]: _.template(`baremetal_current`),
// };

const getQuery = (node: string, query: _.TemplateExecutor): string => query({ node });

export const getUtilizationQueries = (nodeName: string): HostUtilizationQueryType => ({
  [HostQuery.CPU_UTILIZATION]: {
    utilization: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.CPU_UTILIZATION]),
  },
  [HostQuery.MEMORY_UTILIZATION]: {
    utilization: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.MEMORY_UTILIZATION]),
    total: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.MEMORY_TOTAL]),
  },
  [HostQuery.STORAGE_UTILIZATION]: {
    utilization: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.STORAGE_UTILIZATION]),
    total: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.STORAGE_TOTAL]),
  },
  [HostQuery.NUMBER_OF_PODS]: {
    utilization: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.NUMBER_OF_PODS]),
  },
});

export const getMultilineUtilizationQueries = (nodeName: string) => ({
  [HostQuery.NETWORK_UTILIZATION]: [
    {
      query: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.NETWORK_IN_UTILIZATION]),
      desc: 'in',
    },
    {
      query: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.NETWORK_OUT_UTILIZATION]),
      desc: 'out',
    },
  ],
});

type HostQueryType = {
  [key: string]: string;
};

type HostUtilizationQueryType = {
  [key: string]: { utilization: string; total?: string };
};

export const getHostQueryResultError = (result: PrometheusResponse): boolean =>
  _.get(result, 'status', '') !== 'success';

export const getTopConsumerQueries = (nodeName: string): HostQueryType => ({
  [HostQuery.PODS_BY_CPU]: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.PODS_BY_CPU]),
  [HostQuery.PROJECTS_BY_CPU]: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.PROJECTS_BY_CPU]),
  [HostQuery.PODS_BY_MEMORY]: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.PODS_BY_MEMORY]),
  [HostQuery.PROJECTS_BY_MEMORY]: getQuery(
    nodeName,
    nodeQueriesByNodeName[HostQuery.PROJECTS_BY_MEMORY],
  ),
  [HostQuery.PODS_BY_STORAGE]: getQuery(nodeName, nodeQueriesByNodeName[HostQuery.PODS_BY_STORAGE]),
  [HostQuery.PROJECTS_BY_STORAGE]: getQuery(
    nodeName,
    nodeQueriesByNodeName[HostQuery.PROJECTS_BY_STORAGE],
  ),
});

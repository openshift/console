import * as _ from 'lodash';
import { QueryWithDescription } from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';

export enum NodeQueries {
  CPU_USAGE = 'CPU_USAGE',
  CPU_TOTAL = 'CPU_TOTAL',
  MEMORY_USAGE = 'MEMORY_USAGE',
  MEMORY_TOTAL = 'MEMORY_TOTAL',
  POD_COUNT = 'POD_COUNT',
  PODS_BY_CPU = 'PODS_BY_CPU',
  PODS_BY_MEMORY = 'PODS_BY_MEMORY',
  PODS_BY_FILESYSTEM = 'PODS_BY_FILESYSTEM',
  PODS_BY_NETWORK_IN = 'PODS_BY_NETWORK_IN',
  PODS_BY_NETWORK_OUT = 'PODS_BY_NETWORK_OUT',
  FILESYSTEM_USAGE = 'FILESYSTEM_USAGE',
  FILESYSTEM_TOTAL = 'FILESYSTEM_TOTAL',
  NETWORK_IN_UTILIZATION = 'NETWORK_IN_UTILIZATION',
  NETWORK_OUT_UTILIZATION = 'NETWORK_OUT_UTILIZATION',
  NETWORK_UTILIZATION = 'NETWORK_UTILIZATION',
  POD_RESOURCE_LIMIT_CPU = 'POD_RESOURCE_LIMIT_CPU',
  POD_RESOURCE_LIMIT_MEMORY = 'POD_RESOURCE_LIMIT_MEMORY',
  POD_RESOURCE_REQUEST_CPU = 'POD_RESOURCE_REQUEST_CPU',
  POD_RESOURCE_REQUEST_MEMORY = 'POD_RESOURCE_REQUEST_MEMORY',
}

const queries = {
  [NodeQueries.CPU_USAGE]: _.template(`instance:node_cpu:rate:sum{instance='<%= node %>'}`),
  [NodeQueries.CPU_TOTAL]: _.template(`instance:node_num_cpu:sum{instance='<%= node %>'}`),
  [NodeQueries.MEMORY_USAGE]: _.template(
    `node_memory_MemTotal_bytes{instance='<%= node %>'} - node_memory_MemAvailable_bytes{instance='<%= node %>'}`,
  ),
  [NodeQueries.MEMORY_TOTAL]: _.template(`node_memory_MemTotal_bytes{instance='<%= node %>'}`),
  [NodeQueries.POD_COUNT]: _.template(`kubelet_running_pod_count{instance=~'<%= ipAddress %>:.*'}`),
  [NodeQueries.FILESYSTEM_USAGE]: _.template(
    `instance:node_filesystem_usage:sum{instance='<%= node %>'}`,
  ),
  [NodeQueries.FILESYSTEM_TOTAL]: _.template(`node_filesystem_size_bytes{instance='<%= node %>'}`),
  [NodeQueries.NETWORK_IN_UTILIZATION]: _.template(
    `instance:node_network_receive_bytes:rate:sum{instance='<%= node %>'}`,
  ),
  [NodeQueries.NETWORK_OUT_UTILIZATION]: _.template(
    `instance:node_network_transmit_bytes:rate:sum{instance='<%= node %>'}`,
  ),
};

const top25Queries = {
  [NodeQueries.PODS_BY_CPU]: _.template(
    `topk(25, sort_desc(sum(rate(container_cpu_usage_seconds_total{container="",pod!="", instance=~'<%= ipAddress %>:.*'}[5m])) by (pod, namespace)))`,
  ),
  [NodeQueries.PODS_BY_MEMORY]: _.template(
    `topk(25, sort_desc(sum(avg_over_time(container_memory_working_set_bytes{container="",pod!="",instance=~'<%= ipAddress %>:.*'}[5m])) BY (pod, namespace)))`,
  ),
  [NodeQueries.PODS_BY_FILESYSTEM]: _.template(
    `topk(25, sort_desc(sum(container_fs_usage_bytes{instance=~'<%= ipAddress %>:.*'}) BY (pod, namespace)))`,
  ),
  [NodeQueries.PODS_BY_NETWORK_IN]: _.template(
    `topk(25, sort_desc(sum(rate(container_network_receive_bytes_total{ container="POD", pod!= "", instance=~'<%= ipAddress %>:.*'}[5m])) BY (pod, namespace)))`,
  ),
  [NodeQueries.PODS_BY_NETWORK_OUT]: _.template(
    `topk(25, sort_desc(sum(rate(container_network_transmit_bytes_total{ container="POD", pod!= "", instance=~'<%= ipAddress %>:.*'}[5m])) BY (pod, namespace)))`,
  ),
};

const resourceQuotaQueries = {
  [NodeQueries.POD_RESOURCE_LIMIT_CPU]: _.template(
    `sum(kube_pod_container_resource_limits{node='<%= node %>', resource='cpu'})`,
  ),
  [NodeQueries.POD_RESOURCE_LIMIT_MEMORY]: _.template(
    `sum(kube_pod_container_resource_limits{node='<%= node %>', resource='memory'})`,
  ),
  [NodeQueries.POD_RESOURCE_REQUEST_CPU]: _.template(
    `sum(kube_pod_container_resource_requests{node='<%= node %>', resource='cpu'})`,
  ),
  [NodeQueries.POD_RESOURCE_REQUEST_MEMORY]: _.template(
    `sum(kube_pod_container_resource_requests{node='<%= node %>', resource='memory'})`,
  ),
};

export const getMultilineQueries = (node: string): { [key: string]: QueryWithDescription[] } => ({
  [NodeQueries.NETWORK_UTILIZATION]: [
    {
      query: queries[NodeQueries.NETWORK_IN_UTILIZATION]({ node }),
      desc: 'In',
    },
    {
      query: queries[NodeQueries.NETWORK_OUT_UTILIZATION]({ node }),
      desc: 'Out',
    },
  ],
});

export const getResourceQutoaQueries = (node: string) => ({
  [NodeQueries.POD_RESOURCE_LIMIT_CPU]: resourceQuotaQueries[NodeQueries.POD_RESOURCE_LIMIT_CPU]({
    node,
  }),
  [NodeQueries.POD_RESOURCE_LIMIT_MEMORY]: resourceQuotaQueries[
    NodeQueries.POD_RESOURCE_LIMIT_MEMORY
  ]({ node }),
  [NodeQueries.POD_RESOURCE_REQUEST_CPU]: resourceQuotaQueries[
    NodeQueries.POD_RESOURCE_REQUEST_CPU
  ]({
    node,
  }),
  [NodeQueries.POD_RESOURCE_REQUEST_MEMORY]: resourceQuotaQueries[
    NodeQueries.POD_RESOURCE_REQUEST_MEMORY
  ]({ node }),
});

export const getUtilizationQueries = (node: string, ipAddress: string) => ({
  [NodeQueries.CPU_USAGE]: queries[NodeQueries.CPU_USAGE]({ node }),
  [NodeQueries.CPU_TOTAL]: queries[NodeQueries.CPU_TOTAL]({ node }),
  [NodeQueries.MEMORY_USAGE]: queries[NodeQueries.MEMORY_USAGE]({ node }),
  [NodeQueries.MEMORY_TOTAL]: queries[NodeQueries.MEMORY_TOTAL]({ node }),
  [NodeQueries.POD_COUNT]: queries[NodeQueries.POD_COUNT]({ ipAddress }),
  [NodeQueries.FILESYSTEM_USAGE]: queries[NodeQueries.FILESYSTEM_USAGE]({
    node,
  }),
  [NodeQueries.FILESYSTEM_TOTAL]: queries[NodeQueries.FILESYSTEM_TOTAL]({
    node,
  }),
});

export const getTopConsumerQueries = (ipAddress: string) => ({
  [NodeQueries.PODS_BY_CPU]: top25Queries[NodeQueries.PODS_BY_CPU]({ ipAddress }),
  [NodeQueries.PODS_BY_MEMORY]: top25Queries[NodeQueries.PODS_BY_MEMORY]({ ipAddress }),
  [NodeQueries.PODS_BY_FILESYSTEM]: top25Queries[NodeQueries.PODS_BY_FILESYSTEM]({ ipAddress }),
  [NodeQueries.PODS_BY_NETWORK_IN]: top25Queries[NodeQueries.PODS_BY_NETWORK_IN]({ ipAddress }),
  [NodeQueries.PODS_BY_NETWORK_OUT]: top25Queries[NodeQueries.PODS_BY_NETWORK_OUT]({
    ipAddress,
  }),
});

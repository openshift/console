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
  PROJECTS_BY_CPU = 'PROJECTS_BY_CPU',
  PROJECTS_BY_MEMORY = 'PROJECTS_BY_MEMORY',
  PROJECTS_BY_FILESYSTEM = 'PROJECTS_BY_FILESYSTEM',
  PROJECTS_BY_NETWORK_IN = 'PROJECTS_BY_NETWORK_IN',
  PROJECTS_BY_NETWORK_OUT = 'PROJECTS_BY_NETWORK_OUT',
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
  [NodeQueries.POD_COUNT]: _.template(`kubelet_running_pods{instance=~'<%= ipAddress %>:.*'}`),
  [NodeQueries.FILESYSTEM_USAGE]: _.template(
    `sum(node_filesystem_size_bytes{instance="<%= node %>",fstype!~"tmpfs|squashfs",mountpoint!~"/usr|/var"} - node_filesystem_avail_bytes{instance="<%= node %>",fstype!~"tmpfs|squashfs",mountpoint!~"/usr|/var"})`,
  ),
  [NodeQueries.FILESYSTEM_TOTAL]: _.template(
    `node_filesystem_size_bytes{instance='<%= node %>',fstype!~"tmpfs|squashfs",mountpoint!~"/usr|/var"}`,
  ),
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
  [NodeQueries.PROJECTS_BY_CPU]: _.template(
    `topk(25, sort_desc(sum(rate(container_cpu_usage_seconds_total{container="",pod!="", instance=~'<%= ipAddress %>:.*'}[5m])) by (namespace)))`,
  ),
  [NodeQueries.PROJECTS_BY_MEMORY]: _.template(
    `topk(25, sort_desc(sum(avg_over_time(container_memory_working_set_bytes{container="",pod!="",instance=~'<%= ipAddress %>:.*'}[5m])) BY (namespace)))`,
  ),
  [NodeQueries.PROJECTS_BY_FILESYSTEM]: _.template(
    `topk(25, sort_desc(sum(container_fs_usage_bytes{instance=~'<%= ipAddress %>:.*'}) BY (namespace)))`,
  ),
  [NodeQueries.PROJECTS_BY_NETWORK_IN]: _.template(
    `topk(25, sort_desc(sum(rate(container_network_receive_bytes_total{ container="POD", pod!= "", instance=~'<%= ipAddress %>:.*'}[5m])) BY (namespace)))`,
  ),
  [NodeQueries.PROJECTS_BY_NETWORK_OUT]: _.template(
    `topk(25, sort_desc(sum(rate(container_network_transmit_bytes_total{ container="POD", pod!= "", instance=~'<%= ipAddress %>:.*'}[5m])) BY (namespace)))`,
  ),
};

const resourceQuotaQueries = {
  [NodeQueries.POD_RESOURCE_LIMIT_CPU]: _.template(
    `sum(
      max by (namespace, pod, container) (
          kube_pod_container_resource_limits_cpu_cores{node='<%= node %>', job="kube-state-metrics"}
      ) * on(namespace, pod) group_left() max by (namespace, pod) (
          kube_pod_status_phase{phase=~"Pending|Running"} == 1
      )
    )`,
  ),
  [NodeQueries.POD_RESOURCE_LIMIT_MEMORY]: _.template(
    `sum(
      max by (namespace, pod, container) (
          kube_pod_container_resource_limits_memory_bytes{node='<%= node %>', job="kube-state-metrics"}
      ) * on(namespace, pod) group_left() max by (namespace, pod) (
          kube_pod_status_phase{phase=~"Pending|Running"} == 1
      )
    )`,
  ),
  [NodeQueries.POD_RESOURCE_REQUEST_CPU]: _.template(
    `sum(
      max by (namespace, pod, container) (
          kube_pod_container_resource_requests_cpu_cores{node='<%= node %>', job="kube-state-metrics"}
      ) * on(namespace, pod) group_left() max by (namespace, pod) (
          kube_pod_status_phase{phase=~"Pending|Running"} == 1
      )
    )`,
  ),
  [NodeQueries.POD_RESOURCE_REQUEST_MEMORY]: _.template(
    `sum(
      max by (namespace, pod, container) (
          kube_pod_container_resource_requests_memory_bytes{node='<%= node %>', job="kube-state-metrics"}
      ) * on(namespace, pod) group_left() max by (namespace, pod) (
          kube_pod_status_phase{phase=~"Pending|Running"} == 1
      )
    )`,
  ),
};

export const getMultilineQueries = (node: string): { [key: string]: QueryWithDescription[] } => ({
  [NodeQueries.NETWORK_UTILIZATION]: [
    {
      query: queries[NodeQueries.NETWORK_IN_UTILIZATION]({ node }),
      desc: 'in',
    },
    {
      query: queries[NodeQueries.NETWORK_OUT_UTILIZATION]({ node }),
      desc: 'out',
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
  [NodeQueries.PROJECTS_BY_CPU]: top25Queries[NodeQueries.PROJECTS_BY_CPU]({ ipAddress }),
  [NodeQueries.PROJECTS_BY_MEMORY]: top25Queries[NodeQueries.PROJECTS_BY_MEMORY]({ ipAddress }),
  [NodeQueries.PROJECTS_BY_FILESYSTEM]: top25Queries[NodeQueries.PROJECTS_BY_FILESYSTEM]({
    ipAddress,
  }),
  [NodeQueries.PROJECTS_BY_NETWORK_IN]: top25Queries[NodeQueries.PROJECTS_BY_NETWORK_IN]({
    ipAddress,
  }),
  [NodeQueries.PROJECTS_BY_NETWORK_OUT]: top25Queries[NodeQueries.PROJECTS_BY_NETWORK_OUT]({
    ipAddress,
  }),
});

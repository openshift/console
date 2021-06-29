import * as _ from 'lodash';
import { QueryWithDescription } from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';

export enum OverviewQuery {
  MEMORY_TOTAL = 'MEMORY_TOTAL',
  MEMORY_UTILIZATION = 'MEMORY_UTILIZATION',
  MEMORY_REQUESTS = 'MEMORY_REQUESTS',
  NETWORK_UTILIZATION = 'NETWORK_UTILIZATION',
  NETWORK_IN_UTILIZATION = 'NETWORK_IN_UTILIZATION',
  NETWORK_OUT_UTILIZATION = 'NETWORK_OUT_UTILIZATION',
  CPU_UTILIZATION = 'CPU_UTILIZATION',
  CPU_TOTAL = 'CPU_TOTAL',
  CPU_REQUESTS = 'CPU_REQUESTS',
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
  [OverviewQuery.PODS_BY_CPU]: _.template(
    `
      topk(25, sort_desc(
        (
          sum(avg_over_time(pod:container_cpu_usage:sum{container="",pod!=""}[5m])) BY (pod, namespace)
          *
          on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
        )
        *
        on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
      ))
    `,
  ),
  [OverviewQuery.PODS_BY_MEMORY]: _.template(
    `
      topk(25, sort_desc(
        (
          sum(avg_over_time(container_memory_working_set_bytes{container="",pod!=""}[5m])) BY (pod, namespace)
          *
          on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
        )
        *
        on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
      ))
    `,
  ),
  [OverviewQuery.PODS_BY_STORAGE]: _.template(
    `
      topk(25, sort_desc(
        (
          sum(avg_over_time(pod:container_fs_usage_bytes:sum{container="", pod!=""}[5m])) BY (pod, namespace)
          *
          on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
        )
        *
        on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
      ))
    `,
  ),
  [OverviewQuery.PODS_BY_NETWORK_IN]: _.template(
    `
      topk(25, sort_desc(
        (
          sum(rate(container_network_receive_bytes_total{ container="POD", pod!= ""}[5m])) BY (namespace, pod)
          *
          on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
        )
        *
        on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
      ))
    `,
  ),
  [OverviewQuery.PODS_BY_NETWORK_OUT]: _.template(
    `
      topk(25, sort_desc(
        (
          sum(rate(container_network_transmit_bytes_total{ container="POD", pod!= ""}[5m])) BY (namespace, pod)
          *
          on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
        )
        *
        on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
      ))
    `,
  ),
  [OverviewQuery.NODES_BY_CPU]: _.template(
    `
      topk(25, sort_desc(
        avg_over_time(instance:node_cpu:rate:sum[5m])
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      ))
    `,
  ),
  [OverviewQuery.NODES_BY_MEMORY]: _.template(
    `
      topk(25, sort_desc(
        (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      ))
    `,
  ),
  [OverviewQuery.NODES_BY_STORAGE]: _.template(
    `
      topk(25, sort_desc(
        (
          sum by (instance) (max by (device, instance) (node_filesystem_size_bytes{device=~"/.*"}))
          -
          sum by (instance) (max by (device, instance) (node_filesystem_avail_bytes{device=~"/.*"}))
        )
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      ))
    `,
  ),
  [OverviewQuery.NODES_BY_PODS]: _.template(
    `
      topk(25, sort_desc(
        sum(avg_over_time(kubelet_running_pods[5m])) BY (node)
        *
        on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
      ))
    `,
  ),
  [OverviewQuery.NODES_BY_NETWORK_IN]: _.template(
    `
      topk(25, sort_desc(
        sum(instance:node_network_receive_bytes_excluding_lo:rate1m) BY (instance)
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      ))
    `,
  ),
  [OverviewQuery.NODES_BY_NETWORK_OUT]: _.template(
    `
      topk(25, sort_desc(
        sum(instance:node_network_transmit_bytes_excluding_lo:rate1m) BY (instance)
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      ))
    `,
  ),

  [OverviewQuery.PROJECTS_BY_CPU]: _.template(
    `
      topk(25, sort_desc(
        sum by (namespace) (
          (
            sum(avg_over_time(pod:container_cpu_usage:sum{container="",pod!=""}[5m])) BY (namespace, pod)
            *
            on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
          )
          *
          on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
        )
      ))
    `,
  ),
  [OverviewQuery.PROJECTS_BY_MEMORY]: _.template(
    `
      topk(25, sort_desc(
        sum by (namespace) (
          (
            sum(avg_over_time(container_memory_working_set_bytes{container="",pod!=""}[5m])) BY (namespace, pod)
            *
            on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
          )
          *
          on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
        )
      ))
    `,
  ),
  [OverviewQuery.PROJECTS_BY_STORAGE]: _.template(
    `
      topk(25, sort_desc(
        sum by (namespace) (
          (
            sum(avg_over_time(pod:container_fs_usage_bytes:sum{container="", pod!=""}[5m])) BY (namespace, pod)
            *
            on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
          )
          *
          on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
        )
      ))
    `,
  ),
  [OverviewQuery.PROJECTS_BY_PODS]: _.template(
    `
      topk(25, sort_desc(
        count by (namespace) (
          (
            kube_running_pod_ready
            *
            on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
          )
          *
          on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
        )
      ))
    `,
  ),
  [OverviewQuery.PROJECTS_BY_NETWORK_IN]: _.template(
    `
      topk(25, sort_desc(
        sum by (namespace) (
          (
            sum(rate(container_network_receive_bytes_total{ container="POD", pod!= ""}[5m])) BY (namespace, pod)
            *
            on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
          )
          *
          on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
        )
      ))
    `,
  ),
  [OverviewQuery.PROJECTS_BY_NETWORK_OUT]: _.template(
    `
      topk(25, sort_desc(
        sum by (namespace) (
          (
            sum(rate(container_network_transmit_bytes_total{ container="POD", pod!= ""}[5m])) BY (namespace, pod)
            *
            on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
          )
          *
          on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
        )
      ))
    `,
  ),
};

const overviewQueries = {
  [OverviewQuery.MEMORY_TOTAL]: _.template(
    `
      sum(
        node_memory_MemTotal_bytes
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      )
    `,
  ),
  [OverviewQuery.MEMORY_UTILIZATION]: _.template(
    `
      sum(
        (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      )
    `,
  ),
  [OverviewQuery.MEMORY_REQUESTS]: _.template(
    `
      sum(
        kube_pod_resource_request{resource="memory"}
        *
        on(node) group_left(role) (
          max by (node) (kube_node_role{role=~"<%= nodeType %>"})
        )
      )
    `,
  ),
  [OverviewQuery.NETWORK_UTILIZATION]: _.template(
    `
      sum(
        (
          instance:node_network_transmit_bytes_excluding_lo:rate1m
          +
          instance:node_network_receive_bytes_excluding_lo:rate1m
        )
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      )
    `,
  ),
  [OverviewQuery.CPU_UTILIZATION]: _.template(
    `
      sum(
        (
          1 - rate(node_cpu_seconds_total{mode="idle"}[2m])
          *
          on(namespace, pod) group_left(node) node_namespace_pod:kube_pod_info:{pod=~"node-exporter.+"}
        )
        *
        on(node) group_left(role) (
          max by (node) (kube_node_role{role=~"<%= nodeType %>"})
        )
      )
    `,
  ),
  [OverviewQuery.CPU_TOTAL]: _.template(
    `
      sum(
        kube_node_status_capacity{resource="cpu",unit="core"}
        *
        on(node) group_left(role) (
          max by (node) (kube_node_role{role=~"<%= nodeType %>"})
        )
      )
    `,
  ),
  [OverviewQuery.CPU_REQUESTS]: _.template(
    `
      sum(
        kube_pod_resource_request{resource="cpu"}
        *
        on(node) group_left(role) (
          max by (node) (kube_node_role{role=~"<%= nodeType %>"})
        )
      )
    `,
  ),
  [OverviewQuery.STORAGE_UTILIZATION]: _.template(
    `
      sum(
        (
          max by (device, instance) (node_filesystem_size_bytes{device=~"/.*"})
          -
          max by (device, instance) (node_filesystem_free_bytes{device=~"/.*"})
        )
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      )
    `,
  ),
  [OverviewQuery.STORAGE_TOTAL]: _.template(
    `
      sum(
        max by (device, instance) (node_filesystem_size_bytes{device=~"/.*"})
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      )
    `,
  ),
  [OverviewQuery.POD_UTILIZATION]: _.template(
    `
      count(
        (
          kube_running_pod_ready
          *
          on(pod,namespace) group_left(node) (node_namespace_pod:kube_pod_info:)
        )
        *
        on(node) group_left(role) (max by (node) (kube_node_role{role=~"<%= nodeType %>"}))
      )
    `,
  ),
  [OverviewQuery.NETWORK_IN_UTILIZATION]: _.template(
    `
      sum(
        instance:node_network_receive_bytes_excluding_lo:rate1m
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      )
    `,
  ),
  [OverviewQuery.NETWORK_OUT_UTILIZATION]: _.template(
    `
      sum(
        instance:node_network_transmit_bytes_excluding_lo:rate1m
        *
        on(instance) group_left(role) (
          label_replace(max by (node) (kube_node_role{role=~"<%= nodeType %>"}), "instance", "$1", "node", "(.*)")
        )
      )
    `,
  ),
};

export const getMultilineQueries = (
  nodeType: string,
): { [key: string]: QueryWithDescription[] } => ({
  [OverviewQuery.NETWORK_UTILIZATION]: [
    {
      query: overviewQueries[OverviewQuery.NETWORK_IN_UTILIZATION]({ nodeType }),
      desc: 'in',
    },
    {
      query: overviewQueries[OverviewQuery.NETWORK_OUT_UTILIZATION]({ nodeType }),
      desc: 'out',
    },
  ],
});

export const getTop25ConsumerQueries = (nodeType: string) => ({
  [OverviewQuery.PODS_BY_CPU]: top25Queries[OverviewQuery.PODS_BY_CPU]({ nodeType }),
  [OverviewQuery.PODS_BY_MEMORY]: top25Queries[OverviewQuery.PODS_BY_MEMORY]({ nodeType }),
  [OverviewQuery.PODS_BY_STORAGE]: top25Queries[OverviewQuery.PODS_BY_STORAGE]({ nodeType }),
  [OverviewQuery.PODS_BY_NETWORK_IN]: top25Queries[OverviewQuery.PODS_BY_NETWORK_IN]({ nodeType }),
  [OverviewQuery.PODS_BY_NETWORK_OUT]: top25Queries[OverviewQuery.PODS_BY_NETWORK_OUT]({
    nodeType,
  }),
  [OverviewQuery.NODES_BY_CPU]: top25Queries[OverviewQuery.NODES_BY_CPU]({ nodeType }),
  [OverviewQuery.NODES_BY_MEMORY]: top25Queries[OverviewQuery.NODES_BY_MEMORY]({ nodeType }),
  [OverviewQuery.NODES_BY_STORAGE]: top25Queries[OverviewQuery.NODES_BY_STORAGE]({ nodeType }),
  [OverviewQuery.NODES_BY_PODS]: top25Queries[OverviewQuery.NODES_BY_PODS]({ nodeType }),
  [OverviewQuery.NODES_BY_NETWORK_IN]: top25Queries[OverviewQuery.NODES_BY_NETWORK_IN]({
    nodeType,
  }),
  [OverviewQuery.NODES_BY_NETWORK_OUT]: top25Queries[OverviewQuery.NODES_BY_NETWORK_OUT]({
    nodeType,
  }),
  [OverviewQuery.PROJECTS_BY_CPU]: top25Queries[OverviewQuery.PROJECTS_BY_CPU]({ nodeType }),
  [OverviewQuery.PROJECTS_BY_MEMORY]: top25Queries[OverviewQuery.PROJECTS_BY_MEMORY]({ nodeType }),
  [OverviewQuery.PROJECTS_BY_STORAGE]: top25Queries[OverviewQuery.PROJECTS_BY_STORAGE]({
    nodeType,
  }),
  [OverviewQuery.PROJECTS_BY_PODS]: top25Queries[OverviewQuery.PROJECTS_BY_PODS]({ nodeType }),
  [OverviewQuery.PROJECTS_BY_NETWORK_IN]: top25Queries[OverviewQuery.PROJECTS_BY_NETWORK_IN]({
    nodeType,
  }),
  [OverviewQuery.PROJECTS_BY_NETWORK_OUT]: top25Queries[OverviewQuery.PROJECTS_BY_NETWORK_OUT]({
    nodeType,
  }),
});

export const getUtilizationQueries = (nodeType: string) => ({
  [OverviewQuery.CPU_UTILIZATION]: {
    utilization: overviewQueries[OverviewQuery.CPU_UTILIZATION]({ nodeType }),
    total: overviewQueries[OverviewQuery.CPU_TOTAL]({ nodeType }),
    requests: overviewQueries[OverviewQuery.CPU_REQUESTS]({ nodeType }),
  },
  [OverviewQuery.MEMORY_UTILIZATION]: {
    utilization: overviewQueries[OverviewQuery.MEMORY_UTILIZATION]({ nodeType }),
    total: overviewQueries[OverviewQuery.MEMORY_TOTAL]({ nodeType }),
    requests: overviewQueries[OverviewQuery.MEMORY_REQUESTS]({ nodeType }),
  },
  [OverviewQuery.STORAGE_UTILIZATION]: {
    utilization: overviewQueries[OverviewQuery.STORAGE_UTILIZATION]({ nodeType }),
    total: overviewQueries[OverviewQuery.STORAGE_TOTAL]({ nodeType }),
  },
  [OverviewQuery.POD_UTILIZATION]: {
    utilization: overviewQueries[OverviewQuery.POD_UTILIZATION]({ nodeType }),
  },
});

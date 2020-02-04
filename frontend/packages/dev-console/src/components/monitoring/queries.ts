import * as _ from 'lodash';
import { GraphTypes } from './dashboard/MonitoringDashboardGraph';
import {
  Humanize,
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';

export interface MonitoringQuery {
  query: _.TemplateExecutor;
  chartType: GraphTypes;
  title: string;
  humanize: Humanize;
  byteDataType: ByteDataTypes;
}

export const metricsQuery = {
  PODS_BY_CPU: 'PODS_BY_CPU',
  PODS_BY_MEMORY: 'PODS_BY_MEMORY',
  PODS_BY_FILESYSTEM: 'PODS_BY_FILESYSTEM',
  PODS_BY_NETWORK: 'PODS_BY_NETWORK',
  PODS_BY_STORAGE: 'PODS_BY_STORAGE',
};

const topMetricsQueries = {
  [metricsQuery.PODS_BY_CPU]: _.template(
    `topk(25, sort_desc(sum(avg_over_time(pod:container_cpu_usage:sum{container="",pod!="",namespace='<%= namespace %>'}[5m])) BY (pod, namespace)))`,
  ),
  [metricsQuery.PODS_BY_MEMORY]: _.template(
    `topk(25, sort_desc(sum(avg_over_time(container_memory_working_set_bytes{container="",pod!="",namespace='<%= namespace %>'}[5m])) BY (pod, namespace)))`,
  ),
  [metricsQuery.PODS_BY_FILESYSTEM]: _.template(
    `topk(25, sort_desc(sum(pod:container_fs_usage_bytes:sum{container="",pod!="",namespace='<%= namespace %>'}) BY (pod, namespace)))`,
  ),
  [metricsQuery.PODS_BY_NETWORK]: _.template(
    `topk(25, sort_desc(sum(rate(container_network_receive_bytes_total{ container="POD", pod!= "", namespace = '<%= namespace %>'}[5m]) + rate(container_network_transmit_bytes_total{ container="POD", pod!= "", namespace = '<%= namespace %>'}[5m])) BY (namespace, pod)))`,
  ),
  [metricsQuery.PODS_BY_STORAGE]: _.template(
    `topk(25, sort_desc(sum(avg_over_time(pod:container_fs_usage_bytes:sum{container="", pod!="", namespace='<%= namespace %>'}[5m])) BY (pod, namespace)))`,
  ),
};

export const getTopMetricsQueries = (namespace: string) => ({
  [metricsQuery.PODS_BY_CPU]: topMetricsQueries[metricsQuery.PODS_BY_CPU]({ namespace }),
  [metricsQuery.PODS_BY_MEMORY]: topMetricsQueries[metricsQuery.PODS_BY_MEMORY]({ namespace }),
  [metricsQuery.PODS_BY_FILESYSTEM]: topMetricsQueries[metricsQuery.PODS_BY_FILESYSTEM]({
    namespace,
  }),
  [metricsQuery.PODS_BY_NETWORK]: topMetricsQueries[metricsQuery.PODS_BY_NETWORK]({ namespace }),
  [metricsQuery.PODS_BY_STORAGE]: topMetricsQueries[metricsQuery.PODS_BY_STORAGE]({ namespace }),
});

export const monitoringDashboardQueries: MonitoringQuery[] = [
  {
    query: _.template(
      `topk(25, sort_desc(sum(avg_over_time(pod:container_cpu_usage:sum{container="",pod!="",namespace='<%= namespace %>'}[5m])) BY (pod, namespace)))`,
    ),
    chartType: GraphTypes.area,
    title: 'CPU Usage',
    humanize: humanizeCpuCores,
    byteDataType: ByteDataTypes.BinaryBytes,
  },
  {
    query: _.template(
      `topk(25, sort_desc(sum(avg_over_time(container_memory_working_set_bytes{container="",pod!="",namespace='<%= namespace %>'}[5m])) BY (pod, namespace)))`,
    ),
    chartType: GraphTypes.area,
    title: 'Memory Usage',
    humanize: humanizeBinaryBytes,
    byteDataType: ByteDataTypes.BinaryBytes,
  },
  {
    query: _.template(
      `topk(25, sort_desc(sum(pod:container_fs_usage_bytes:sum{container="",pod!="",namespace='<%= namespace %>'}) BY (pod, namespace)))`,
    ),
    chartType: GraphTypes.line,
    title: 'Filesystem Usage',
    humanize: humanizeBinaryBytes,
    byteDataType: ByteDataTypes.BinaryBytes,
  },
  {
    query: _.template(
      `topk(25, sort_desc(sum(rate(container_network_receive_bytes_total{ container="POD", pod!= "", namespace = '<%= namespace %>'}[5m]) + rate(container_network_transmit_bytes_total{ container="POD", pod!= "", namespace = '<%= namespace %>'}[5m])) BY (namespace, pod)))`,
    ),
    chartType: GraphTypes.line,
    title: 'Network Received ',
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.BinaryBytes,
  },
];

export const topWorkloadMetricsQueries: MonitoringQuery[] = [
  {
    title: 'CPU Usage',
    chartType: GraphTypes.line,
    humanize: humanizeCpuCores,
    byteDataType: ByteDataTypes.BinaryBytes,
    query: _.template(
      `sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate{cluster='', namespace='<%= namespace %>'}
          * on(namespace,pod) group_left(workload, workload_type) mixin_pod_workload{cluster='',
          namespace='<%= namespace %>', workload='<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Memory Usage',
    chartType: GraphTypes.line,
    humanize: humanizeBinaryBytes,
    byteDataType: ByteDataTypes.BinaryBytes,
    query: _.template(
      `sum(container_memory_working_set_bytes{cluster='', namespace='<%= namespace %>', container!=""}
          * on(namespace,pod) group_left(workload, workload_type) mixin_pod_workload{cluster='',
          namespace='<%= namespace %>', workload='<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Receive Bandwidth',
    chartType: GraphTypes.line,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_receive_bytes_total{cluster="", namespace=~'<%= namespace %>'}[4h])
          * on (namespace,pod) group_left(workload,workload_type) mixin_pod_workload{cluster="",
          namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
];

export const workloadMetricsQueries: MonitoringQuery[] = [
  {
    title: 'Transmit Bandwidth',
    chartType: GraphTypes.line,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_receive_bytes_total{cluster="", namespace=~'<%= namespace %>'}[4h])
         * on (namespace,pod) group_left(workload,workload_type) mixin_pod_workload{cluster="",
         namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Average Container Bandwidth by Pod: Received',
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `avg(irate(container_network_receive_bytes_total{cluster="", namespace=~'<%= namespace %>'}[4h])* on (namespace,pod)group_left(workload,workload_type) mixin_pod_workload{cluster="", namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Average Container Bandwidth by Pod: Transmitted',
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `avg(irate(container_network_transmit_bytes_total{cluster="", namespace=~'<%= namespace %>'}[4h])* on (namespace,pod)group_left(workload,workload_type) mixin_pod_workload{cluster="", namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Rate of Received Packets',
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_receive_packets_total{cluster="", namespace=~'<%= namespace %>'}[4h])* on (namespace,pod)group_left(workload,workload_type) mixin_pod_workload{cluster="", namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Rate of Transmitted Packets',
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_transmit_packets_total{cluster="", namespace=~'<%= namespace %>'}[4h])* on (namespace,pod)group_left(workload,workload_type) mixin_pod_workload{cluster="", namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Rate of Received Packets Dropped',
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_receive_packets_dropped_total{cluster="", namespace=~'<%= namespace %>'}[4h])* on (namespace,pod) group_left(workload,workload_type) mixin_pod_workload{cluster="", namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Rate of Transmitted Packets Dropped',
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_transmit_packets_dropped_total{cluster="", namespace=~'<%= namespace %>'}[4h])* on (namespace,pod)
      group_left(workload,workload_type) mixin_pod_workload{cluster="", namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)
      `,
    ),
  },
];

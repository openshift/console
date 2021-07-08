import { TFunction } from 'i18next';
import * as _ from 'lodash';
import {
  Humanize,
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { GraphTypes } from './dashboard/MonitoringDashboardGraph';

export interface MonitoringQuery {
  query: _.TemplateExecutor;
  chartType: GraphTypes;
  title: string;
  humanize: Humanize;
  byteDataType: ByteDataTypes;
  id?: string;
}

export const metricsQuery = (t: TFunction) => ({
  PODS_BY_CPU: t('devconsole~CPU usage'),
  PODS_BY_MEMORY: t('devconsole~Memory usage'),
  PODS_BY_FILESYSTEM: t('devconsole~Filesystem usage'),
  PODS_BY_NETWORK_IN: t('devconsole~Receive bandwidth'),
  PODS_BY_NETWORK_OUT: t('devconsole~Transmit bandwidth'),
  RATE_OF_RECEIVED_PACKETS: t('devconsole~Rate of received packets'),
  RATE_OF_TRANSMITTED_PACKETS: t('devconsole~Rate of transmitted packets'),
  RATE_OF_RECEIVED_PACKETS_DROPPED: t('devconsole~Rate of received packets dropped'),
  RATE_OF_TRANSMITTED_PACKETS_DROPPED: t('devconsole~Rate of transmitted packets dropped'),
});

export const monitoringDashboardQueries = (t: TFunction): MonitoringQuery[] => [
  {
    query: _.template(
      `sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{namespace='<%= namespace %>'}) by (pod)`,
    ),
    chartType: GraphTypes.area,
    title: t('devconsole~CPU usage'),
    humanize: humanizeCpuCores,
    byteDataType: ByteDataTypes.BinaryBytes,
    id: 'cpu_usage',
  },
  {
    query: _.template(
      `sum(container_memory_working_set_bytes{container!="", namespace='<%= namespace %>'}) by (pod)`,
    ),
    chartType: GraphTypes.area,
    title: t('devconsole~Memory usage'),
    humanize: humanizeBinaryBytes,
    byteDataType: ByteDataTypes.BinaryBytes,
    id: 'memory_usage',
  },
  {
    query: _.template(
      `sum(irate(container_network_receive_bytes_total{namespace='<%= namespace %>'}[2h])) by (pod)`,
    ),
    chartType: GraphTypes.area,
    title: t('devconsole~Receive bandwidth'),
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.BinaryBytes,
    id: 'receive_bandwidth',
  },
  {
    query: _.template(
      `sum(irate(container_network_transmit_bytes_total{namespace='<%= namespace %>'}[2h])) by (pod)`,
    ),
    chartType: GraphTypes.area,
    title: t('devconsole~Transmit bandwidth'),
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.BinaryBytes,
    id: 'transmit_bandwidth',
  },
  {
    query: _.template(
      `sum(irate(container_network_receive_packets_total{namespace='<%= namespace %>'}[2h])) by (pod)`,
    ),
    chartType: GraphTypes.area,
    title: t('devconsole~Rate of received packets'),
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.BinaryBytes,
    id: 'rate_of_received_packets',
  },
  {
    query: _.template(
      `sum(irate(container_network_transmit_packets_total{namespace='<%= namespace %>'}[2h])) by (pod)`,
    ),
    chartType: GraphTypes.area,
    title: t('devconsole~Rate of transmitted packets'),
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.BinaryBytes,
    id: 'rate_of_transmitted_packets',
  },
  {
    query: _.template(
      `sum(irate(container_network_receive_packets_dropped_total{namespace='<%= namespace %>'}[2h])) by (pod)`,
    ),
    chartType: GraphTypes.area,
    title: t('devconsole~Rate of received packets dropped'),
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.BinaryBytes,
    id: 'rate_of_received_packets_dropped',
  },
  {
    query: _.template(
      `sum(irate(container_network_transmit_packets_dropped_total{namespace='<%= namespace %>'}[2h])) by (pod)`,
    ),
    chartType: GraphTypes.area,
    title: t('devconsole~Rate of transmitted packets dropped'),
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.BinaryBytes,
    id: 'rate_of_transmitted_packets_dropped',
  },
];

export const topWorkloadMetricsQueries = (t: TFunction): MonitoringQuery[] => [
  {
    title: t('devconsole~CPU usage'),
    chartType: GraphTypes.area,
    humanize: humanizeCpuCores,
    byteDataType: ByteDataTypes.BinaryBytes,
    query: _.template(
      `sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{namespace='<%= namespace %>'}
          * on(namespace,pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{
          namespace='<%= namespace %>', workload='<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: t('devconsole~Memory usage'),
    chartType: GraphTypes.area,
    humanize: humanizeBinaryBytes,
    byteDataType: ByteDataTypes.BinaryBytes,
    query: _.template(
      `sum(container_memory_working_set_bytes{namespace='<%= namespace %>', container!=""}
          * on(namespace,pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{
          namespace='<%= namespace %>', workload='<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: t('devconsole~Receive bandwidth'),
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_receive_bytes_total{namespace=~'<%= namespace %>'}[4h])
          * on (namespace,pod) group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{
          namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
];

export const workloadMetricsQueries = (t: TFunction): MonitoringQuery[] => [
  {
    title: t('devconsole~Transmit bandwidth'),
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_receive_bytes_total{namespace=~'<%= namespace %>'}[4h])
         * on (namespace,pod) group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{
         namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: t('devconsole~Rate of received packets'),
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_receive_packets_total{namespace=~'<%= namespace %>'}[4h])* on (namespace,pod)group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: t('devconsole~Rate of transmitted packets'),
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_transmit_packets_total{namespace=~'<%= namespace %>'}[4h])* on (namespace,pod)group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: t('devconsole~Rate of received packets dropped'),
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_receive_packets_dropped_total{namespace=~'<%= namespace %>'}[4h])* on (namespace,pod) group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: t('devconsole~Rate of transmitted packets dropped'),
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `sum(irate(container_network_transmit_packets_dropped_total{namespace=~'<%= namespace %>'}[4h])* on (namespace,pod)
      group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)
      `,
    ),
  },
  {
    title: t('devconsole~Average Container bandwidth by Pod: received'),
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `avg(irate(container_network_receive_bytes_total{namespace=~'<%= namespace %>'}[4h])* on (namespace,pod)group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: t('devconsole~Average Container bandwidth by Pod: transmitted'),
    chartType: GraphTypes.area,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: _.template(
      `avg(irate(container_network_transmit_bytes_total{namespace=~'<%= namespace %>'}[4h])* on (namespace,pod)group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace=~'<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
];

const getMetricsQuery = (id: string, t: TFunction): _.TemplateExecutor => {
  const queryObject = _.find(monitoringDashboardQueries(t), (q) => q.id === id);
  return queryObject?.query;
};

const topMetricsQueries = (t: TFunction) => ({
  PODS_BY_CPU: getMetricsQuery('cpu_usage', t),
  PODS_BY_MEMORY: getMetricsQuery('memory_usage', t),
  PODS_BY_FILESYSTEM: _.template(
    `topk(25, sort_desc(sum(pod:container_fs_usage_bytes:sum{container="",pod!="",namespace='<%= namespace %>'}) BY (pod, namespace)))`,
  ),
  PODS_BY_NETWORK_IN: getMetricsQuery('receive_bandwidth', t),
  PODS_BY_NETWORK_OUT: getMetricsQuery('transmit_bandwidth', t),
  RATE_OF_RECEIVED_PACKETS: getMetricsQuery('rate_of_received_packets', t),
  RATE_OF_TRANSMITTED_PACKETS: getMetricsQuery('rate_of_transmitted_packets', t),
  RATE_OF_RECEIVED_PACKETS_DROPPED: getMetricsQuery('rate_of_received_packets_dropped', t),
  RATE_OF_TRANSMITTED_PACKETS_DROPPED: getMetricsQuery('rate_of_transmitted_packets_dropped', t),
});

export const getTopMetricsQueries = (namespace: string, t: TFunction) => ({
  [metricsQuery(t).PODS_BY_CPU]: topMetricsQueries(t).PODS_BY_CPU({ namespace }),
  [metricsQuery(t).PODS_BY_MEMORY]: topMetricsQueries(t).PODS_BY_MEMORY({ namespace }),
  [metricsQuery(t).PODS_BY_FILESYSTEM]: topMetricsQueries(t).PODS_BY_FILESYSTEM({
    namespace,
  }),
  [metricsQuery(t).PODS_BY_NETWORK_IN]: topMetricsQueries(t).PODS_BY_NETWORK_IN({
    namespace,
  }),
  [metricsQuery(t).PODS_BY_NETWORK_OUT]: topMetricsQueries(t).PODS_BY_NETWORK_OUT({
    namespace,
  }),
  [metricsQuery(t).RATE_OF_RECEIVED_PACKETS]: topMetricsQueries(t).RATE_OF_RECEIVED_PACKETS({
    namespace,
  }),
  [metricsQuery(t).RATE_OF_TRANSMITTED_PACKETS]: topMetricsQueries(t).RATE_OF_TRANSMITTED_PACKETS({
    namespace,
  }),
  [metricsQuery(t).RATE_OF_RECEIVED_PACKETS_DROPPED]: topMetricsQueries(
    t,
  ).RATE_OF_RECEIVED_PACKETS_DROPPED({
    namespace,
  }),
  [metricsQuery(t).RATE_OF_TRANSMITTED_PACKETS_DROPPED]: topMetricsQueries(
    t,
  ).RATE_OF_TRANSMITTED_PACKETS_DROPPED({
    namespace,
  }),
});

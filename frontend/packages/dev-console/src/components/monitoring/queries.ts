import type { TFunction } from 'i18next';
import * as _ from 'lodash';
import type { Humanize } from '@console/internal/components/utils';
import {
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
  id?: string;
}

export enum GraphTypes {
  area = 'Area',
  line = 'Line',
}

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
      `sum(irate(container_network_receive_bytes_total{namespace='<%= namespace %>'}[4h])
          * on (namespace,pod) group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{
          namespace='<%= namespace %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
];

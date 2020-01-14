import { template } from 'lodash';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { GraphTypes } from '../dashboard/MonitoringDashboardGraph';

export const workloadMetricQueries = [
  {
    title: 'CPU Usage',
    chartType: GraphTypes.line,
    humanize: humanizeCpuCores,
    byteDataType: ByteDataTypes.BinaryBytes,
    query: template(
      `sum(
          node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate{cluster='', namespace='<%= ns %>'}
          * on(namespace,pod) group_left(workload, workload_type) mixin_pod_workload{cluster='', 
          namespace='<%= ns %>', workload='<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Memory Usage',
    chartType: GraphTypes.line,
    humanize: humanizeBinaryBytes,
    byteDataType: ByteDataTypes.BinaryBytes,
    query: template(
      `sum(container_memory_working_set_bytes{cluster='', namespace='<%= ns %>', container!=""} 
          * on(namespace,pod) group_left(workload, workload_type) mixin_pod_workload{cluster='', 
          namespace='<%= ns %>', workload='<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Receive Bandwidth',
    chartType: GraphTypes.line,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: template(
      `sum(irate(container_network_receive_bytes_total{cluster="", namespace=~'<%= ns %>'}[4h]) 
          * on (namespace,pod) group_left(workload,workload_type) mixin_pod_workload{cluster="", 
          namespace=~'<%= ns %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
  {
    title: 'Transmit Bandwidth',
    chartType: GraphTypes.line,
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.DecimalBytes,
    query: template(
      `sum(irate(container_network_receive_bytes_total{cluster="", namespace=~'<%= ns %>'}[4h])
         * on (namespace,pod) group_left(workload,workload_type) mixin_pod_workload{cluster="", 
         namespace=~'<%= ns %>', workload=~'<%= workloadName %>', workload_type='<%= workloadType %>'}) by (pod)`,
    ),
  },
];

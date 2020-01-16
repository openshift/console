import { template, TemplateExecutor } from 'lodash';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
  Humanize,
} from '@console/internal/components/utils';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { GraphTypes } from './MonitoringDashboardGraph';

interface MonitoringQuery {
  query: TemplateExecutor;
  chartType: GraphTypes;
  title: string;
  humanize: Humanize;
  byteDataType: ByteDataTypes;
}

export const queries: MonitoringQuery[] = [
  {
    query: template(
      `topk(25, sort_desc(sum(avg_over_time(pod:container_cpu_usage:sum{container="",pod!="",namespace='<%= namespace %>'}[5m])) BY (pod, namespace)))`,
    ),
    chartType: GraphTypes.area,
    title: 'Stat 1',
    humanize: humanizeCpuCores,
    byteDataType: ByteDataTypes.BinaryBytes,
  },
  {
    query: template(
      `topk(25, sort_desc(sum(avg_over_time(container_memory_working_set_bytes{container="",pod!="",namespace='<%= namespace %>'}[5m])) BY (pod, namespace)))`,
    ),
    chartType: GraphTypes.area,
    title: 'Stat 2',
    humanize: humanizeBinaryBytes,
    byteDataType: ByteDataTypes.BinaryBytes,
  },
  {
    query: template(
      `topk(25, sort_desc(sum(pod:container_fs_usage_bytes:sum{container="",pod!="",namespace='<%= namespace %>'}) BY (pod, namespace)))`,
    ),
    chartType: GraphTypes.line,
    title: 'Stat 3',
    humanize: humanizeBinaryBytes,
    byteDataType: ByteDataTypes.BinaryBytes,
  },
  {
    query: template(
      `topk(25, sort_desc(sum(rate(container_network_receive_bytes_total{ container="POD", pod!= "", namespace = '<%= namespace %>'}[5m]) + rate(container_network_transmit_bytes_total{ container="POD", pod!= "", namespace = '<%= namespace %>'}[5m])) BY (namespace, pod)))`,
    ),
    chartType: GraphTypes.line,
    title: 'Stat 4',
    humanize: humanizeDecimalBytesPerSec,
    byteDataType: ByteDataTypes.BinaryBytes,
  },
];

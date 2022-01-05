import * as _ from 'lodash';
import { TopConsumerMetric as Metric } from '../../../constants/virt-overview/top-consumers-card/top-consumer-metric';
import { TopConsumerScope as Scope } from '../../../constants/virt-overview/top-consumers-card/top-consumer-scope';

const topConsumerQueries = {
  [Scope.PROJECT.getValue()]: {
    [Metric.CPU.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(container_cpu_usage_seconds_total{container="compute",pod=~"virt-launcher-.*"}[5m])) by (namespace))) > 0`,
    ),
    [Metric.MEMORY.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(kubevirt_vmi_memory_available_bytes-kubevirt_vmi_memory_usable_bytes) by (namespace))) > 0`,
    ),
    [Metric.FILESYSTEM.getValue()]: _.template(
      `sort_desc(sum(topk(<%= numItemsToShow %>, container_fs_usage_bytes{pod=~".*virt-launcher.*"})) by (namespace)) > 0`,
    ),
    [Metric.MEMORY_SWAP.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(kubevirt_vmi_memory_swap_in_traffic_bytes_total-kubevirt_vmi_memory_swap_out_traffic_bytes_total) by (namespace))) > 0`,
    ),
    [Metric.VCPU_WAIT.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(kubevirt_vmi_vcpu_wait_seconds[4h])) by (namespace))) > 0`,
    ),
    [Metric.STORAGE_THROUGHPUT.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(kubevirt_vmi_storage_read_traffic_bytes_total[4h]) + rate(kubevirt_vmi_storage_write_traffic_bytes_total[4h])) by (namespace))) > 0`,
    ),
    [Metric.STORAGE_IOPS.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(kubevirt_vmi_storage_iops_read_total[4h]) + rate(kubevirt_vmi_storage_iops_write_total[4h])) by (namespace))) > 0`,
    ),
  },
  [Scope.VM.getValue()]: {
    [Metric.CPU.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(container_cpu_usage_seconds_total{container="compute",pod=~"virt-launcher-.*"}[5m])) by (pod, namespace, label_vm_kubevirt_io_name))) + on (pod, namespace) group_left(label_vm_kubevirt_io_name) (0 * topk by (pod,namespace) ( 1,kube_pod_labels{pod=~".*virt-launcher.*"} )) > 0`,
    ),
    [Metric.MEMORY.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(kubevirt_vmi_memory_available_bytes-kubevirt_vmi_memory_usable_bytes) by(name, namespace))) > 0`,
    ),
    [Metric.FILESYSTEM.getValue()]: _.template(
      `sort_desc(sum(topk(<%= numItemsToShow %>, avg_over_time(container_fs_usage_bytes{pod=~".*virt-launcher.*"}[4h]))) by (pod, namespace, label_vm_kubevirt_io_name)) + on (pod, namespace) group_left(label_vm_kubevirt_io_name) ( 0 * topk by (pod,namespace) (1, kube_pod_labels{pod=~".*virt-launcher.*"} )) > 0`,
    ),
    [Metric.MEMORY_SWAP.getValue()]: _.template(
      `sort_desc(topk (<%= numItemsToShow %>, sum(kubevirt_vmi_memory_swap_in_traffic_bytes_total-kubevirt_vmi_memory_swap_out_traffic_bytes_total) by(name, namespace))) > 0`,
    ),
    [Metric.VCPU_WAIT.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(kubevirt_vmi_vcpu_wait_seconds[4h])) by (namespace, name))) > 0`,
    ),
    [Metric.STORAGE_THROUGHPUT.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(kubevirt_vmi_storage_read_traffic_bytes_total[4h]) + rate(kubevirt_vmi_storage_write_traffic_bytes_total[4h])) by (namespace, name))) > 0`,
    ),
    [Metric.STORAGE_IOPS.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(kubevirt_vmi_storage_iops_read_total[4h]) + rate(kubevirt_vmi_storage_iops_write_total[4h])) by (namespace, name))) > 0`,
    ),
  },
  [Scope.NODE.getValue()]: {
    [Metric.CPU.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(container_cpu_usage_seconds_total{container="compute",pod=~"virt-launcher-.*"}[5m])) by (node))) > 0`,
    ),
    [Metric.MEMORY.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(kubevirt_vmi_memory_available_bytes-kubevirt_vmi_memory_usable_bytes) by(node))) > 0`,
    ),
    [Metric.FILESYSTEM.getValue()]: _.template(
      `sort_desc(sum(topk(<%= numItemsToShow %>, container_fs_usage_bytes{pod=~".*virt-launcher.*"})) by (node)) > 0`,
    ),
    [Metric.MEMORY_SWAP.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(kubevirt_vmi_memory_swap_in_traffic_bytes_total-kubevirt_vmi_memory_swap_out_traffic_bytes_total) by (node))) > 0`,
    ),
    [Metric.VCPU_WAIT.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(kubevirt_vmi_vcpu_wait_seconds[4h])) by (node))) > 0`,
    ),
    [Metric.STORAGE_THROUGHPUT.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(kubevirt_vmi_storage_read_traffic_bytes_total[4h]) + rate(kubevirt_vmi_storage_write_traffic_bytes_total[4h])) by (node))) > 0`,
    ),
    [Metric.STORAGE_IOPS.getValue()]: _.template(
      `sort_desc(topk(<%= numItemsToShow %>, sum(rate(kubevirt_vmi_storage_iops_read_total[4h]) + rate(kubevirt_vmi_storage_iops_write_total[4h])) by (node))) > 0`,
    ),
  },
};

export const getTopConsumerQuery = (metric, scope, numItemsToShow) => {
  const numItems = numItemsToShow || 5;
  return topConsumerQueries[scope][metric]({ numItemsToShow: numItems });
};

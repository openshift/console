import { PodModel } from '@console/internal/models';

export const API_SERVERS_UP = '(sum(up{job="apiserver"} == 1) / count(up{job="apiserver"})) * 100';
export const CONTROLLER_MANAGERS_UP =
  '(sum(up{job="kube-controller-manager"} == 1) / count(up{job="kube-controller-manager"})) * 100';
export const SCHEDULERS_UP = '(sum(up{job="scheduler"} == 1) / count(up{job="scheduler"})) * 100';
export const API_SERVER_REQUESTS_SUCCESS =
  '(1 - (sum(rate(apiserver_request_count{code=~"5.."}[5m])) or vector(0))/ sum(rate(apiserver_request_count[5m]))) * 100';

export const enum Condition {
  DISK_PRESSURE = 'DiskPressure',
  PID_PRESSURE = 'PIDPressure',
  MEM_PRESSURE = 'MemoryPressure',
}

export const PressureQueries = {
  [Condition.DISK_PRESSURE]: (node: string) => [
    {
      model: PodModel,
      fieldSelector: `spec.nodeName=${node}`,
      metric: 'pod',
      query: `(sort_desc(topk(25,sum by(pod, namespace) (container_fs_reads_total{node="${node}"}))))`,
    },
  ],

  [Condition.MEM_PRESSURE]: (node: string) => [
    {
      model: PodModel,
      fieldSelector: `spec.nodeName=${node}`,
      metric: 'pod',
      query: `(sort_desc(topk(25,sum by(pod, namespace) (container_memory_usage_bytes{node="${node}"}))))`,
    },
  ],

  [Condition.PID_PRESSURE]: (node: string) => [
    {
      model: PodModel,
      fieldSelector: `spec.nodeName=${node}`,
      metric: 'pod',
      query: `(sort_desc(topk(25,sum by(pod, namespace) (container_processes{node="${node}"}))))`,
    },
  ],
};

import { PodModel } from '@console/internal/models';

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
      query: `(sort_desc(topk(25,sum by(pod, namespace) (container_memory_working_set_bytes{node="${node}", container=""}))))`,
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

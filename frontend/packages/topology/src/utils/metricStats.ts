import { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import { NamespaceMetrics } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { formatBytesAsMiB, formatCores } from '@console/dynamic-plugin-sdk/src/topology/utils';
import { PodRCData } from '@console/shared/src';

export type PodStats = {
  name: string;
  value: number;
  formattedValue: string;
};

export type MetricStats = {
  totalBytes?: number;
  totalCores?: number;
  memoryByPod?: PodStats[];
  cpuByPod?: PodStats[];
};

export const getPodMetricStats = (metrics: NamespaceMetrics, podData: PodRCData): MetricStats => {
  const currentPods = podData.current ? podData.current.pods : podData.pods;
  let totalBytes = 0;
  let totalCores = 0;
  const memoryByPod = [];
  const cpuByPod = [];
  if (currentPods?.length) {
    currentPods.forEach(({ metadata: { name } }: K8sResourceKind) => {
      const bytes = metrics?.memory?.[name];
      if (Number.isFinite(bytes)) {
        totalBytes += bytes;
        const formattedValue = `${formatBytesAsMiB(bytes)} MiB`;
        memoryByPod.push({ name, value: bytes, formattedValue });
      }

      const cores = metrics?.cpu?.[name];
      if (Number.isFinite(cores)) {
        totalCores += cores;
        cpuByPod[name] = `${formatCores(cores)} cores`;
        const formattedValue = `${formatCores(cores)} cores`;
        cpuByPod.push({ name, value: cores, formattedValue });
      }
    });
  }
  return { totalBytes, totalCores, memoryByPod, cpuByPod };
};

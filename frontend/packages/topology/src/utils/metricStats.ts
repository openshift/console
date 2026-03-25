import type { GetPodMetricStats } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { formatBytesAsMiB, formatCores } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';

export const getPodMetricStats: GetPodMetricStats = (metrics, podData) => {
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

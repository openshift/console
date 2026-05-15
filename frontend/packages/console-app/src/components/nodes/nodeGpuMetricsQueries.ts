export enum GpuMetricQuery {
  GPU_COUNT = 'GPU_COUNT',
  GPU_UTILIZATION = 'GPU_UTILIZATION',
  GPU_TEMPERATURE = 'GPU_TEMPERATURE',
  GPU_POWER_USAGE = 'GPU_POWER_USAGE',
  GPU_FB_USED = 'GPU_FB_USED',
  GPU_FB_FREE = 'GPU_FB_FREE',
}

/**
 * Escapes a node name for safe inclusion in PromQL label matchers.
 * Backslash and single-quote are the only characters that need escaping
 * inside a PromQL single-quoted string literal.
 */
export const escapePromQLLabel = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/**
 * Builds two separate label selectors for matching the node across common DCGM
 * label conventions. PromQL does not support `or` inside `{}` label matchers,
 * so each query must join two full instant vectors with the `or` operator:
 *   metric{Hostname='name'} or metric{node='name'}
 */
const buildNodeSelectors = (nodeName: string): { hn: string; nd: string } => {
  const escaped = escapePromQLLabel(nodeName);
  return {
    hn: `Hostname='${escaped}'`,
    nd: `node='${escaped}'`,
  };
};

const buildQuery = (metric: string, hn: string, nd: string): string =>
  `${metric}{${hn}} or ${metric}{${nd}}`;

export const getGpuMetricQueries = (nodeName: string): Record<GpuMetricQuery, string> => {
  const { hn, nd } = buildNodeSelectors(nodeName);
  return {
    [GpuMetricQuery.GPU_COUNT]: `count(${buildQuery('DCGM_FI_DEV_GPU_UTIL', hn, nd)})`,
    [GpuMetricQuery.GPU_UTILIZATION]: buildQuery('DCGM_FI_DEV_GPU_UTIL', hn, nd),
    [GpuMetricQuery.GPU_TEMPERATURE]: buildQuery('DCGM_FI_DEV_GPU_TEMP', hn, nd),
    [GpuMetricQuery.GPU_POWER_USAGE]: buildQuery('DCGM_FI_DEV_POWER_USAGE', hn, nd),
    [GpuMetricQuery.GPU_FB_USED]: buildQuery('DCGM_FI_DEV_FB_USED', hn, nd),
    [GpuMetricQuery.GPU_FB_FREE]: buildQuery('DCGM_FI_DEV_FB_FREE', hn, nd),
  };
};

/** Resource keys that indicate GPU presence in node.status.capacity / allocatable. */
export const GPU_RESOURCE_KEYS = ['nvidia.com/gpu', 'amd.com/gpu'] as const;

export const nodeHasGpuCapacity = (capacity?: { [key: string]: string }): boolean =>
  GPU_RESOURCE_KEYS.some((key) => {
    const val = capacity?.[key];
    return val !== undefined && parseInt(val, 10) > 0;
  });

import * as _ from 'lodash';

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

const gpuQueries = {
  [GpuMetricQuery.GPU_COUNT]: _.template(
    `count(DCGM_FI_DEV_GPU_UTIL{<%= hn %>} or DCGM_FI_DEV_GPU_UTIL{<%= nd %>})`,
  ),
  [GpuMetricQuery.GPU_UTILIZATION]: _.template(
    `DCGM_FI_DEV_GPU_UTIL{<%= hn %>} or DCGM_FI_DEV_GPU_UTIL{<%= nd %>}`,
  ),
  [GpuMetricQuery.GPU_TEMPERATURE]: _.template(
    `DCGM_FI_DEV_GPU_TEMP{<%= hn %>} or DCGM_FI_DEV_GPU_TEMP{<%= nd %>}`,
  ),
  [GpuMetricQuery.GPU_POWER_USAGE]: _.template(
    `DCGM_FI_DEV_POWER_USAGE{<%= hn %>} or DCGM_FI_DEV_POWER_USAGE{<%= nd %>}`,
  ),
  [GpuMetricQuery.GPU_FB_USED]: _.template(
    `DCGM_FI_DEV_FB_USED{<%= hn %>} or DCGM_FI_DEV_FB_USED{<%= nd %>}`,
  ),
  [GpuMetricQuery.GPU_FB_FREE]: _.template(
    `DCGM_FI_DEV_FB_FREE{<%= hn %>} or DCGM_FI_DEV_FB_FREE{<%= nd %>}`,
  ),
};

export const getGpuMetricQueries = (nodeName: string): Record<GpuMetricQuery, string> => {
  const selectors = buildNodeSelectors(nodeName);
  return {
    [GpuMetricQuery.GPU_COUNT]: gpuQueries[GpuMetricQuery.GPU_COUNT](selectors),
    [GpuMetricQuery.GPU_UTILIZATION]: gpuQueries[GpuMetricQuery.GPU_UTILIZATION](selectors),
    [GpuMetricQuery.GPU_TEMPERATURE]: gpuQueries[GpuMetricQuery.GPU_TEMPERATURE](selectors),
    [GpuMetricQuery.GPU_POWER_USAGE]: gpuQueries[GpuMetricQuery.GPU_POWER_USAGE](selectors),
    [GpuMetricQuery.GPU_FB_USED]: gpuQueries[GpuMetricQuery.GPU_FB_USED](selectors),
    [GpuMetricQuery.GPU_FB_FREE]: gpuQueries[GpuMetricQuery.GPU_FB_FREE](selectors),
  };
};

/** Resource keys that indicate GPU presence in node.status.capacity / allocatable. */
export const GPU_RESOURCE_KEYS = ['nvidia.com/gpu', 'amd.com/gpu'] as const;

export const nodeHasGpuCapacity = (capacity?: { [key: string]: string }): boolean =>
  GPU_RESOURCE_KEYS.some((key) => {
    const val = capacity?.[key];
    return val !== undefined && parseInt(val, 10) > 0;
  });

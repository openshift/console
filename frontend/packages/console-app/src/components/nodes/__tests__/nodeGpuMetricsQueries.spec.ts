import {
  escapePromQLLabel,
  getGpuMetricQueries,
  GpuMetricQuery,
  nodeHasGpuCapacity,
  GPU_RESOURCE_KEYS,
} from '../nodeGpuMetricsQueries';

describe('escapePromQLLabel', () => {
  it('returns a plain name unchanged', () => {
    expect(escapePromQLLabel('worker-gpu-01')).toBe('worker-gpu-01');
  });

  it('escapes single quotes', () => {
    expect(escapePromQLLabel("node's-name")).toBe("node\\'s-name");
  });

  it('escapes backslashes', () => {
    expect(escapePromQLLabel('path\\node')).toBe('path\\\\node');
  });

  it('escapes both backslash and single quote together', () => {
    expect(escapePromQLLabel("a\\'b")).toBe("a\\\\\\'b");
  });
});

describe('getGpuMetricQueries', () => {
  it('returns queries keyed by GpuMetricQuery', () => {
    const queries = getGpuMetricQueries('gpu-node-1');
    expect(Object.keys(queries)).toHaveLength(Object.keys(GpuMetricQuery).length);
  });

  it('uses PromQL or between two instant vectors for each label convention', () => {
    const queries = getGpuMetricQueries('worker-gpu-01');
    const utilQuery = queries[GpuMetricQuery.GPU_UTILIZATION];
    expect(utilQuery).toBe(
      "DCGM_FI_DEV_GPU_UTIL{Hostname='worker-gpu-01'} or DCGM_FI_DEV_GPU_UTIL{node='worker-gpu-01'}",
    );
  });

  it('uses the correct DCGM metric name for each query', () => {
    const queries = getGpuMetricQueries('n1');
    expect(queries[GpuMetricQuery.GPU_COUNT]).toBe(
      "count(DCGM_FI_DEV_GPU_UTIL{Hostname='n1'} or DCGM_FI_DEV_GPU_UTIL{node='n1'})",
    );
    expect(queries[GpuMetricQuery.GPU_UTILIZATION]).toContain('DCGM_FI_DEV_GPU_UTIL');
    expect(queries[GpuMetricQuery.GPU_TEMPERATURE]).toContain('DCGM_FI_DEV_GPU_TEMP');
    expect(queries[GpuMetricQuery.GPU_POWER_USAGE]).toContain('DCGM_FI_DEV_POWER_USAGE');
    expect(queries[GpuMetricQuery.GPU_FB_USED]).toContain('DCGM_FI_DEV_FB_USED');
    expect(queries[GpuMetricQuery.GPU_FB_FREE]).toContain('DCGM_FI_DEV_FB_FREE');
  });

  it('escapes special characters in node names', () => {
    const queries = getGpuMetricQueries("node'special");
    expect(queries[GpuMetricQuery.GPU_UTILIZATION]).toContain("Hostname='node\\'special'");
  });
});

describe('nodeHasGpuCapacity', () => {
  it('returns false for undefined capacity', () => {
    expect(nodeHasGpuCapacity(undefined)).toBe(false);
  });

  it('returns false when no GPU keys are present', () => {
    expect(nodeHasGpuCapacity({ cpu: '8', memory: '32Gi' })).toBe(false);
  });

  it('returns false when GPU capacity is 0', () => {
    expect(nodeHasGpuCapacity({ 'nvidia.com/gpu': '0' })).toBe(false);
  });

  it('returns true when nvidia.com/gpu > 0', () => {
    expect(nodeHasGpuCapacity({ 'nvidia.com/gpu': '2' })).toBe(true);
  });

  it('returns true when amd.com/gpu > 0', () => {
    expect(nodeHasGpuCapacity({ 'amd.com/gpu': '1' })).toBe(true);
  });
});

describe('GPU_RESOURCE_KEYS', () => {
  it('includes nvidia and amd', () => {
    expect(GPU_RESOURCE_KEYS).toContain('nvidia.com/gpu');
    expect(GPU_RESOURCE_KEYS).toContain('amd.com/gpu');
  });
});

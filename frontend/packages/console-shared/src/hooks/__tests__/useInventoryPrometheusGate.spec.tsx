import { renderHook, waitFor } from '@testing-library/react';
import { PrometheusEndpoint } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { PrometheusResponse } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { useInventoryPrometheusGate } from '../useInventoryPrometheusGate';
import { usePrometheusGate } from '../usePrometheusGate';

jest.mock('@console/internal/components/graphs/prometheus-poll-hook', () => ({
  usePrometheusPoll: jest.fn(),
}));
jest.mock('../usePrometheusGate', () => ({
  usePrometheusGate: jest.fn(),
}));

const response = (resultCount: number): PrometheusResponse => ({
  status: 'success',
  data: {
    resultType: 'vector',
    result: Array.from({ length: resultCount }, (_, i) => ({
      metric: { i: String(i) },
      value: [0, '1'],
    })),
  },
});

describe('useInventoryPrometheusGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usePrometheusGate).mockReturnValue(true);
    jest.mocked(usePrometheusPoll).mockReturnValue([response(1), undefined, false]);
  });

  it('returns true when the inventory metrics are collected', async () => {
    const { result } = renderHook(() => useInventoryPrometheusGate('example'));
    await waitFor(() => expect(result.current).toBe(true));
    expect(usePrometheusPoll).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: PrometheusEndpoint.QUERY,
        namespace: 'example',
        query: expect.stringContaining('kube_namespace_status_phase'),
      }),
    );
    expect(jest.mocked(usePrometheusPoll).mock.calls[0][0].query).toContain('namespace="example"');
  });

  it('scopes the cluster probe without a namespace selector', async () => {
    const { result } = renderHook(() => useInventoryPrometheusGate());
    await waitFor(() => expect(result.current).toBe(true));
    expect(jest.mocked(usePrometheusPoll).mock.calls[0][0].query).not.toContain('namespace=');
  });

  it('falls back to watches when the collection profile drops the metrics', async () => {
    jest.mocked(usePrometheusPoll).mockReturnValue([response(0), undefined, false]);
    const { result } = renderHook(() => useInventoryPrometheusGate('example'));
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('falls back to watches when the probe fails', async () => {
    jest.mocked(usePrometheusPoll).mockReturnValue([undefined, new Error('Forbidden'), false]);
    const { result } = renderHook(() => useInventoryPrometheusGate('example'));
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('returns undefined while the probe is pending', () => {
    jest.mocked(usePrometheusPoll).mockReturnValue([undefined, undefined, true]);
    const { result } = renderHook(() => useInventoryPrometheusGate('example'));
    expect(result.current).toBeUndefined();
  });

  it('does not probe when monitoring is unavailable', () => {
    jest.mocked(usePrometheusGate).mockReturnValue(false);
    const { result } = renderHook(() => useInventoryPrometheusGate('example'));
    expect(result.current).toBe(false);
    expect(usePrometheusPoll).toHaveBeenCalledWith(expect.objectContaining({ query: '' }));
  });
});

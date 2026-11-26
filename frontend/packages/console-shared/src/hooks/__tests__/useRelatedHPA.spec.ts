import { renderHook } from '@testing-library/react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useRelatedHPA } from '../useRelatedHPA';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/internal/models', () => ({
  HorizontalPodAutoscalerModel: { kind: 'HorizontalPodAutoscaler' },
}));

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

// The workload the topology node represents.
const WORKLOAD = ['apps/v1', 'Deployment', 'my-app', 'default'] as const;

// Build an HPA list entry. getReduxData rebuilds the list (and its entries) on every
// watch event, so each call intentionally returns fresh object references.
const makeHpa = (uid: string, resourceVersion: string, targetName: string) => ({
  apiVersion: 'autoscaling/v2',
  kind: 'HorizontalPodAutoscaler',
  metadata: { uid, resourceVersion, name: `hpa-${uid}`, namespace: 'default' },
  spec: {
    scaleTargetRef: { apiVersion: 'apps/v1', kind: 'Deployment', name: targetName },
  },
});

describe('useRelatedHPA', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the HPA whose scaleTargetRef matches the workload', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [makeHpa('1', '100', 'my-app'), makeHpa('2', '200', 'other-app')],
      true,
      undefined,
    ]);

    const { result } = renderHook(() => useRelatedHPA(...WORKLOAD));
    const [hpa, loaded, error] = result.current;

    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
    expect(hpa?.metadata?.uid).toBe('1');
  });

  it('returns undefined when no HPA targets the workload', () => {
    useK8sWatchResourceMock.mockReturnValue([[makeHpa('2', '200', 'other-app')], true, undefined]);

    const { result } = renderHook(() => useRelatedHPA(...WORKLOAD));

    expect(result.current[0]).toBeUndefined();
  });

  // OCPBUGS-114039: an unrelated HPA watch event must not hand back a new object
  // reference for this node's HPA, otherwise the memoized PodStatus SVG re-renders
  // for every node on every event and freezes the browser in large namespaces.
  it('keeps a stable reference when only an unrelated HPA changes', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [makeHpa('1', '100', 'my-app'), makeHpa('2', '200', 'other-app')],
      true,
      undefined,
    ]);

    const { result, rerender } = renderHook(() => useRelatedHPA(...WORKLOAD));
    const first = result.current[0];

    // Watch event for the *other* HPA: the list and all its entries are rebuilt with
    // fresh references, but our workload's HPA is unchanged (same uid + resourceVersion).
    useK8sWatchResourceMock.mockReturnValue([
      [makeHpa('1', '100', 'my-app'), makeHpa('2', '201', 'other-app')],
      true,
      undefined,
    ]);
    rerender();

    expect(result.current[0]).toBe(first);
  });

  it('returns a new reference when the matching HPA itself changes', () => {
    useK8sWatchResourceMock.mockReturnValue([[makeHpa('1', '100', 'my-app')], true, undefined]);

    const { result, rerender } = renderHook(() => useRelatedHPA(...WORKLOAD));
    const first = result.current[0];

    useK8sWatchResourceMock.mockReturnValue([[makeHpa('1', '101', 'my-app')], true, undefined]);
    rerender();

    expect(result.current[0]).not.toBe(first);
    expect(result.current[0]?.metadata?.resourceVersion).toBe('101');
  });
});

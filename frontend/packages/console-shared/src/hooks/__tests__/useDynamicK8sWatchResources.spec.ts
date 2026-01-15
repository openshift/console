import { act, renderHook } from '@testing-library/react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { useDynamicK8sWatchResources } from '../useDynamicK8sWatchResources';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

const useK8sWatchResourcesMock = useK8sWatchResources as jest.MockedFunction<
  typeof useK8sWatchResources
>;

// Shared resource configurations for tests
const podResource = {
  kind: 'Pod',
  namespace: 'default',
  isList: true,
};

const deploymentResource = {
  kind: 'Deployment',
  namespace: 'default',
  isList: true,
};

// Helper to get the last argument passed to the mock
const getLastMockCallArg = () => useK8sWatchResourcesMock.mock.calls.at(-1)?.[0];

describe('useDynamicK8sWatchResources', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useK8sWatchResourcesMock.mockReturnValue({});
    jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return empty results initially', () => {
    const { result } = renderHook(() => useDynamicK8sWatchResources());

    expect(result.current.results).toEqual({});
    expect(result.current.watchResource).toBeInstanceOf(Function);
    expect(result.current.stopWatchResource).toBeInstanceOf(Function);
  });

  it('should add resource when watchResource is called', () => {
    const mockResults = {
      pods: { data: [], loaded: true, loadError: null },
    };
    useK8sWatchResourcesMock.mockReturnValue(mockResults);

    const { result, rerender } = renderHook(() => useDynamicK8sWatchResources());

    expect(useK8sWatchResourcesMock).toHaveBeenCalledWith({});

    act(() => {
      result.current.watchResource('pods', podResource);
    });

    rerender();

    expect(useK8sWatchResourcesMock).toHaveBeenCalledWith({
      pods: { ...podResource, optional: true },
    });
  });

  it('should remove resource when stopWatchResource is called', () => {
    const { result, rerender } = renderHook(() => useDynamicK8sWatchResources());

    act(() => {
      result.current.watchResource('pods', podResource);
    });

    rerender();

    act(() => {
      result.current.stopWatchResource('pods');
    });

    rerender();

    expect(useK8sWatchResourcesMock).toHaveBeenLastCalledWith({});
  });

  it('should not update state when resource config is unchanged (deep equality)', () => {
    const { result, rerender } = renderHook(() => useDynamicK8sWatchResources());

    act(() => {
      result.current.watchResource('pods', podResource);
    });
    rerender();

    const resourcesAfterFirstAdd = getLastMockCallArg();

    // Add same resource again with identical config (different object reference but same content)
    act(() => {
      result.current.watchResource('pods', { ...podResource });
    });
    rerender();

    const resourcesAfterSecondAdd = getLastMockCallArg();

    // The resource object should be the same reference (not recreated) because config is deeply equal
    expect(resourcesAfterSecondAdd).toBe(resourcesAfterFirstAdd);
  });

  it('should warn when watchResource is called with empty key', () => {
    const { result } = renderHook(() => useDynamicK8sWatchResources());

    act(() => {
      result.current.watchResource('', podResource);
    });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      '[useDynamicK8sWatchResources] watchResource called without key - resource will not be watched',
    );
  });

  it('should warn when stopWatchResource is called with empty key', () => {
    const { result } = renderHook(() => useDynamicK8sWatchResources());

    act(() => {
      result.current.stopWatchResource('');
    });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      '[useDynamicK8sWatchResources] stopWatchResource called without key - no action taken',
    );
  });

  it('should have stable callback references', () => {
    const { result, rerender } = renderHook(() => useDynamicK8sWatchResources());

    const watchResourceRef1 = result.current.watchResource;
    const stopWatchResourceRef1 = result.current.stopWatchResource;

    rerender();

    const watchResourceRef2 = result.current.watchResource;
    const stopWatchResourceRef2 = result.current.stopWatchResource;

    expect(watchResourceRef1).toBe(watchResourceRef2);
    expect(stopWatchResourceRef1).toBe(stopWatchResourceRef2);
  });

  it('should handle multiple resources simultaneously', () => {
    const mockResults = {
      pods: { data: [], loaded: true, loadError: null },
      deployments: { data: [], loaded: true, loadError: null },
    };
    useK8sWatchResourcesMock.mockReturnValue(mockResults);

    const { result, rerender } = renderHook(() => useDynamicK8sWatchResources());

    act(() => {
      result.current.watchResource('pods', podResource);
      result.current.watchResource('deployments', deploymentResource);
    });

    rerender();

    expect(useK8sWatchResourcesMock).toHaveBeenCalledWith({
      pods: { ...podResource, optional: true },
      deployments: { ...deploymentResource, optional: true },
    });
  });

  it('should not remove resource that does not exist', () => {
    const { result, rerender } = renderHook(() => useDynamicK8sWatchResources());

    rerender();

    const resourcesBeforeRemove = getLastMockCallArg();

    act(() => {
      result.current.stopWatchResource('nonexistent');
    });
    rerender();

    const resourcesAfterRemove = getLastMockCallArg();

    // State should not update - same object reference
    expect(resourcesAfterRemove).toBe(resourcesBeforeRemove);
  });

  it('should update resource config when changed', () => {
    const { result, rerender } = renderHook(() => useDynamicK8sWatchResources());

    act(() => {
      result.current.watchResource('pods', podResource);
    });

    rerender();

    // Update resource with different config
    const updatedPodResource = {
      ...podResource,
      namespace: 'kube-system', // Different namespace
    };

    act(() => {
      result.current.watchResource('pods', updatedPodResource);
    });

    rerender();

    // Verify the updated config is being used
    expect(useK8sWatchResourcesMock).toHaveBeenLastCalledWith({
      pods: { ...updatedPodResource, optional: true },
    });
  });

  it('should add optional: true by default for backward compatibility', () => {
    const { result, rerender } = renderHook(() => useDynamicK8sWatchResources());

    act(() => {
      result.current.watchResource('pods', podResource);
    });

    rerender();

    // Verify optional: true was added by default (matching old HOC behavior)
    expect(useK8sWatchResourcesMock).toHaveBeenCalledWith({
      pods: { ...podResource, optional: true },
    });
  });

  it('should respect explicit optional: false when provided', () => {
    const { result, rerender } = renderHook(() => useDynamicK8sWatchResources());

    const requiredResource = { ...podResource, optional: false };

    act(() => {
      result.current.watchResource('pods', requiredResource);
    });

    rerender();

    // Verify optional: false is preserved when explicitly set
    expect(useK8sWatchResourcesMock).toHaveBeenCalledWith({
      pods: { ...podResource, optional: false },
    });
  });

  it('should not treat optional: true as a config change', () => {
    const { result, rerender } = renderHook(() => useDynamicK8sWatchResources());

    // First add without explicit optional
    act(() => {
      result.current.watchResource('pods', podResource);
    });
    rerender();

    const resourcesAfterFirstAdd = getLastMockCallArg();

    // Add again with explicit optional: true
    act(() => {
      result.current.watchResource('pods', { ...podResource, optional: true });
    });
    rerender();

    const resourcesAfterSecondAdd = getLastMockCallArg();

    // Should be the same reference (no state update) since optional: true was already applied
    expect(resourcesAfterSecondAdd).toBe(resourcesAfterFirstAdd);
  });
});

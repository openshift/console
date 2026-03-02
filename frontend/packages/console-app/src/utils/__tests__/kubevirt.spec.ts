import { renderHook } from '@testing-library/react';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { useIsKubevirtPluginActive } from '../kubevirt';

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn(),
}));

jest.mock('@console/plugin-sdk/src/api/usePluginInfo', () => ({
  usePluginInfo: jest.fn(),
}));

const useFlagMock = useFlag as jest.Mock;
const usePluginInfoMock = usePluginInfo as jest.Mock;

const loadedKubevirtEntry = { manifest: { name: 'kubevirt-plugin' }, status: 'loaded' };
const pendingKubevirtEntry = { manifest: { name: 'kubevirt-plugin' }, status: 'pending' };
const otherPluginEntry = { manifest: { name: 'other-plugin' }, status: 'loaded' };

describe('useIsKubevirtPluginActive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when kubevirt feature flag is enabled and plugin is loaded', () => {
    useFlagMock.mockReturnValue(true);
    usePluginInfoMock.mockReturnValue([loadedKubevirtEntry, otherPluginEntry]);

    const { result } = renderHook(() => useIsKubevirtPluginActive());

    expect(result.current).toBe(true);
    expect(useFlagMock).toHaveBeenCalledWith('KUBEVIRT_DYNAMIC');
  });

  it('should return false when kubevirt feature flag is disabled', () => {
    useFlagMock.mockReturnValue(false);
    usePluginInfoMock.mockReturnValue([loadedKubevirtEntry]);

    const { result } = renderHook(() => useIsKubevirtPluginActive());

    expect(result.current).toBe(false);
  });

  it('should return false when kubevirt plugin is not in the plugin list', () => {
    useFlagMock.mockReturnValue(true);
    usePluginInfoMock.mockReturnValue([otherPluginEntry]);

    const { result } = renderHook(() => useIsKubevirtPluginActive());

    expect(result.current).toBe(false);
  });

  it('should return false when kubevirt plugin is present but not loaded', () => {
    useFlagMock.mockReturnValue(true);
    usePluginInfoMock.mockReturnValue([pendingKubevirtEntry]);

    const { result } = renderHook(() => useIsKubevirtPluginActive());

    expect(result.current).toBe(false);
  });

  it('should return false when plugin list is empty', () => {
    useFlagMock.mockReturnValue(true);
    usePluginInfoMock.mockReturnValue([]);

    const { result } = renderHook(() => useIsKubevirtPluginActive());

    expect(result.current).toBe(false);
  });
});

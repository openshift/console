import { renderHook } from '@testing-library/react';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConfigMapModel } from '@console/internal/models';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { USER_SETTING_CONFIGMAP_NAMESPACE } from '../../utils/user-settings';
import { useGetUserSettingConfigMap } from '../useGetUserSettingConfigMap';

// Mock dependencies
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const useSelectorMock = useConsoleSelector as jest.Mock;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn(),
}));

describe('useGetUserSettingConfigMap', () => {
  const mockConfigMapData: K8sResourceKind = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: 'user-settings-test-uid',
      namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
    },
    data: {
      'test.key': 'test value',
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Default mock implementation for useK8sWatchResource
    useK8sWatchResourceMock.mockImplementation((resource) => {
      if (!resource) {
        return [null, true, null];
      }
      return [mockConfigMapData, true, null];
    });
  });

  describe('user identification scenarios', () => {
    it('should use impersonated user name when present', () => {
      useSelectorMock.mockImplementation((selector) =>
        selector({
          sdkCore: {
            user: { uid: 'test-uid', username: 'test-username' },
            impersonate: { name: 'impersonate-user' },
          },
        }),
      );
      useK8sWatchResourceMock.mockReturnValue([mockConfigMapData, true, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      expect(result.current).toEqual([mockConfigMapData, true, null]);

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
        kind: ConfigMapModel.kind,
        namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
        isList: false,
        name: 'user-settings-impersonate-user',
      });
    });

    it('should use hashed username when no impersonation and uid is available', () => {
      useSelectorMock.mockImplementation((selector) =>
        selector({
          sdkCore: {
            user: { uid: 'test-uid-123', username: 'test-username' },
          },
        }),
      );
      useK8sWatchResourceMock.mockReturnValue([mockConfigMapData, true, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      expect(result.current).toEqual([mockConfigMapData, true, null]);

      // SHA256("test-username")
      expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
        kind: ConfigMapModel.kind,
        namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
        isList: false,
        name: 'user-settings-70609918baaace3eb22057bbae6dfbd7d0d2c34eaeecd5968ef455a64caee242',
      });
    });

    it('should handle empty user info gracefully', () => {
      useSelectorMock.mockImplementation((selector) =>
        selector({
          sdkCore: {
            user: {},
          },
        }),
      );

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      expect(result.current).toEqual([null, true, null]);
      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
    });

    it('should handle username-only scenario', () => {
      useSelectorMock.mockImplementation((selector) =>
        selector({
          sdkCore: {
            user: { username: 'test-username' },
          },
        }),
      );
      useK8sWatchResourceMock.mockReturnValue([mockConfigMapData, true, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      // SHA256("test-username") - sync, no longer async
      expect(result.current).toEqual([mockConfigMapData, true, null]);
      expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
        kind: ConfigMapModel.kind,
        namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
        isList: false,
        name: 'user-settings-70609918baaace3eb22057bbae6dfbd7d0d2c34eaeecd5968ef455a64caee242',
      });
    });
  });

  describe('integration with useK8sWatchResource', () => {
    it('should pass through loading state', () => {
      useSelectorMock.mockImplementation((selector) =>
        selector({
          sdkCore: {
            user: { uid: 'test-uid', username: 'test-username' },
          },
        }),
      );
      useK8sWatchResourceMock.mockReturnValue([null, false, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      expect(result.current).toEqual([null, false, null]);
    });

    it('should pass through error state', () => {
      useSelectorMock.mockImplementation((selector) =>
        selector({
          sdkCore: {
            user: { uid: 'test-uid', username: 'test-username' },
          },
        }),
      );

      const error = new Error('K8s API error');
      useK8sWatchResourceMock.mockReturnValue([null, false, error]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      expect(result.current).toEqual([null, false, error]);
    });

    it('should pass through successful data', () => {
      useSelectorMock.mockImplementation((selector) =>
        selector({
          sdkCore: {
            user: { uid: 'test-uid', username: 'test-username' },
          },
        }),
      );
      useK8sWatchResourceMock.mockReturnValue([mockConfigMapData, true, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      expect(result.current).toEqual([mockConfigMapData, true, null]);
    });

    it('should create ConfigMap resource with correct parameters', () => {
      useSelectorMock.mockImplementation((selector) =>
        selector({
          sdkCore: {
            user: { uid: 'test-uid-456', username: 'test-user' },
          },
        }),
      );
      useK8sWatchResourceMock.mockReturnValue([mockConfigMapData, true, null]);

      renderHook(() => useGetUserSettingConfigMap());

      // SHA256("test-user")
      expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
        kind: ConfigMapModel.kind,
        namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
        isList: false,
        name: 'user-settings-f85ac825d102b9f2d546aa1679ea991ae845994c1343730d564f3fcd0a2168c3',
      });
    });

    it('should use null resource when no user identifier is available', () => {
      useSelectorMock.mockImplementation((selector) =>
        selector({
          sdkCore: {
            user: {},
          },
        }),
      );
      useK8sWatchResourceMock.mockReturnValue([null, true, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
      expect(result.current).toEqual([null, true, null]);
    });
  });
});

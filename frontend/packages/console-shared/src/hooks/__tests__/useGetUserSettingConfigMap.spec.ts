import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConfigMapModel } from '@console/internal/models';
import { USER_SETTING_CONFIGMAP_NAMESPACE } from '../../utils/user-settings';
import { useGetUserSettingConfigMap } from '../useGetUserSettingConfigMap';

// Mock dependencies
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const useSelectorMock = useSelector as jest.Mock;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
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
      const impersonateUserInfo = {
        impersonateName: 'impersonate-user',
        uid: 'test-uid',
        username: 'test-username',
      };

      useSelectorMock.mockReturnValue(impersonateUserInfo);
      useK8sWatchResourceMock.mockReturnValue([mockConfigMapData, true, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      // Should use impersonate name directly and return config map data
      expect(result.current).toEqual([mockConfigMapData, true, null]);

      // Verify the correct resource spec was passed to useK8sWatchResource
      expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
        kind: ConfigMapModel.kind,
        namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
        isList: false,
        name: 'user-settings-impersonate-user',
      });
    });

    it('should use uid when no impersonation and uid is available', () => {
      const userInfoWithUid = {
        impersonateName: null,
        uid: 'test-uid-123',
        username: 'test-username',
      };

      useSelectorMock.mockReturnValue(userInfoWithUid);
      useK8sWatchResourceMock.mockReturnValue([mockConfigMapData, true, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      // Should use uid directly and return config map data
      expect(result.current).toEqual([mockConfigMapData, true, null]);

      // Verify the correct resource spec was passed
      expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
        kind: ConfigMapModel.kind,
        namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
        isList: false,
        name: 'user-settings-test-uid-123',
      });
    });

    it('should handle empty user info gracefully', () => {
      const emptyUserInfo = {
        impersonateName: null,
        uid: null,
        username: null,
      };

      useSelectorMock.mockReturnValue(emptyUserInfo);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      // Should return null config map resource when no user identifier
      expect(result.current).toEqual([null, true, null]);

      // Verify null resource was passed to useK8sWatchResource
      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
    });

    it('should handle username-only scenario', () => {
      const userInfoWithUsername = {
        impersonateName: null,
        uid: null,
        username: 'test-username',
      };

      useSelectorMock.mockReturnValue(userInfoWithUsername);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      // Initially, should return null since hashing is async
      expect(result.current[0]).toBeNull();
    });
  });

  describe('integration with useK8sWatchResource', () => {
    it('should pass through loading state', () => {
      const userInfoWithUid = {
        impersonateName: null,
        uid: 'test-uid',
        username: 'test-username',
      };

      useSelectorMock.mockReturnValue(userInfoWithUid);
      useK8sWatchResourceMock.mockReturnValue([null, false, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      expect(result.current).toEqual([null, false, null]);
    });

    it('should pass through error state', () => {
      const userInfoWithUid = {
        impersonateName: null,
        uid: 'test-uid',
        username: 'test-username',
      };

      const error = new Error('K8s API error');
      useSelectorMock.mockReturnValue(userInfoWithUid);
      useK8sWatchResourceMock.mockReturnValue([null, false, error]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      expect(result.current).toEqual([null, false, error]);
    });

    it('should pass through successful data', () => {
      const userInfoWithUid = {
        impersonateName: null,
        uid: 'test-uid',
        username: 'test-username',
      };

      useSelectorMock.mockReturnValue(userInfoWithUid);
      useK8sWatchResourceMock.mockReturnValue([mockConfigMapData, true, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      expect(result.current).toEqual([mockConfigMapData, true, null]);
    });

    it('should create ConfigMap resource with correct parameters', () => {
      const userInfo = {
        impersonateName: null,
        uid: 'test-uid-456',
        username: 'test-user',
      };

      useSelectorMock.mockReturnValue(userInfo);
      useK8sWatchResourceMock.mockReturnValue([mockConfigMapData, true, null]);

      renderHook(() => useGetUserSettingConfigMap());

      // Verify useK8sWatchResource was called with correct resource spec
      expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
        kind: ConfigMapModel.kind,
        namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
        isList: false,
        name: 'user-settings-test-uid-456',
      });
    });

    it('should use null resource when no user identifier is available', () => {
      const emptyUserInfo = {
        impersonateName: null,
        uid: null,
        username: '',
      };

      useSelectorMock.mockReturnValue(emptyUserInfo);
      useK8sWatchResourceMock.mockReturnValue([null, true, null]);

      const { result } = renderHook(() => useGetUserSettingConfigMap());

      // Should call useK8sWatchResource with null
      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
      expect(result.current).toEqual([null, true, null]);
    });
  });
});

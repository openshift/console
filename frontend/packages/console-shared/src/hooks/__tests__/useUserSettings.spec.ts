import * as redux from 'react-redux';
import { act } from 'react-dom/test-utils';
import { ConfigMapKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import {
  createConfigMap,
  updateConfigMap,
  USER_SETTING_CONFIGMAP_NAMESPACE,
} from '../../utils/user-settings';
import { useUserSettings } from '../useUserSettings';

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const createConfigMapMock = createConfigMap as jest.Mock;
const updateConfigMapMock = updateConfigMap as jest.Mock;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('../../utils/user-settings', () => {
  // requireActual exist in used jest 21 and still in latest version, but was not defined well in old TS definition
  const originalModule = (jest as any).requireActual('../../utils/user-settings');
  return {
    ...originalModule,
    createConfigMap: jest.fn(),
    updateConfigMap: jest.fn(),
  };
});

const emptyConfigMap: ConfigMapKind = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: `user-settings-1234`,
    namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
  },
};

const savedDataConfigMap: ConfigMapKind = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: `user-settings-1234`,
    namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
  },
  data: {
    'console.key': 'saved value',
  },
};

describe('useUserSettings', () => {
  beforeEach(() => {
    useK8sWatchResourceMock.mockClear();
    createConfigMapMock.mockClear();
    updateConfigMapMock.mockClear();
    spyOn(redux, 'useSelector').and.returnValues({ user: {} });
  });

  it('should create and update user settings if watcher could not find a ConfigMap', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock ConfigMap not found
    await act(async () => {
      useK8sWatchResourceMock.mockReturnValue([null, false, new Error('ConfigMap not found')]);
      rerender();
    });

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(createConfigMapMock).toHaveBeenCalledWith();
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);

    // Mock that ConfigMap is now available
    await act(async () => {
      useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);
      rerender();
    });

    // Expect default value with loaded
    expect(result.current).toEqual(['default value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      emptyConfigMap,
      'console.key',
      'default value',
    );
  });

  it('should return default value for an empty configmap after switching from loading to loaded', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock empty ConfigMap
    await act(async () => {
      useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);
      rerender();
    });

    // Expect default value with loaded
    expect(result.current).toEqual(['default value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      emptyConfigMap,
      'console.key',
      'default value',
    );
  });

  it('should return saved value for an known key after switching from loading to loaded', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock saved ConfigMap
    await act(async () => {
      useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
      rerender();
    });

    // Expect default value with loaded
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
  });

  it('should return default value for an unknown key if data is already loaded (hook is used twice)', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);

    const { result } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect default value with loaded
    expect(result.current).toEqual(['default value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      emptyConfigMap,
      'console.key',
      'default value',
    );
  });

  it('should return saved value for an known key if data is already loaded (hook is used twice)', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);

    const { result } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
  });

  it('should return latest user settings value after switching from loading to loaded', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock saved ConfigMap
    await act(async () => {
      useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
      rerender();
    });

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
  });

  it('should return latest user settings value in loaded state (hook is used twice)', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);

    const { result } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
  });

  it('should trigger update user settings when setter was called', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Call setSettings
    await act(async () => {
      const [, setSettings] = result.current;
      setSettings('new value');
      rerender();
    });

    // Expect new value and API update
    expect(result.current).toEqual(['new value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      { ...emptyConfigMap, data: { 'console.key': 'saved value' } },
      'console.key',
      'new value',
    );
  });

  it('should fallback to localStorage if creation fails with 403 (must not call updateConfigMap)', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect loading data
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock that createConfigMap is 403 Forbidden and that ConfigMap is not found.
    await act(async () => {
      createConfigMapMock.mockImplementation(async () => {
        const error: Error & { response?: any } = new Error('Forbidden');
        error.response = {
          ok: false,
          status: 403,
        };
        throw error;
      });
      useK8sWatchResourceMock.mockReturnValue([null, false, new Error('ConfigMap not found')]);
      rerender();
    });

    // Should call createConfigMap, but not updateConfigMap
    expect(result.current).toEqual(['default value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(createConfigMapMock).toHaveBeenCalledWith();
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
  });

  it('should fallback to localStorage if creation fails with 404 (must not call updateConfigMap)', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect loading data
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock that createConfigMap is 404 API not found.
    await act(async () => {
      createConfigMapMock.mockImplementation(async () => {
        const error: Error & { response?: any } = new Error('Not Found');
        error.response = {
          ok: false,
          status: 404,
        };
        throw error;
      });
      useK8sWatchResourceMock.mockReturnValue([null, false, new Error('ConfigMap not found')]);
      rerender();
    });

    // Should call createConfigMap, but not updateConfigMap
    expect(result.current).toEqual(['default value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(createConfigMapMock).toHaveBeenCalledWith();
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
  });
});

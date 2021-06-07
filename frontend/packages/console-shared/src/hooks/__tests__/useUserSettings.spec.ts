// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
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
const useSelectorMock = useSelector as jest.Mock;

// need to mock StorageEvent because it doesn't exist
(global as any).StorageEvent = Event;

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

jest.mock('react-redux', () => {
  const originalModule = (jest as any).requireActual('react-redux');
  return {
    ...originalModule,
    useSelector: jest.fn(),
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
  ...emptyConfigMap,
  data: {
    'console.key': 'saved value',
  },
};

describe('useUserSettings', () => {
  beforeEach(() => {
    useK8sWatchResourceMock.mockClear();
    createConfigMapMock.mockClear();
    updateConfigMapMock.mockClear();
    useSelectorMock.mockClear();
    useSelectorMock.mockImplementation((selector) =>
      selector({ UI: new Map([['user', { metadata: { uid: 'foo' } }]]) }),
    );
  });

  it('should create and update user settings if watcher could not find a ConfigMap', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock ConfigMap not found
    await act(async () => {
      const k8sError: Error & { response?: any } = new Error('ConfigMap Not Found');
      k8sError.response = { ok: false, status: 404 };
      useK8sWatchResourceMock.mockReturnValue([null, false, k8sError]);
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

  it('should provide the default value for user settings without sync and setter if there is no old value', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect saved data
    expect(result.current).toEqual(['default value', expect.any(Function), true]);

    // Call setSettings
    await act(async () => {
      const [, setSettings] = result.current;
      setSettings((oldValue) => {
        expect(oldValue).toEqual('default value');
        return 'new value';
      });
      rerender();
    });

    // Expect new value and API update
    expect(result.current).toEqual(['new value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(2);
    expect(updateConfigMapMock).toHaveBeenLastCalledWith(
      emptyConfigMap,
      'console.key',
      'new value',
    );
  });

  it('should provide the default value for user settings with sync and setter if there is no old value', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = testHook(() =>
      useUserSettings('console.key', 'default value', true),
    );

    // Expect saved data
    expect(result.current).toEqual(['default value', expect.any(Function), true]);

    // Call setSettings
    await act(async () => {
      const [, setSettings] = result.current;
      setSettings((oldValue) => {
        expect(oldValue).toEqual('default value');
        return 'new value';
      });
      rerender();
    });

    // Expect new value and API update
    expect(result.current).toEqual(['new value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(2);
    expect(updateConfigMapMock).toHaveBeenLastCalledWith(
      emptyConfigMap,
      'console.key',
      'new value',
    );
  });

  it('should provide the old value for user settings without sync and setter if there is an old value', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Call setSettings
    await act(async () => {
      const [, setSettings] = result.current;
      setSettings((oldValue) => {
        expect(oldValue).toEqual('saved value');
        return 'new value';
      });
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

  it('should provide the old value for user settings with sync and setter if there is an old value', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = testHook(() =>
      useUserSettings('console.key', 'default value', true),
    );

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Call setSettings
    await act(async () => {
      const [, setSettings] = result.current;
      setSettings((oldValue) => {
        expect(oldValue).toEqual('saved value');
        return 'new value';
      });
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

  it('should provide an updated value for user settings wuthout sync and setter if there is was an update in the meantime', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Mock updated data (like, 'from another browser tab/window')
    await act(async () => {
      const updatedConfigMap = {
        ...emptyConfigMap,
        data: {
          'console.key': 'magically changed value',
        },
      };
      useK8sWatchResourceMock.mockReturnValue([updatedConfigMap, true, null]);
      rerender();
    });

    // Expect that data are not changed when sync is disabled!
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Call setSettings
    await act(async () => {
      const [, setSettings] = result.current;
      setSettings((oldValue) => {
        expect(oldValue).toEqual('saved value');
        return 'new value';
      });
      rerender();
    });

    // Expect new value and API update
    expect(result.current).toEqual(['new value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      // Old configmap must not be the old value, but it's fine.
      { ...emptyConfigMap, data: { 'console.key': 'magically changed value' } },
      'console.key',
      'new value',
    );
  });

  it('should provide an updated value for user settings with sync and setter if there is was an update in the meantime', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = testHook(() =>
      useUserSettings('console.key', 'default value', true),
    );

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Mock updated data (like, 'from another browser tab/window')
    await act(async () => {
      const updatedConfigMap = {
        ...emptyConfigMap,
        data: {
          'console.key': 'magically changed value',
        },
      };
      useK8sWatchResourceMock.mockReturnValue([updatedConfigMap, true, null]);
      rerender();
    });

    // Expect changed data if sync option is enabled
    expect(result.current).toEqual(['magically changed value', expect.any(Function), true]);

    // Call setSettings
    await act(async () => {
      const [, setSettings] = result.current;
      setSettings((oldValue) => {
        expect(oldValue).toEqual('magically changed value');
        return 'new value';
      });
      rerender();
    });

    // Expect new value and API update
    expect(result.current).toEqual(['new value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      { ...emptyConfigMap, data: { 'console.key': 'magically changed value' } },
      'console.key',
      'new value',
    );
  });

  it('should fallback to localStorage if fetch fails with 403 (must not call updateConfigMap or createConfigMapMock)', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = testHook(() => useUserSettings('console.key', 'default value'));

    // Expect loading data
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock that createConfigMap is 403 Forbidden and that ConfigMap is not found.
    await act(async () => {
      const error: Error & { response?: any } = new Error('Forbidden');
      error.response = {
        ok: false,
        status: 403,
      };
      useK8sWatchResourceMock.mockReturnValue([null, false, error]);
      rerender();
    });

    // Should call createConfigMap, but not updateConfigMap
    expect(result.current).toEqual(['default value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
  });

  it('should fallback to localStorage if creation fails with 404 (must call createConfigMapMock)', async () => {
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
      const k8sError: Error & { response?: any } = new Error('ConfigMap Not Found');
      k8sError.response = { ok: false, status: 404 };
      useK8sWatchResourceMock.mockReturnValue([null, false, k8sError]);
      rerender();
    });

    // Should call createConfigMap, but not updateConfigMap
    expect(result.current).toEqual(['default value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(createConfigMapMock).toHaveBeenCalledWith();
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
  });

  it('should use session storage when impersonating', () => {
    useSelectorMock.mockImplementation((selector) =>
      selector({
        UI: new Map([
          ['user', { metadata: { uid: 'foo' } }],
          ['impersonate', { name: 'imposter' }],
        ]),
      }),
    );

    let storageListenerInvoked = false;
    const storageListener = (event: StorageEvent) => {
      storageListenerInvoked = true;
      expect(event.storageArea).toBe(sessionStorage);
      expect(event.key).toBe('user-settings-imposter');
      expect(event.newValue).toBe(JSON.stringify({ 'impersonate.key': 'newValue' }));
    };
    window.addEventListener('storage', storageListener);

    const { result } = testHook(() => useUserSettings('impersonate.key', 'impersonate.value'));

    expect(result.current).toEqual(['impersonate.value', expect.any(Function), true]);

    result.current[1]('newValue');

    expect(storageListenerInvoked).toBe(true);
    window.removeEventListener('storage', storageListener);
  });
});

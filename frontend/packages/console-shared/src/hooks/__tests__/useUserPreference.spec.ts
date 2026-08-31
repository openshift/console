import { createElement } from 'react';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useFavoritesOptions } from '@console/internal/components/useFavoritesOptions';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { ConfigMapKind } from '@console/internal/module/k8s';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import {
  createConfigMap,
  updateConfigMap,
  USER_SETTING_CONFIGMAP_NAMESPACE,
} from '../../utils/user-settings';
import { UserPreferenceProvider } from '../UserPreferenceContext';
import { useUserPreference } from '../useUserPreference';

// These tests exercise the real ConfigMap backend (create/update, watch
// transitions), which only runs inside UserPreferenceProvider (via
// useUserSettingsSync). So they mount the actual provider rather than the inert
// mock store that renderHookWithProviders supplies. useConsoleSelector and
// useK8sWatchResource are mocked below, so no redux Provider is required.
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(UserPreferenceProvider, null, children);

const renderHookWithRealUserSettings = <TResult>(hook: () => TResult) =>
  renderHook(hook, { wrapper });

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const createConfigMapMock = createConfigMap as jest.Mock;
const updateConfigMapMock = updateConfigMap as jest.Mock;
const useSelectorMock = useConsoleSelector as jest.Mock;
const useFavoritesOptionsMock = useFavoritesOptions as jest.Mock;

jest.mock('@console/internal/components/useFavoritesOptions', () => ({
  useFavoritesOptions: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('../../utils/user-settings', () => {
  const originalModule = jest.requireActual('../../utils/user-settings');
  return {
    ...originalModule,
    createConfigMap: jest.fn(),
    updateConfigMap: jest.fn(),
  };
});

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn(),
}));

const originalConsole = { ...console };
const consoleMock = jest.fn();

const emptyConfigMap: ConfigMapKind = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: `user-settings-ae5deb822e0d71992900471a7199d0d95b8e7c9d05c40a8245a281fd2c1d6684`,
    namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
  },
};

const savedDataConfigMap: ConfigMapKind = {
  ...emptyConfigMap,
  data: {
    'console.key': 'saved value',
  },
};

beforeEach(() => {
  jest.resetAllMocks();
  useSelectorMock.mockImplementation((selector) =>
    selector({ sdkCore: { user: { uid: 'foo', username: 'testuser' } } }),
  );
  useFavoritesOptionsMock.mockReturnValue([[], jest.fn(), true]);

  // eslint-disable-next-line no-console
  ['log', 'info', 'warn', 'error'].forEach((key) => (console[key] = consoleMock));
});

afterEach(() => {
  // eslint-disable-next-line no-console
  ['log', 'info', 'warn', 'error'].forEach((key) => (console[key] = originalConsole[key]));
});

describe('useUserPreference', () => {
  it('should create and update user settings if watcher returns 404 Not found (returned for kubeadmins who have access to the openshift-console-user-settings namespace)', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock ConfigMap not found
    const k8sError: Error & { response?: any } = new Error('Not found');
    k8sError.response = { ok: false, status: 404 };
    useK8sWatchResourceMock.mockReturnValue([null, false, k8sError]);
    rerender();

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(createConfigMapMock).toHaveBeenCalledWith();
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);

    // Mock that ConfigMap is now available
    useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);
    rerender();

    // Expect default value with loaded
    await waitFor(() => {
      expect(result.current).toEqual(['default value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      emptyConfigMap,
      'console.key',
      '"default value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('does not fire a second ConfigMap creation while the first is still in flight', async () => {
    // Keep the first createConfigMap call pending so the in-flight window stays open.
    let resolveCreate: (value: ConfigMapKind) => void = () => {};
    createConfigMapMock.mockReturnValue(
      new Promise<ConfigMapKind>((resolve) => {
        resolveCreate = resolve;
      }),
    );
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Deliver a 404: the mirror effect kicks off createConfigMap.
    const firstError: Error & { response?: any } = new Error('Not found');
    firstError.response = { ok: false, status: 404 };
    useK8sWatchResourceMock.mockReturnValue([null, false, firstError]);
    rerender();
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);

    // The watch re-delivers a fresh 404 error reference (still pending) which
    // re-runs the effect. The in-flight guard must suppress a duplicate POST.
    const secondError: Error & { response?: any } = new Error('Not found');
    secondError.response = { ok: false, status: 404 };
    useK8sWatchResourceMock.mockReturnValue([null, false, secondError]);
    rerender();
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);

    // Let the pending creation settle so the test tears down cleanly.
    await act(async () => {
      resolveCreate(emptyConfigMap);
    });
  });

  it('should create and update user settings if watcher returns 403 Forbidden (returned for users who could not access non existing ConfigMaps in openshift-console-user-settings namespace)', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock ConfigMap not found
    const k8sError2: Error & { response?: any } = new Error('Forbidden');
    k8sError2.response = { ok: false, status: 403 };
    useK8sWatchResourceMock.mockReturnValue([null, false, k8sError2]);
    rerender();

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(createConfigMapMock).toHaveBeenCalledWith();
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);

    // Mock that ConfigMap is now available
    useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);
    rerender();

    // Expect default value with loaded
    await waitFor(() => {
      expect(result.current).toEqual(['default value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      emptyConfigMap,
      'console.key',
      '"default value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should return default value for an empty configmap after switching from loading to loaded', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock empty ConfigMap
    useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);
    rerender();

    // Expect default value with loaded
    await waitFor(() => {
      expect(result.current).toEqual(['default value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      emptyConfigMap,
      'console.key',
      '"default value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should return saved value for an known key after switching from loading to loaded', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock saved ConfigMap
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    rerender();

    // Expect default value with loaded
    await waitFor(() => {
      expect(result.current).toEqual(['saved value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should return saved value for an known key which contains invalid characters', async () => {
    // Mock saved ConfigMap
    const savedDataWithEncodedCharConfigMap: ConfigMapKind = {
      ...emptyConfigMap,
      data: {
        'invalid-char-_-is-replaced-with-an-underline': 'saved value',
      },
    };
    useK8sWatchResourceMock.mockReturnValue([savedDataWithEncodedCharConfigMap, true, null]);

    const { result } = renderHookWithRealUserSettings(() =>
      useUserPreference('invalid-char-:-is-replaced-with-an-underline', 'default value'),
    );

    // Expect saved value with loaded
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should return default value for an unknown key if data is already loaded (hook is used twice)', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect default value with loaded
    expect(result.current).toEqual(['default value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      emptyConfigMap,
      'console.key',
      '"default value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should return saved value for an known key if data is already loaded (hook is used twice)', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);

    const { result } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should return latest user settings value after switching from loading to loaded', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect loading
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock saved ConfigMap
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    rerender();

    // Expect saved data
    await waitFor(() => {
      expect(result.current).toEqual(['saved value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should return latest user settings value in loaded state (hook is used twice)', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);

    const { result } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should trigger update user settings when setter was called', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Call setPreference
    const [, setPreference] = result.current;
    act(() => {
      setPreference('new value');
    });
    rerender();

    // Expect new value and API update
    await waitFor(() => {
      expect(result.current).toEqual(['new value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      { ...emptyConfigMap, data: { 'console.key': 'saved value' } },
      'console.key',
      '"new value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should provide the default value for user settings without sync and setter if there is no old value', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect saved data
    expect(result.current).toEqual(['default value', expect.any(Function), true]);

    // Call setPreference
    const [, setPreference] = result.current;
    act(() => {
      setPreference((oldValue) => {
        expect(oldValue).toEqual('default value');
        return 'new value';
      });
    });
    rerender();

    // Expect new value and API update
    await waitFor(() => {
      expect(result.current).toEqual(['new value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(2);
    expect(updateConfigMapMock).toHaveBeenLastCalledWith(
      emptyConfigMap,
      'console.key',
      '"new value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should provide the default value for user settings with sync and setter if there is no old value', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([emptyConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value', true),
    );

    // Expect saved data
    expect(result.current).toEqual(['default value', expect.any(Function), true]);

    // Call setPreference
    const [, setPreference2] = result.current;
    act(() => {
      setPreference2((oldValue) => {
        expect(oldValue).toEqual('default value');
        return 'new value';
      });
    });

    // With sync=true, the hook returns the value from cfData after the request completes.
    // Simulate the server update by updating the mock to return the new value.
    useK8sWatchResourceMock.mockReturnValue([
      { ...emptyConfigMap, data: { 'console.key': 'new value' } },
      true,
      null,
    ]);
    rerender();

    // Expect new value and API update
    await waitFor(() => {
      expect(result.current).toEqual(['new value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(2);
    expect(updateConfigMapMock).toHaveBeenLastCalledWith(
      emptyConfigMap,
      'console.key',
      '"new value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should provide the old value for user settings without sync and setter if there is an old value', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Call setPreference
    const [, setPreference3] = result.current;
    act(() => {
      setPreference3((oldValue) => {
        expect(oldValue).toEqual('saved value');
        return 'new value';
      });
    });
    rerender();

    // Expect new value and API update
    await waitFor(() => {
      expect(result.current).toEqual(['new value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      { ...emptyConfigMap, data: { 'console.key': 'saved value' } },
      'console.key',
      '"new value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should provide the old value for user settings with sync and setter if there is an old value', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value', true),
    );

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Call setPreference
    const [, setPreference4] = result.current;
    act(() => {
      setPreference4((oldValue) => {
        expect(oldValue).toEqual('saved value');
        return 'new value';
      });
    });

    // With sync=true, the hook returns the value from cfData after the request completes.
    // Simulate the server update by updating the mock to return the new value.
    useK8sWatchResourceMock.mockReturnValue([
      { ...emptyConfigMap, data: { 'console.key': 'new value' } },
      true,
      null,
    ]);
    rerender();

    // Expect new value and API update
    await waitFor(() => {
      expect(result.current).toEqual(['new value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      { ...emptyConfigMap, data: { 'console.key': 'saved value' } },
      'console.key',
      '"new value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should provide an updated value for user settings wuthout sync and setter if there is was an update in the meantime', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Mock updated data (like, 'from another browser tab/window')
    const updatedConfigMap = {
      ...emptyConfigMap,
      data: {
        'console.key': 'magically changed value',
      },
    };
    useK8sWatchResourceMock.mockReturnValue([updatedConfigMap, true, null]);
    rerender();

    // Expect that data are not changed when sync is disabled!
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Call setPreference
    const [, setPreference5] = result.current;
    act(() => {
      setPreference5((oldValue) => {
        expect(oldValue).toEqual('saved value');
        return 'new value';
      });
    });
    rerender();

    // Expect new value and API update
    await waitFor(() => {
      expect(result.current).toEqual(['new value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      // Old configmap must not be the old value, but it's fine.
      { ...emptyConfigMap, data: { 'console.key': 'magically changed value' } },
      'console.key',
      '"new value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should provide an updated value for user settings with sync and setter if there is was an update in the meantime', async () => {
    // Mock already loaded data
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockReturnValue(Promise.resolve({}));

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value', true),
    );

    // Expect saved data
    expect(result.current).toEqual(['saved value', expect.any(Function), true]);

    // Mock updated data (like, 'from another browser tab/window')
    const updatedConfigMap2 = {
      ...emptyConfigMap,
      data: {
        'console.key': 'magically changed value',
      },
    };
    useK8sWatchResourceMock.mockReturnValue([updatedConfigMap2, true, null]);
    rerender();

    // Expect changed data if sync option is enabled
    await waitFor(() => {
      expect(result.current).toEqual(['magically changed value', expect.any(Function), true]);
    });

    // Call setPreference
    const [, setPreference6] = result.current;
    act(() => {
      setPreference6((oldValue) => {
        expect(oldValue).toEqual('magically changed value');
        return 'new value';
      });
    });

    // With sync=true, the hook returns the value from cfData after the request completes.
    // Simulate the server update by updating the mock to return the new value.
    useK8sWatchResourceMock.mockReturnValue([
      { ...emptyConfigMap, data: { 'console.key': 'new value' } },
      true,
      null,
    ]);
    rerender();

    // Expect new value and API update
    await waitFor(() => {
      expect(result.current).toEqual(['new value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      { ...emptyConfigMap, data: { 'console.key': 'magically changed value' } },
      'console.key',
      '"new value"',
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should fallback to localStorage if creation fails and watch returns 404 Not found (returned for kubeadmin who have acess to the openshift-console-user-settings namespace)', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect loading data
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock that createConfigMap is 404 Not found.
    const error: Error & { response?: any } = new Error('Not Found');
    error.response = {
      ok: false,
      status: 404,
    };
    createConfigMapMock.mockImplementation(async () => {
      throw error;
    });
    useK8sWatchResourceMock.mockReturnValue([null, false, error]);
    rerender();

    // Should call createConfigMap, but not updateConfigMap
    await waitFor(() => {
      expect(result.current).toEqual(['default value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(createConfigMapMock).toHaveBeenCalledWith();
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith(
      'Could not create ConfigMap for user settings:',
      error,
    );
  });

  it('should fallback to localStorage if creation fails and watch return 403 Forbidden (returned for users who could not access non existing ConfigMaps in openshift-console-user-settings namespace)', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect loading data
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Same as 404 case above, but API returns 403 Forbidden when the user cannot access the namespace.
    const forbiddenError: Error & { response?: any } = new Error('Forbidden');
    forbiddenError.response = { ok: false, status: 403 };
    createConfigMapMock.mockImplementation(async () => {
      throw forbiddenError;
    });
    useK8sWatchResourceMock.mockReturnValue([null, false, forbiddenError]);
    rerender();

    // Should call createConfigMap, but not updateConfigMap
    await waitFor(() => {
      expect(result.current).toEqual(['default value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(1);
    expect(createConfigMapMock).toHaveBeenCalledWith();
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith(
      'Could not create ConfigMap for user settings:',
      forbiddenError,
    );
  });

  it('should fallback to localStorage if creation fails and watch returns any other error then Not Found or Forbidden', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value'),
    );

    // Expect loading data
    expect(result.current).toEqual([undefined, expect.any(Function), false]);

    // Mock that createConfigMap returns an unknown error.
    createConfigMapMock.mockImplementation(async () => {
      throw new Error('Unknown error');
    });
    useK8sWatchResourceMock.mockReturnValue([null, false, new Error('Unknown error')]);
    rerender();

    // Should call createConfigMap, but not updateConfigMap
    await waitFor(() => {
      expect(result.current).toEqual(['default value', expect.any(Function), true]);
    });
    expect(createConfigMapMock).toHaveBeenCalledTimes(0);
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('rolls back the shared store for other consumers when a write fails', async () => {
    // Both consumers observe the same key. The write is held pending on a
    // deferred promise so we can first assert the optimistic value propagates,
    // then reject it and assert the rollback.
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    let rejectUpdate: (reason?: unknown) => void = () => {};
    updateConfigMapMock.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectUpdate = reject;
      }),
    );

    const { result } = renderHookWithRealUserSettings(() => {
      const writer = useUserPreference('console.key', 'default value', true);
      const [observed] = useUserPreference('console.key', 'default value', true);
      return { writer, observed };
    });

    expect(result.current.writer[0]).toBe('saved value');
    expect(result.current.observed).toBe('saved value');

    act(() => {
      result.current.writer[1]('new value');
    });

    // While the write is pending, the optimistic update is visible to the
    // writer *and* the second consumer reading the same key from the store.
    await waitFor(() => {
      expect(result.current.observed).toBe('new value');
    });
    expect(result.current.writer[0]).toBe('new value');

    // Once the write fails, the optimistic update is rolled back for the writer
    // *and* the second consumer.
    await act(async () => {
      rejectUpdate(new Error('update failed'));
    });
    await waitFor(() => {
      expect(result.current.observed).toBe('saved value');
    });
    expect(result.current.writer[0]).toBe('saved value');
    expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('should use session storage when impersonating', async () => {
    // Mock loading
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);

    useSelectorMock.mockImplementation((selector) =>
      selector({
        sdkCore: {
          user: { metadata: { uid: 'foo' } },
          impersonate: { name: 'imposter' },
        },
      }),
    );

    let storageListenerInvoked = false;
    const storageListener = () => {
      storageListenerInvoked = true;
    };
    window.addEventListener('storage', storageListener);

    const { result } = renderHookWithRealUserSettings(() =>
      useUserPreference('impersonate.key', 'impersonate.value'),
    );

    expect(result.current).toEqual(['impersonate.value', expect.any(Function), true]);

    act(() => {
      result.current[1]('newValue');
    });

    await waitFor(() => {
      expect(storageListenerInvoked).toBe(true);
    });
    window.removeEventListener('storage', storageListener);

    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('applies genuine cross-tab storage events, including a key removal after a same-window write', async () => {
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);
    useSelectorMock.mockImplementation((selector) =>
      selector({
        sdkCore: {
          user: { uid: 'foo', username: 'testuser' },
          impersonate: { name: 'imposter' },
        },
      }),
    );

    // While impersonating, settings live in sessionStorage under this key
    // (getStorageKey(userUid='imposter', impersonate=true)).
    const storageKey = 'console-user-settings-imposter';
    window.sessionStorage.clear();

    const { result } = renderHookWithRealUserSettings(() => {
      const writer = useUserPreference('cross.key', 'default value', true);
      const [observed] = useUserPreference('cross.key', 'default value', true);
      return { writer, observed };
    });

    expect(result.current.observed).toBe('default value');

    // A same-window write; its synthetic echo is suppressed by the backend, but
    // the optimistic update still propagates to the second consumer.
    act(() => {
      result.current.writer[1]('local value');
    });
    await waitFor(() => expect(result.current.observed).toBe('local value'));

    // A genuine cross-tab event carrying a different value must update the store.
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: window.sessionStorage,
          key: storageKey,
          newValue: JSON.stringify({ 'cross.key': 'external value' }),
        }),
      );
    });
    await waitFor(() => expect(result.current.observed).toBe('external value'));

    // A cross-tab key removal (newValue === null) after a same-window write must
    // still be applied. The echo-suppression sentinel must not be mistaken for a
    // removal, otherwise the consumer would incorrectly retain its stale value.
    act(() => {
      result.current.writer[1]('another local value');
    });
    await waitFor(() => expect(result.current.observed).toBe('another local value'));
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: window.sessionStorage,
          key: storageKey,
          newValue: null,
        }),
      );
    });
    await waitFor(() => expect(result.current.observed).toBe('default value'));

    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('does not persist against a not-yet-loaded ConfigMap after impersonation ends', async () => {
    // While impersonating, settings live in sessionStorage, which loads
    // synchronously (loaded === true).
    useK8sWatchResourceMock.mockReturnValue([null, false, null]);
    useSelectorMock.mockImplementation((selector) =>
      selector({
        sdkCore: {
          user: { uid: 'foo', username: 'testuser' },
          impersonate: { name: 'imposter' },
        },
      }),
    );

    const { result, rerender } = renderHookWithRealUserSettings(() =>
      useUserPreference('console.key', 'default value', true),
    );

    await waitFor(() => {
      expect(result.current[2]).toBe(true);
    });

    // Impersonation ends: the backend switches to the ConfigMap, but the watch
    // has not delivered data yet.
    useSelectorMock.mockImplementation((selector) =>
      selector({ sdkCore: { user: { uid: 'foo', username: 'testuser' } } }),
    );
    rerender();

    // The stale `loaded: true` from sessionStorage must not carry over into
    // ConfigMap mode; the hook reports not-loaded until the ConfigMap arrives.
    await waitFor(() => {
      expect(result.current[2]).toBe(false);
    });

    // A write during this window must be gated. Without gating it would call
    // updateConfigMap with undefined ConfigMap metadata and throw.
    act(() => {
      result.current[1]('new value');
    });
    expect(updateConfigMapMock).toHaveBeenCalledTimes(0);
    expect(consoleMock).toHaveBeenCalledTimes(0);

    // Once the ConfigMap loads, writes go through against real metadata.
    useK8sWatchResourceMock.mockReturnValue([savedDataConfigMap, true, null]);
    updateConfigMapMock.mockResolvedValue(savedDataConfigMap);
    rerender();

    await waitFor(() => {
      expect(result.current[2]).toBe(true);
    });

    act(() => {
      result.current[1]('another value');
    });

    await waitFor(() => {
      expect(updateConfigMapMock).toHaveBeenCalledTimes(1);
    });
    expect(updateConfigMapMock).toHaveBeenCalledWith(
      savedDataConfigMap,
      'console.key',
      JSON.stringify('another value'),
    );
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });
});

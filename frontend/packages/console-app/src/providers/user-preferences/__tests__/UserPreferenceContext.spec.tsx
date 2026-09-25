import { act } from '@testing-library/react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { RootState } from '@console/internal/redux';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import {
  renderHookWithProviders,
  renderWithProviders,
} from '@console/shared/src/test-utils/unit-test-utils';
import { createUserSettingsStore } from '../UserPreferenceContext';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

const initialState = {
  sdkCore: { user: { uid: 'foo', username: 'testuser' } },
} as Partial<RootState>;

beforeEach(() => {
  jest.resetAllMocks();
  useK8sWatchResourceMock.mockReturnValue([null, false, null]);
});

const loadedSnapshot = (data: { [key: string]: string }) => ({
  data,
  loaded: true,
  isLocalStorage: false,
});

describe('useUserPreference store', () => {
  it('re-renders only the component whose key changed', () => {
    const store = createUserSettingsStore();
    act(() => {
      store.setSnapshot(loadedSnapshot({ 'key.a': '"a"', 'key.b': '"b"' }));
    });

    const renders = { a: 0, b: 0 };
    const A = () => {
      useUserPreference('key.a', 'da', true);
      renders.a += 1;
      return null;
    };
    const B = () => {
      useUserPreference('key.b', 'db', true);
      renders.b += 1;
      return null;
    };

    renderWithProviders(
      <>
        <A />
        <B />
      </>,
      { initialState, userSettingsStore: store },
    );

    const initialA = renders.a;
    const initialB = renders.b;

    // Change only key.a
    act(() => {
      store.setSnapshot(loadedSnapshot({ 'key.a': '"a2"', 'key.b': '"b"' }));
    });

    expect(renders.a).toBeGreaterThan(initialA);
    expect(renders.b).toBe(initialB);
  });

  it('does not re-render a non-sync consumer when its key changes remotely', () => {
    const store = createUserSettingsStore();
    act(() => {
      store.setSnapshot(loadedSnapshot({ 'key.a': '"a"' }));
    });

    let timesRendered = 0;
    let latestValue: string;
    const Consumer = () => {
      const [value] = useUserPreference('key.a', 'da', false);
      latestValue = value;
      timesRendered += 1;
      return null;
    };

    renderWithProviders(<Consumer />, { initialState, userSettingsStore: store });

    expect(latestValue).toBe('a');
    // Ignore any render passes from mounting; only count renders caused by the
    // remote change below.
    timesRendered = 0;

    // Remote change to the same key must be ignored when sync is false.
    act(() => {
      store.setSnapshot(loadedSnapshot({ 'key.a': '"a2"' }));
    });

    expect(timesRendered).toBe(0);
    expect(latestValue).toBe('a');
  });

  it('updates a sync consumer when its key changes remotely', () => {
    const store = createUserSettingsStore();
    act(() => {
      store.setSnapshot(loadedSnapshot({ 'key.a': '"a"' }));
    });

    let latestValue: string;
    const Consumer = () => {
      const [value] = useUserPreference('key.a', 'da', true);
      latestValue = value;
      return null;
    };

    renderWithProviders(<Consumer />, { initialState, userSettingsStore: store });

    expect(latestValue).toBe('a');

    act(() => {
      store.setSnapshot(loadedSnapshot({ 'key.a': '"a2"' }));
    });

    expect(latestValue).toBe('a2');
  });

  it('preserves number-like strings (does not coerce to a number)', () => {
    const store = createUserSettingsStore();
    // Value serialized to JSON (as written by the current implementation).
    act(() => {
      store.setSnapshot(loadedSnapshot({ 'key.a': '"1234"' }));
    });

    let latestValue: unknown;
    const Consumer = () => {
      const [value] = useUserPreference('key.a', 'default', true);
      latestValue = value;
      return null;
    };

    renderWithProviders(<Consumer />, { initialState, userSettingsStore: store });

    expect(latestValue).toBe('1234');
    expect(typeof latestValue).toBe('string');
  });

  it('re-seeds a non-syncing consumer when the key argument changes', () => {
    const store = createUserSettingsStore();
    act(() => {
      store.setSnapshot(loadedSnapshot({ 'key.a': '"a"', 'key.b': '"b"' }));
    });

    const { result, rerender } = renderHookWithProviders(
      ({ prefKey }: { prefKey: string }) => useUserPreference(prefKey, 'default', false),
      { initialState, userSettingsStore: store, initialProps: { prefKey: 'key.a' } },
    );

    expect(result.current[0]).toBe('a');

    // A non-syncing consumer must still pick up the new key's value.
    rerender({ prefKey: 'key.b' });

    expect(result.current[0]).toBe('b');
  });
});

describe('useUserPreference upgrade compatibility', () => {
  // Before this change, `serializeData` stored string values *bare* (e.g. the
  // string "graph" was persisted as `graph`, not `"graph"`). Existing users
  // will still have such values in their ConfigMap after upgrading, so they
  // must continue to read back correctly.
  it('reads a legacy bare string value written by the previous implementation', () => {
    const store = createUserSettingsStore();
    act(() => {
      store.setSnapshot(loadedSnapshot({ 'key.a': 'graph' }));
    });

    let latestValue: unknown;
    const Consumer = () => {
      const [value] = useUserPreference('key.a', 'default', true);
      latestValue = value;
      return null;
    };

    renderWithProviders(<Consumer />, { initialState, userSettingsStore: store });

    expect(latestValue).toBe('graph');
  });

  it('reads legacy bare and new JSON-quoted values from the same snapshot', () => {
    const store = createUserSettingsStore();
    act(() => {
      store.setSnapshot(
        // `key.legacy` is bare (pre-upgrade); `key.new` is JSON-quoted (post-upgrade).
        loadedSnapshot({ 'key.legacy': 'graph', 'key.new': '"list"' }),
      );
    });

    let legacyValue: unknown;
    let newValue: unknown;
    const Consumer = () => {
      [legacyValue] = useUserPreference('key.legacy', 'default', true);
      [newValue] = useUserPreference('key.new', 'default', true);
      return null;
    };

    renderWithProviders(<Consumer />, { initialState, userSettingsStore: store });

    expect(legacyValue).toBe('graph');
    expect(newValue).toBe('list');
  });

  it('reads a legacy JSON object value written by the previous implementation', () => {
    const store = createUserSettingsStore();
    act(() => {
      // Objects were JSON-encoded identically by both implementations.
      store.setSnapshot(loadedSnapshot({ 'key.a': '{"expanded":true}' }));
    });

    let latestValue: unknown;
    const Consumer = () => {
      const [value] = useUserPreference('key.a', {}, true);
      latestValue = value;
      return null;
    };

    renderWithProviders(<Consumer />, { initialState, userSettingsStore: store });

    expect(latestValue).toEqual({ expanded: true });
  });

  // Unlike strings, non-string values were already JSON-encoded by the previous
  // implementation (only strings were stored bare). Their serialized form is
  // therefore identical before and after this change, so legacy values must
  // continue to read back as their original native type.
  it('reads a legacy number value back as a number', () => {
    const store = createUserSettingsStore();
    act(() => {
      // Numbers were stored as `1234` (JSON) by both implementations.
      store.setSnapshot(loadedSnapshot({ 'key.a': '1234' }));
    });

    let latestValue: unknown;
    const Consumer = () => {
      const [value] = useUserPreference('key.a', 0, true);
      latestValue = value;
      return null;
    };

    renderWithProviders(<Consumer />, { initialState, userSettingsStore: store });

    expect(latestValue).toBe(1234);
    expect(typeof latestValue).toBe('number');
  });

  it('reads legacy boolean, array, and null values back as their native types', () => {
    const store = createUserSettingsStore();
    act(() => {
      store.setSnapshot(
        loadedSnapshot({
          'key.bool': 'true',
          'key.array': '[1,2,3]',
          'key.null': 'null',
        }),
      );
    });

    let boolValue: unknown;
    let arrayValue: unknown;
    let nullValue: unknown;
    const Consumer = () => {
      [boolValue] = useUserPreference('key.bool', false, true);
      [arrayValue] = useUserPreference('key.array', [], true);
      [nullValue] = useUserPreference('key.null', 'default', true);
      return null;
    };

    renderWithProviders(<Consumer />, { initialState, userSettingsStore: store });

    expect(boolValue).toBe(true);
    expect(arrayValue).toEqual([1, 2, 3]);
    expect(nullValue).toBeNull();
  });
});

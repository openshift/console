import type { FC, ReactNode } from 'react';
import type { Extension, TestPluginStore } from '@openshift/dynamic-plugin-sdk';
import { PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router';
import {
  isDynamicPluginLoadSettled,
  subscribeToDynamicPluginLoads,
} from '@console/dynamic-plugin-sdk/src/runtime/plugin-init';
import { dynamicPluginNames } from '@console/plugin-sdk/src/utils/allowed-plugins';
import {
  addLoadedPluginFromManifest,
  addPendingPlugin,
  createLocalPluginManifest,
  createRemotePluginManifest,
  createTestPluginStore,
} from '../../components/console-operator/__tests__/pluginTestUtils';
import { usePluginFlagsSettled } from '../usePluginFlagsSettled';

jest.mock('@console/plugin-sdk/src/utils/allowed-plugins', () => ({
  dynamicPluginNames: [],
}));

jest.mock('@console/dynamic-plugin-sdk/src/runtime/plugin-init', () => ({
  isDynamicPluginLoadSettled: jest.fn(),
  subscribeToDynamicPluginLoads: jest.fn(),
}));

const isDynamicPluginLoadSettledMock = isDynamicPluginLoadSettled as jest.Mock;
const subscribeToDynamicPluginLoadsMock = subscribeToDynamicPluginLoads as jest.Mock;

const routeExtension = (
  path: string | string[],
  flags?: Extension['flags'],
  exact = true,
  type = 'console.page/route',
): Extension => ({
  type,
  properties: { path, exact, component: () => Promise.resolve(() => null) },
  ...(flags ? { flags } : {}),
});

const addPlugin = (
  pluginStore: TestPluginStore,
  name: string,
  extensions: Extension[],
  registrationMethod: 'local' | 'callback' = 'callback',
) => {
  const manifest =
    registrationMethod === 'local'
      ? createLocalPluginManifest(name)
      : createRemotePluginManifest(name);
  addLoadedPluginFromManifest(pluginStore, { ...manifest, extensions }, extensions);
};

const renderSettledHook = (pluginStore: TestPluginStore, path: string) => {
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <PluginStoreProvider store={pluginStore}>
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    </PluginStoreProvider>
  );
  return renderHook(() => ({ settled: usePluginFlagsSettled(), navigate: useNavigate() }), {
    wrapper: Wrapper,
  });
};

describe('usePluginFlagsSettled', () => {
  let pluginStore: TestPluginStore;

  beforeEach(() => {
    jest.useFakeTimers();
    pluginStore = createTestPluginStore();
    dynamicPluginNames.length = 0;
    isDynamicPluginLoadSettledMock.mockReset().mockReturnValue(false);
    subscribeToDynamicPluginLoadsMock.mockReset().mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is settled when no plugin route can match the location', () => {
    addPlugin(pluginStore, 'test', [routeExtension('/other', { required: ['NEVER_SET'] })]);
    const { result } = renderSettledHook(pluginStore, '/no-such-page');
    expect(result.current.settled).toBe(true);
  });

  it('waits for a static plugin route gated by an unresolved flag', () => {
    addPlugin(pluginStore, 'helm', [routeExtension('/helm', { required: ['HELM'] })], 'local');
    const { result } = renderSettledHook(pluginStore, '/helm');
    expect(result.current.settled).toBe(false);
  });

  it('waits while a matching route is already in use but not rendered by the router yet', () => {
    addPlugin(pluginStore, 'test', [routeExtension('/page', { required: ['FLAG'] })]);
    const { result } = renderSettledHook(pluginStore, '/page');
    act(() => pluginStore.setFeatureFlags({ FLAG: true }));
    expect(result.current.settled).toBe(false);
  });

  it('settles when a required flag resolves to false', () => {
    addPlugin(pluginStore, 'test', [routeExtension('/page', { required: ['FLAG'] })]);
    const { result } = renderSettledHook(pluginStore, '/page');
    expect(result.current.settled).toBe(false);
    act(() => pluginStore.setFeatureFlags({ FLAG: false }));
    expect(result.current.settled).toBe(true);
  });

  it('settles when another required flag is false or a disallowed flag is true', () => {
    pluginStore.setFeatureFlags({ OFF: false, ON: true });
    addPlugin(pluginStore, 'test', [
      routeExtension('/required-off', { required: ['OFF', 'PENDING'] }),
      routeExtension('/disallowed-on', { required: ['PENDING'], disallowed: ['ON'] }),
    ]);
    expect(renderSettledHook(pluginStore, '/required-off').result.current.settled).toBe(true);
    expect(renderSettledHook(pluginStore, '/disallowed-on').result.current.settled).toBe(true);
  });

  it('waits for a route whose disallowed flag is unresolved because it is in use', () => {
    addPlugin(pluginStore, 'test', [routeExtension('/page', { disallowed: ['PENDING'] })]);
    const { result } = renderSettledHook(pluginStore, '/page');
    expect(result.current.settled).toBe(false);
  });

  it('ignores routes of disabled and failed plugins', () => {
    addPlugin(pluginStore, 'disabled', [routeExtension('/page', { required: ['PENDING'] })]);
    pluginStore.disablePlugins(['disabled'], 'test');
    pluginStore.addFailedPlugin(
      {
        ...createRemotePluginManifest('failed'),
        extensions: [routeExtension('/page', { required: ['PENDING'] })],
      },
      'failed to load',
    );
    const { result } = renderSettledHook(pluginStore, '/page');
    expect(result.current.settled).toBe(true);
  });

  it.each`
    path               | settled
    ${'/exact'}        | ${false}
    ${'/exact/child'}  | ${true}
    ${'/prefix'}       | ${false}
    ${'/prefix/child'} | ${false}
    ${'/first'}        | ${false}
    ${'/second/foo'}   | ${false}
    ${'/second'}       | ${true}
    ${'/standalone'}   | ${false}
  `('matches $path using the router path semantics (settled: $settled)', ({ path, settled }) => {
    addPlugin(pluginStore, 'test', [
      routeExtension('/exact', { required: ['PENDING'] }, true),
      routeExtension('/prefix', { required: ['PENDING'] }, false),
      routeExtension(['/first', '/second/:name'], { required: ['PENDING'] }, true),
      routeExtension(
        '/standalone',
        { required: ['PENDING'] },
        true,
        'console.page/route/standalone',
      ),
    ]);
    expect(renderSettledHook(pluginStore, path).result.current.settled).toBe(settled);
  });

  it('waits for configured dynamic plugins whose manifest has not been processed', () => {
    dynamicPluginNames.push('acm');
    const { result } = renderSettledHook(pluginStore, '/no-such-page');
    expect(result.current.settled).toBe(false);

    act(() => addPlugin(pluginStore, 'acm', []));
    expect(result.current.settled).toBe(true);
  });

  it('does not wait for a configured plugin whose load attempt failed before registration', () => {
    dynamicPluginNames.push('broken');
    const { result } = renderSettledHook(pluginStore, '/no-such-page');
    expect(result.current.settled).toBe(false);

    isDynamicPluginLoadSettledMock.mockImplementation((name) => name === 'broken');
    const [[onPluginLoadSettled]] = subscribeToDynamicPluginLoadsMock.mock.calls;
    act(() => onPluginLoadSettled());
    expect(result.current.settled).toBe(true);
  });

  it('waits for pending plugins without a timeout', () => {
    addPendingPlugin(pluginStore, 'acm');
    const { result } = renderSettledHook(pluginStore, '/no-such-page');
    act(() => jest.advanceTimersByTime(10000));
    expect(result.current.settled).toBe(false);
  });

  it('settles after the timeout when a configured plugin manifest never loads', () => {
    dynamicPluginNames.push('missing');
    const { result } = renderSettledHook(pluginStore, '/no-such-page');
    act(() => jest.advanceTimersByTime(2999));
    expect(result.current.settled).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.settled).toBe(true);
  });

  it('settles after the timeout when a matching route flag is never set', () => {
    addPlugin(pluginStore, 'test', [routeExtension('/page', { required: ['NEVER_SET'] })]);
    const { result } = renderSettledHook(pluginStore, '/page');
    act(() => jest.advanceTimersByTime(2999));
    expect(result.current.settled).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.settled).toBe(true);
  });

  it('starts a new timeout when waiting resumes after another plugin finished loading', () => {
    addPlugin(pluginStore, 'test', [routeExtension('/page', { required: ['NEVER_SET'] })]);
    const { result } = renderSettledHook(pluginStore, '/page');
    act(() => jest.advanceTimersByTime(2000));

    act(() => addPendingPlugin(pluginStore, 'late'));
    act(() => addPlugin(pluginStore, 'late', []));
    act(() => jest.advanceTimersByTime(2999));
    expect(result.current.settled).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.settled).toBe(true);
  });

  it('starts a new timeout for each waiting location', () => {
    addPlugin(pluginStore, 'test', [
      routeExtension('/a', { required: ['A'] }),
      routeExtension('/b', { required: ['B'] }),
    ]);
    const { result } = renderSettledHook(pluginStore, '/a');
    act(() => jest.advanceTimersByTime(3000));
    expect(result.current.settled).toBe(true);

    act(() => {
      result.current.navigate('/b');
    });
    expect(result.current.settled).toBe(false);
    act(() => jest.advanceTimersByTime(2999));
    expect(result.current.settled).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.settled).toBe(true);

    act(() => {
      result.current.navigate('/no-such-page');
    });
    expect(result.current.settled).toBe(true);
    act(() => {
      result.current.navigate('/a');
    });
    expect(result.current.settled).toBe(false);
  });
});

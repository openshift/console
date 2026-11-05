import { useLayoutEffect } from 'react';
import type { Extension, TestPluginStore } from '@openshift/dynamic-plugin-sdk';
import { PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import { render, screen, waitFor } from '@testing-library/react';
import * as _ from 'lodash';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import {
  addLoadedPluginFromManifest,
  createLocalPluginManifest,
  createRemotePluginManifest,
} from '@console/app/src/components/console-operator/__tests__/pluginTestUtils';
import useActivePerspective from '@console/dynamic-plugin-sdk/src/perspective/useActivePerspective';
import { dynamicPluginNames } from '@console/plugin-sdk/src/utils/allowed-plugins';
import { setFlag } from '../../actions/flags';
import { pluginStore as consolePluginStore } from '../../plugins';
import store from '../../redux';
import AppContents from '../app-contents';

// Use the Console PluginStore and Redux store wiring (including featureFlagMiddleware and
// static plugins) while allowing tests to add dynamic plugins like PluginStore.loadPlugin does.
jest.mock('@openshift/dynamic-plugin-sdk', () => {
  const actual = jest.requireActual('@openshift/dynamic-plugin-sdk');
  return { ...actual, PluginStore: actual.TestPluginStore };
});

jest.mock('@console/dynamic-plugin-sdk/src/runtime/plugin-init', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/runtime/plugin-init'),
  initConsolePlugins: jest.fn(),
}));

jest.mock('@console/plugin-sdk/src/utils/allowed-plugins', () => ({
  dynamicPluginNames: [],
}));

jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn(),
}));

jest.mock('../global-notifications', () => ({ GlobalNotifications: () => null }));
jest.mock('../global-telemetry-notifications', () => ({ TelemetryNotifier: () => null }));
jest.mock('../namespace-bar', () => ({ NamespaceBar: () => null }));

const notFoundCommits: string[] = [];

// Record the commit in which the router selects the 404 page. Mocking '../error' instead would
// miss a 404 that is replaced before AsyncComponent finishes loading it.
jest.mock('../utils/async', () => {
  const actual = jest.requireActual('../utils/async');
  const NotFoundPage = () => {
    useLayoutEffect(() => {
      notFoundCommits.push('ErrorPage404');
    });
    return '404 page';
  };
  return {
    ...actual,
    AsyncComponent: (props) =>
      String(props.loader).includes('ErrorPage404') ? (
        <NotFoundPage />
      ) : (
        <actual.AsyncComponent {...props} />
      ),
  };
});

const pluginStore = consolePluginStore as TestPluginStore;
const reactGlobals = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
const useActivePerspectiveMock = useActivePerspective as jest.Mock;

const flagGatedRoute = (path: string, flag: string, perspective?: string): Extension => ({
  type: 'console.page/route',
  properties: {
    path,
    exact: true,
    perspective,
    component: () => Promise.resolve(() => `${path} page`),
  },
  flags: { required: [flag] },
});

const addDynamicPlugin = (name: string, extensions: Extension[]) =>
  addLoadedPluginFromManifest(
    pluginStore,
    { ...createRemotePluginManifest(name), extensions },
    extensions,
  );

const addStaticPlugin = (name: string, extensions: Extension[]) =>
  addLoadedPluginFromManifest(
    pluginStore,
    { ...createLocalPluginManifest(name), extensions },
    extensions,
  );

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const setFlagLater = (flag: string, value: boolean, delay = 100) =>
  setTimeout(() => store.dispatch(setFlag(flag, value)), delay);

const renderAppContents = (path: string) =>
  render(
    <Provider store={store}>
      <PluginStoreProvider store={pluginStore}>
        <MemoryRouter initialEntries={[path]}>
          <AppContents />
        </MemoryRouter>
      </PluginStoreProvider>
    </Provider>,
  );

describe('AppContents 404 page for plugin routes', () => {
  let setActivePerspective: jest.Mock;
  let isReactActEnvironment: boolean;

  beforeAll(async () => {
    await waitFor(
      () => {
        if (pluginStore.getPluginInfo().some((entry) => entry.status === 'pending')) {
          throw new Error('Static plugins are still loading');
        }
      },
      { timeout: 5000 },
    );
  });

  beforeEach(() => {
    // Let React schedule Redux and PluginStore updates as it does in the browser
    isReactActEnvironment = reactGlobals.IS_REACT_ACT_ENVIRONMENT;
    reactGlobals.IS_REACT_ACT_ENVIRONMENT = false;
    notFoundCommits.length = 0;
    dynamicPluginNames.length = 0;
    setActivePerspective = jest.fn();
    useActivePerspectiveMock.mockReturnValue(['acm', setActivePerspective]);
  });

  afterEach(() => {
    reactGlobals.IS_REACT_ACT_ENVIRONMENT = isReactActEnvironment;
  });

  it('does not show 404 while the Helm route waits for its feature flag', async () => {
    const helmRoute = pluginStore
      .getPluginInfo()
      .find((entry) => entry.manifest.name === '@console/helm-plugin')
      ?.manifest.extensions.find(
        (e) => e.type === 'console.page/route' && _.isEqual(e.properties.path, ['/helm']),
      );
    expect(helmRoute?.flags?.required).toEqual(['OPENSHIFT_HELM']);

    renderAppContents('/helm');
    await sleep(300);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(notFoundCommits).toEqual([]);
  });

  it('does not show 404 while a static plugin route waits for its feature flag', async () => {
    addStaticPlugin('static-test', [flagGatedRoute('/static-test', 'STATIC_TEST_FLAG')]);
    renderAppContents('/static-test');
    setFlagLater('STATIC_TEST_FLAG', true);

    expect(await screen.findByText('/static-test page', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(notFoundCommits).toEqual([]);
  });

  it('does not show 404 when a resolved flag reaches Redux before the plugin routes', async () => {
    addDynamicPlugin('acm-roles', [flagGatedRoute('/acm-roles', 'ACM_ROLES_TEST_FLAG', 'acm')]);
    renderAppContents('/acm-roles');
    setFlagLater('ACM_ROLES_TEST_FLAG', true);

    expect(await screen.findByText('/acm-roles page', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(notFoundCommits).toEqual([]);
  });

  it('does not show 404 while a configured dynamic plugin manifest is being fetched', async () => {
    dynamicPluginNames.push('acm-manifest');
    renderAppContents('/acm-manifest');

    setTimeout(() => pluginStore.addPendingPlugin(createRemotePluginManifest('acm-manifest')), 50);
    setTimeout(
      () =>
        addDynamicPlugin('acm-manifest', [
          flagGatedRoute('/acm-manifest', 'ACM_MANIFEST_TEST_FLAG', 'acm'),
        ]),
      100,
    );
    setFlagLater('ACM_MANIFEST_TEST_FLAG', true, 150);

    expect(
      await screen.findByText('/acm-manifest page', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(notFoundCommits).toEqual([]);
  });

  it('switches perspective instead of showing 404 for a flag-gated route of another perspective', async () => {
    useActivePerspectiveMock.mockReturnValue(['admin', setActivePerspective]);
    addDynamicPlugin('acm-perspective', [
      flagGatedRoute('/acm-perspective', 'ACM_PERSPECTIVE_TEST_FLAG', 'acm'),
    ]);
    renderAppContents('/acm-perspective');
    setFlagLater('ACM_PERSPECTIVE_TEST_FLAG', true);

    await waitFor(
      () => expect(setActivePerspective).toHaveBeenCalledWith('acm', '/acm-perspective'),
      { timeout: 2000 },
    );
    expect(notFoundCommits).toEqual([]);
  });

  it('shows 404 when the route feature flag resolves to false', async () => {
    addDynamicPlugin('acm-disabled-feature', [
      flagGatedRoute('/acm-disabled-feature', 'ACM_FALSE_TEST_FLAG', 'acm'),
    ]);
    renderAppContents('/acm-disabled-feature');
    setFlagLater('ACM_FALSE_TEST_FLAG', false);

    expect(await screen.findByText('404 page', {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it('shows 404 without waiting for unrelated flags or disabled plugins', async () => {
    addDynamicPlugin('unrelated', [flagGatedRoute('/unrelated', 'UNRELATED_TEST_FLAG')]);
    addDynamicPlugin('disabled', [flagGatedRoute('/no-such-page', 'DISABLED_TEST_FLAG')]);
    pluginStore.disablePlugins(['disabled'], 'test');
    renderAppContents('/no-such-page');

    expect(await screen.findByText('404 page', {}, { timeout: 2000 })).toBeInTheDocument();
  });
});

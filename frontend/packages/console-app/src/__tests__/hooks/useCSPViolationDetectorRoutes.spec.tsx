import type { ComponentProps } from 'react';
import type { PluginStore, TestPluginStore } from '@openshift/dynamic-plugin-sdk';
import { act } from '@testing-library/react';
import { createRoutesFromElements, matchRoutes } from 'react-router';
import type { RoutePage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { isRoutePage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  addLoadedPluginFromManifest,
  createLocalPluginManifest,
  createTestPluginStore,
} from '../../components/console-operator/__tests__/pluginTestUtils';
import { useCSPViolationDetector } from '../../hooks/useCSPViolationDetector';
import { mapExtensionToRoutes } from '../../hooks/usePluginRoutes';
import { ToastContext } from '../../providers/toast/ToastContext';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => jest.fn(),
}));

const cacheKey = 'console/csp_violations';
const originalPageURL = window.location.href;
const originalBasePath = window.SERVER_FLAGS.basePath;
const EmptyPage = () => null;
const Detector = () => {
  useCSPViolationDetector('admin');
  return null;
};
const toastValue: ComponentProps<typeof ToastContext.Provider>['value'] = {
  addToast: jest.fn(() => 'toast-id'),
  removeToast: jest.fn(),
  minimizeToast: jest.fn(),
};

type Candidate = {
  name: string;
  path: string | string[];
  exact?: boolean;
  perspective?: string;
};

const register = (pluginStore: TestPluginStore, candidate: Candidate) => {
  const { name, path, exact = true, perspective = 'admin' } = candidate;
  addLoadedPluginFromManifest(pluginStore, createLocalPluginManifest(name), [
    {
      type: 'console.page/route',
      properties: { path, exact, perspective, component: async () => EmptyPage },
    },
  ]);
  expect(pluginStore.getPluginInfo().find((info) => info.manifest.name === name)?.status).toBe(
    'loaded',
  );
};

const routeOwners = (pluginStore: PluginStore) =>
  pluginStore
    .getExtensions()
    .filter((extension): extension is LoadedExtension<RoutePage> => isRoutePage(extension))
    .filter(({ uid, properties }) => {
      if ((properties.perspective ?? 'admin') !== 'admin') {
        return false;
      }
      const routes = createRoutesFromElements(
        mapExtensionToRoutes({ ...properties, uid, getElement: () => null }),
      );
      return !!matchRoutes(routes, window.location.pathname, window.SERVER_FLAGS.basePath);
    })
    .map(({ pluginName }) => pluginName);

const emitViolation = (overrides: Partial<SecurityPolicyViolationEvent> = {}) => {
  const event = new Event('securitypolicyviolation');
  Object.assign(event, {
    sourceFile: 'browser-extension',
    documentURI: window.location.href,
    effectiveDirective: 'script-src-elem',
    blockedURI: 'https://blocked.example/asset.js',
    disposition: 'enforce',
    ...overrides,
  });
  act(() => document.dispatchEvent(event));
};

beforeEach(() => {
  window.localStorage.removeItem(cacheKey);
  window.SERVER_FLAGS.basePath = '/';
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  window.localStorage.removeItem(cacheKey);
  window.SERVER_FLAGS.basePath = originalBasePath;
  window.history.replaceState({}, '', originalPageURL);
});

type RouteCase = {
  title: string;
  pathname: string;
  candidates: Candidate[];
  owners: string[];
  basename?: string;
};

const cases: RouteCase[] = [
  {
    title: 'encoded parameter/literal overlap stays ambiguous',
    pathname: '/plugin/%70lain',
    candidates: [
      { name: 'broad-plugin', path: '/plugin/:name' },
      { name: 'specific-plugin', path: '/plugin/plain' },
    ],
    owners: ['broad-plugin', 'specific-plugin'],
  },
  {
    title: 'unencoded parameter/literal overlap stays ambiguous',
    pathname: '/plugin/plain',
    candidates: [
      { name: 'broad-plugin', path: '/plugin/:name' },
      { name: 'specific-plugin', path: '/plugin/plain' },
    ],
    owners: ['broad-plugin', 'specific-plugin'],
  },
  ...[
    { title: 'Unicode', pathname: '/caf%C3%A9', path: '/café' },
    { title: 'spaces', pathname: '/hello%20world', path: '/hello world' },
  ].map(({ title, pathname, path }) => ({
    title: `${title} literals use decoded ownership`,
    pathname,
    candidates: [{ name: 'decoded-plugin', path }],
    owners: ['decoded-plugin'],
  })),
  ...[
    { title: 'space', pathname: '/hello%20world', decoded: '/hello world' },
    { title: 'Unicode', pathname: '/caf%C3%A9', decoded: '/café' },
  ].map(({ title, pathname, decoded }) => ({
    title: `raw encoded ${title} literal does not steal decoded ownership`,
    pathname,
    candidates: [
      { name: 'raw-plugin', path: pathname },
      { name: 'decoded-plugin', path: decoded },
    ],
    owners: ['decoded-plugin'],
  })),
  {
    title: 'double encoding is decoded only once',
    pathname: '/hello%2520world',
    candidates: [
      { name: 'raw-plugin', path: '/hello%20world' },
      { name: 'decoded-plugin', path: '/hello world' },
    ],
    owners: ['raw-plugin'],
  },
  ...['%2F', '%2f'].map((encodedSlash) => ({
    title: `${encodedSlash} remains within its segment`,
    pathname: `/plugin/hello${encodedSlash}world`,
    candidates: [
      { name: 'segment-plugin', path: '/plugin/:name' },
      { name: 'split-plugin', path: '/plugin/hello/world' },
    ],
    owners: ['segment-plugin'],
  })),
  {
    title: 'encoded slash literal matches the router-normalized spelling',
    pathname: '/plugin/hello%2fworld',
    candidates: [{ name: 'slash-plugin', path: '/plugin/hello%2Fworld' }],
    owners: ['slash-plugin'],
  },
  ...['%ZZ', '%', '%E0%A4%A'].map((malformed) => ({
    title: `malformed escape ${malformed} retains the entire raw path`,
    pathname: `/plugin/%70lain/${malformed}`,
    candidates: [
      { name: 'raw-plugin', path: `/plugin/%70lain/${malformed}` },
      { name: 'decoded-plugin', path: `/plugin/plain/${malformed}` },
    ],
    owners: ['raw-plugin'],
  })),
  ...['/console', '/console/'].map((basename) => ({
    title: `basename ${basename} strips case-insensitively before decoding`,
    pathname: '/CONSOLE/caf%C3%A9',
    basename,
    candidates: [{ name: 'decoded-plugin', path: '/café' }],
    owners: ['decoded-plugin'],
  })),
  {
    title: 'basename prefix without a segment boundary does not match',
    pathname: '/console-other/plain',
    basename: '/console/',
    candidates: [{ name: 'outside-plugin', path: '/console-other/plain' }],
    owners: [],
  },
  {
    title: 'pathname outside the basename does not match',
    pathname: '/plugin/plain',
    basename: '/console/',
    candidates: [{ name: 'outside-plugin', path: '/plugin/plain' }],
    owners: [],
  },
  {
    title: 'basename with trailing slash matches the root route',
    pathname: '/CONSOLE/',
    basename: '/console/',
    candidates: [{ name: 'root-plugin', path: '/' }],
    owners: ['root-plugin'],
  },
  {
    title: 'basename with trailing slash rejects a root without that slash',
    pathname: '/CONSOLE',
    basename: '/console/',
    candidates: [{ name: 'root-plugin', path: '/' }],
    owners: [],
  },
  {
    title: 'basename without trailing slash accepts a root without a slash',
    pathname: '/CONSOLE',
    basename: '/console',
    candidates: [{ name: 'root-plugin', path: '/' }],
    owners: ['root-plugin'],
  },
  {
    title: 'same-owner encoded overlap is not ambiguous',
    pathname: '/plugin/%70lain',
    candidates: [{ name: 'single-plugin', path: ['/plugin/:name', '/plugin/plain'] }],
    owners: ['single-plugin'],
  },
  {
    title: 'inactive perspectives do not contribute decoded owners',
    pathname: '/plugin/%70lain',
    candidates: [
      { name: 'active-plugin', path: '/plugin/plain' },
      { name: 'inactive-plugin', path: '/plugin/:name', perspective: 'dev' },
    ],
    owners: ['active-plugin'],
  },
  {
    title: 'non-exact routes preserve suffix matching after decoding',
    pathname: '/caf%C3%A9/details',
    candidates: [{ name: 'prefix-plugin', path: '/café', exact: false }],
    owners: ['prefix-plugin'],
  },
  {
    title: 'exact routes reject extra decoded segments',
    pathname: '/caf%C3%A9/details',
    candidates: [{ name: 'exact-plugin', path: '/café' }],
    owners: [],
  },
];

describe('useCSPViolationDetector router normalization', () => {
  it.each(cases)('$title', ({ pathname, candidates, owners, basename = '/' }) => {
    const pluginStore = createTestPluginStore();
    candidates.forEach((candidate) => register(pluginStore, candidate));
    window.SERVER_FLAGS.basePath = basename;
    window.history.replaceState({}, '', pathname);
    expect(routeOwners(pluginStore)).toEqual(owners);
    const { store } = renderWithProviders(
      <ToastContext.Provider value={toastValue}>
        <Detector />
      </ToastContext.Provider>,
      { pluginStore },
    );

    emitViolation();
    emitViolation({ blockedURI: 'https://blocked.example/another.js' });

    const expectedOwner = owners.length === 1 ? owners[0] : '';
    const cached = JSON.parse(window.localStorage.getItem(cacheKey));
    expect(cached).toHaveLength(1);
    expect(cached[0].pluginName).toBe(expectedOwner);
    expect(store.getState().UI.pluginCSPViolations).toEqual(
      expectedOwner ? { [expectedOwner]: true } : {},
    );
  });
});

import { act } from '@testing-library/react';
import type { RoutePage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  addLoadedPluginFromManifest,
  createLocalPluginManifest,
  createTestPluginStore,
} from '../../components/console-operator/__tests__/pluginTestUtils';
import {
  newPluginCSPViolationEvent,
  useCSPViolationDetector,
} from '../../hooks/useCSPViolationDetector';

jest.mock('@console/shared/src/constants/common', () => ({
  ...jest.requireActual('@console/shared/src/constants/common'),
  IS_PRODUCTION: true,
}));

const mockCacheEvent = jest.fn();
jest.mock('@console/shared/src/hooks/useLocalStorageCache', () => ({
  useLocalStorageCache: () => [undefined, mockCacheEvent],
}));

const mockFireTelemetry = jest.fn();
jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => mockFireTelemetry,
}));

const routePages: {
  pluginName: string;
  properties: { path: string | string[]; exact?: boolean; perspective?: string };
}[] = [];
const originalPageURL = window.location.href;
const originalBasePath = window.SERVER_FLAGS.basePath;
let mockActivePerspective = 'admin';
const pluginRoutePath = '/dynamic-route-1';

const activatePluginRoute = (...pluginNames: string[]) => {
  window.history.pushState({}, '', pluginRoutePath);
  routePages.push(
    ...pluginNames.map((pluginName) => ({
      pluginName,
      properties: { path: pluginRoutePath, exact: true, perspective: 'admin' },
    })),
  );
};

class MockSecurityPolicyViolationEvent extends Event {
  documentURI;

  violatedDirective;

  originalPolicy;

  blockedURI;

  lineNumber;

  columnNumber;

  statusCode;

  sourceFile;

  disposition;

  effectiveDirective;

  referrer;

  sample;

  constructor(blockedURI?: string, sourceFile?: string, documentURI?: string) {
    super('securitypolicyviolation');
    this.blockedURI = blockedURI || 'http://blocked.com';
    this.sourceFile = sourceFile || 'http://example.com/test.js';
    this.documentURI = documentURI || 'http://localhost:9000/test';
  }
}
const testEvent = new MockSecurityPolicyViolationEvent();
const testPluginEvent = newPluginCSPViolationEvent(null, testEvent);

const TestComponent = () => {
  useCSPViolationDetector(mockActivePerspective);
  return <div>hello, world!</div>;
};

const EmptyPage = () => null;

const renderDetector = () => {
  const pluginStore = createTestPluginStore((store) => {
    new Set(routePages.map(({ pluginName }) => pluginName)).forEach((pluginName) => {
      const extensions: RoutePage[] = routePages
        .filter((routePage) => routePage.pluginName === pluginName)
        .map(({ properties }) => ({
          type: 'console.page/route',
          properties: { ...properties, component: async () => EmptyPage },
        }));
      addLoadedPluginFromManifest(store, createLocalPluginManifest(pluginName), extensions);
    });
  });

  return renderWithProviders(<TestComponent />, { pluginStore });
};

describe('useCSPViolationDetector', () => {
  afterEach(() => {
    mockFireTelemetry.mockClear();
    mockCacheEvent.mockClear();
    routePages.length = 0;
    mockActivePerspective = 'admin';
    window.SERVER_FLAGS.basePath = originalBasePath;
    window.history.replaceState({}, '', originalPageURL);
  });

  it('records a new CSP violation', () => {
    mockCacheEvent.mockReturnValue(true);
    renderDetector();
    act(() => {
      document.dispatchEvent(testEvent);
    });
    expect(mockCacheEvent).toHaveBeenCalledWith(testPluginEvent);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', testPluginEvent);
  });

  it('does not update store when matching event exists', () => {
    mockCacheEvent.mockReturnValue(false);
    renderDetector();

    act(() => {
      document.dispatchEvent(testEvent);
    });

    expect(mockCacheEvent).toHaveBeenCalledWith(testPluginEvent);
    expect(mockFireTelemetry).not.toHaveBeenCalled();
  });

  it('correctly parses plugin name from blockedURI', () => {
    mockCacheEvent.mockReturnValue(true);
    const testEventWithPlugin = new MockSecurityPolicyViolationEvent(
      'http://localhost/api/plugins/foo',
    );
    const expected = newPluginCSPViolationEvent('foo', testEventWithPlugin);
    renderDetector();
    act(() => {
      document.dispatchEvent(testEventWithPlugin);
    });
    expect(mockCacheEvent).toHaveBeenCalledWith(expected);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', expected);
  });

  it('correctly parses plugin name from sourceFile', () => {
    mockCacheEvent.mockReturnValue(true);
    const testEventWithPlugin = new MockSecurityPolicyViolationEvent(
      'http://blocked.com',
      'http://localhost/api/plugins/foo',
    );
    const expected = newPluginCSPViolationEvent('foo', testEventWithPlugin);
    renderDetector();
    act(() => {
      document.dispatchEvent(testEventWithPlugin);
    });
    expect(mockCacheEvent).toHaveBeenCalledWith(expected);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', expected);
  });

  // Regression test for OCPBUGS-45285: https://issues.redhat.com/browse/OCPBUGS-45285
  it('associates browser-extension violations with a unique plugin route', () => {
    mockCacheEvent.mockReturnValue(true);
    activatePluginRoute('foo');
    const testEventWithBrowserExtension = new MockSecurityPolicyViolationEvent(
      'https://blocked.com',
      'browser-extension',
      window.location.href,
    );
    const expected = newPluginCSPViolationEvent('foo', testEventWithBrowserExtension);
    renderDetector();

    act(() => {
      document.dispatchEvent(testEventWithBrowserExtension);
    });

    expect(mockCacheEvent).toHaveBeenCalledWith(expected);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', expected);
  });

  it('does not associate browser-extension violations with overlapping plugin routes', () => {
    mockCacheEvent.mockReturnValue(true);
    activatePluginRoute('foo', 'bar');
    const testEventWithBrowserExtension = new MockSecurityPolicyViolationEvent(
      'https://blocked.com',
      'browser-extension',
      window.location.href,
    );
    const expected = newPluginCSPViolationEvent(null, testEventWithBrowserExtension);
    renderDetector();

    act(() => {
      document.dispatchEvent(testEventWithBrowserExtension);
    });

    expect(mockCacheEvent).toHaveBeenCalledWith(expected);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', expected);
  });

  it('does not infer a plugin route for other source-file values', () => {
    mockCacheEvent.mockReturnValue(true);
    activatePluginRoute('foo');
    const testEventWithOtherSource = new MockSecurityPolicyViolationEvent(
      'https://blocked.com',
      'http://localhost:9000/test.js',
      window.location.href,
    );
    const expected = newPluginCSPViolationEvent(null, testEventWithOtherSource);
    renderDetector();

    act(() => {
      document.dispatchEvent(testEventWithOtherSource);
    });

    expect(mockCacheEvent).toHaveBeenCalledWith(expected);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', expected);
  });

  it('does not infer a plugin route when the event document differs from the current page', () => {
    mockCacheEvent.mockReturnValue(true);
    activatePluginRoute('foo');
    const eventDocumentURI = new URL('/another-page', window.location.origin).href;
    const testEventWithDifferentDocument = new MockSecurityPolicyViolationEvent(
      'https://blocked.com',
      'browser-extension',
      eventDocumentURI,
    );
    const expected = newPluginCSPViolationEvent(null, testEventWithDifferentDocument);
    renderDetector();

    act(() => {
      document.dispatchEvent(testEventWithDifferentDocument);
    });

    expect(mockCacheEvent).toHaveBeenCalledWith(expected);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', expected);
  });

  it.each([
    {
      name: 'a route under a non-root Console base path',
      basePath: '/console/',
      pagePath: '/console/dynamic-route-1',
      routePath: pluginRoutePath,
      expectedPlugin: 'foo',
    },
    {
      name: 'the root route under a Console base path',
      basePath: '/console/',
      pagePath: '/console/',
      routePath: '/',
      expectedPlugin: 'foo',
    },
    {
      name: 'a path sharing only the Console base path prefix',
      basePath: '/console/',
      pagePath: '/console2/dynamic-route-1',
      routePath: pluginRoutePath,
      expectedPlugin: null,
    },
    {
      name: 'a descendant of an exact route',
      pagePath: '/dynamic-route-1/child',
      routePath: pluginRoutePath,
      exact: true,
      expectedPlugin: null,
    },
    {
      name: 'a descendant of a non-exact route',
      pagePath: '/dynamic-route-1/child',
      routePath: pluginRoutePath,
      exact: false,
      expectedPlugin: 'foo',
    },
    {
      name: 'the root of a non-exact route',
      routePath: pluginRoutePath,
      exact: false,
      expectedPlugin: 'foo',
    },
    {
      name: 'one path in a route path array',
      routePath: ['/another-route', pluginRoutePath],
      expectedPlugin: 'foo',
    },
    {
      name: 'an inactive perspective route',
      routePath: pluginRoutePath,
      perspective: 'dev',
      expectedPlugin: null,
    },
    {
      name: 'an active developer perspective route',
      routePath: pluginRoutePath,
      perspective: 'dev',
      activePerspective: 'dev',
      expectedPlugin: 'foo',
    },
    {
      name: 'a route without a perspective restriction',
      routePath: pluginRoutePath,
      activePerspective: 'dev',
      expectedPlugin: 'foo',
    },
    {
      name: 'a matching path from a different origin',
      routePath: pluginRoutePath,
      documentURI: 'https://another-origin.example/dynamic-route-1',
      expectedPlugin: null,
    },
    {
      name: 'a malformed document URI',
      routePath: pluginRoutePath,
      documentURI: 'http://[invalid',
      expectedPlugin: null,
    },
    {
      name: 'a relative document URI',
      routePath: pluginRoutePath,
      documentURI: pluginRoutePath,
      expectedPlugin: null,
    },
    {
      name: 'an inline blocked URI on a matching route',
      routePath: pluginRoutePath,
      blockedURI: 'inline',
      expectedPlugin: 'foo',
    },
  ])('handles $name', (scenario) => {
    mockCacheEvent.mockReturnValue(true);
    window.SERVER_FLAGS.basePath = scenario.basePath ?? '/';
    window.history.replaceState({}, '', scenario.pagePath ?? pluginRoutePath);
    mockActivePerspective = scenario.activePerspective ?? 'admin';
    routePages.push({
      pluginName: 'foo',
      properties: {
        path: scenario.routePath,
        exact: scenario.exact ?? true,
        perspective: scenario.perspective,
      },
    });
    const event = new MockSecurityPolicyViolationEvent(
      scenario.blockedURI ?? 'https://blocked.com',
      'browser-extension',
      scenario.documentURI ?? window.location.href,
    );
    const expected = newPluginCSPViolationEvent(scenario.expectedPlugin, event);
    renderDetector();

    act(() => {
      document.dispatchEvent(event);
    });

    expect(mockCacheEvent).toHaveBeenCalledWith(expected);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', expected);
  });

  it('counts multiple matching routes owned by the same plugin as one owner', () => {
    mockCacheEvent.mockReturnValue(true);
    activatePluginRoute('foo', 'foo');
    const event = new MockSecurityPolicyViolationEvent(
      'https://blocked.com',
      'browser-extension',
      window.location.href,
    );
    renderDetector();

    act(() => {
      document.dispatchEvent(event);
    });

    expect(mockCacheEvent).toHaveBeenCalledWith(newPluginCSPViolationEvent('foo', event));
  });

  it('prefers the plugin asset URL over the document route owner', () => {
    mockCacheEvent.mockReturnValue(true);
    activatePluginRoute('bar');
    const event = new MockSecurityPolicyViolationEvent(
      'http://localhost/api/plugins/foo/asset.js',
      'browser-extension',
      window.location.href,
    );
    renderDetector();

    act(() => {
      document.dispatchEvent(event);
    });

    expect(mockCacheEvent).toHaveBeenCalledWith(newPluginCSPViolationEvent('foo', event));
  });
});

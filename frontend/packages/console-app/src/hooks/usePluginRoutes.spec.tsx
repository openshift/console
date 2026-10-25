import type { FC } from 'react';
import { memo, forwardRef, Component as ReactComponent } from 'react';
import { screen } from '@testing-library/react';
import { Routes } from 'react-router';
import type { RoutePage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { ErrorBoundary } from '@console/shared/src/components/error/error-boundary';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  createTestPluginStore,
  createLocalPluginManifest,
  addLoadedPluginFromManifest,
} from '../components/console-operator/__tests__/pluginTestUtils';
import { usePluginRoutes } from './usePluginRoutes';

jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn(() => ['admin', jest.fn()]),
}));

const PluginRoutes: FC = () => {
  const [activeRoutes] = usePluginRoutes();
  return <Routes>{activeRoutes}</Routes>;
};

type ComponentTestCase = {
  name: string;
  pluginName: string;
  component: unknown;
  componentText?: string;
  shouldFail: boolean;
};

const componentTestCases: ComponentTestCase[] = [
  {
    name: 'regular function components',
    pluginName: 'regular-func-plugin',
    component: function TestComponent() {
      return <div>Test Component</div>;
    },
    componentText: 'Test Component',
    shouldFail: false,
  },
  {
    name: 'memoized components',
    pluginName: 'memoized-plugin',
    component: memo(() => <div>Memoized Component</div>),
    componentText: 'Memoized Component',
    shouldFail: false,
  },
  {
    name: 'forwardRef components',
    pluginName: 'forwardref-plugin',
    component: forwardRef<HTMLDivElement>((props, ref) => (
      <div ref={ref}>ForwardRef Component</div>
    )),
    componentText: 'ForwardRef Component',
    shouldFail: false,
  },
  {
    name: 'arrow function components',
    pluginName: 'arrow-plugin',
    component: () => <div>Arrow Component</div>,
    componentText: 'Arrow Component',
    shouldFail: false,
  },
  {
    name: 'class components',
    pluginName: 'class-plugin',
    component: class ClassComponent extends ReactComponent {
      render() {
        return <div>Class Component</div>;
      }
    },
    componentText: 'Class Component',
    shouldFail: false,
  },
  {
    name: 'component resolves to null',
    pluginName: 'null-plugin',
    component: null,
    shouldFail: true,
  },
  {
    name: 'component resolves to undefined',
    pluginName: 'undefined-plugin',
    component: undefined,
    shouldFail: true,
  },
  {
    name: 'component resolves to false',
    pluginName: 'false-plugin',
    component: false,
    shouldFail: true,
  },
  {
    name: 'component resolves to 0',
    pluginName: 'zero-plugin',
    component: 0,
    shouldFail: true,
  },
  {
    name: 'component resolves to empty string',
    pluginName: 'empty-string-plugin',
    component: '',
    shouldFail: true,
  },
];

describe('usePluginRoutes', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it.each(componentTestCases)(
    'loads $name',
    async ({ pluginName, component, componentText, shouldFail }) => {
      const routeExtension: RoutePage = {
        type: 'console.page/route',
        properties: {
          path: '/',
          exact: true,
          component: () => Promise.resolve(component) as Promise<React.ComponentType>,
        },
      };

      const pluginStore = createTestPluginStore((store) => {
        addLoadedPluginFromManifest(store, createLocalPluginManifest(pluginName), [routeExtension]);
      });
      const [{ uid }] = pluginStore.getExtensions();

      renderWithProviders(
        <ErrorBoundary FallbackComponent={({ errorMessage }) => <div>{errorMessage}</div>}>
          <PluginRoutes />
        </ErrorBoundary>,
        { pluginStore },
      );

      const expectedText =
        componentText ||
        `Plugin "${pluginName}" route component resolved to ${typeof component} (extension ${uid})`;

      expect(
        await screen.findByText(expectedText, undefined, { timeout: 3000 }),
      ).toBeInTheDocument();

      const pluginErrors = consoleErrorSpy.mock.calls.filter((call) => {
        const error = call[0];
        return error?.message?.includes(pluginName) && error?.message?.includes(uid);
      });
      expect(pluginErrors.length > 0).toBe(shouldFail);
    },
  );
});

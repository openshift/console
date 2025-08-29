import * as React from 'react';
import { act, cleanup, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { k8sList, k8sGet } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { setPluginStore, k8sWatch } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { Firehose } from '../firehose';
import { PodModel, podData, podList, ServiceModel } from './firehose.data';

// Mock network calls
jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  k8sList: jest.fn(() => {}),
  k8sGet: jest.fn(),
}));
jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s'),
  k8sWatch: jest.fn(),
}));
const k8sListMock = k8sList as jest.Mock;
const k8sGetMock = k8sGet as jest.Mock;
const k8sWatchMock = k8sWatch as jest.Mock;

/**
 * Firehose Component Lifecycle Tests
 *
 * These tests focus on component lifecycle, rendering optimization, and prop/state management.
 * Converted from Enzyme shallow rendering tests to RTL integration tests.
 */
describe('Firehose component lifecycle and optimization', () => {
  // Test component to track render calls
  const renderCountUpdate = jest.fn();
  const LifecycleTest: React.FC = (props) => {
    renderCountUpdate(props);
    return <div data-testid="lifecycle-component">Lifecycle Test</div>;
  };

  beforeEach(() => {
    // Init plugin store
    setPluginStore({ getExtensionsInUse: () => [] });

    jest.useFakeTimers();
    jest.resetAllMocks();

    // Mock successful API responses
    k8sListMock.mockReturnValue(Promise.resolve(podList));
    k8sGetMock.mockReturnValue(Promise.resolve(podData));
    const wsMock = {
      onclose: () => wsMock,
      ondestroy: () => wsMock,
      onbulkmessage: () => wsMock,
      destroy: () => wsMock,
    };
    k8sWatchMock.mockReturnValue(wsMock);
  });

  afterEach(async () => {
    // Ensure that there is no timer left which triggers a rerendering
    await act(async () => {
      jest.runAllTimers();
    });

    cleanup();

    // Reset for next test
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('conditional rendering based on model availability', () => {
    it('should not render children when there are no cached models', () => {
      const resources = [
        {
          prop: 'pods',
          kind: 'Pod',
          isList: true,
          namespace: 'my-namespace',
        },
      ];

      // Use renderWithProviders without any k8s models (simulates inFlight state with no models)
      renderWithProviders(
        <Firehose resources={resources}>
          <LifecycleTest />
        </Firehose>,
      );

      // Should not render children when no models are available
      expect(screen.queryByTestId('lifecycle-component')).not.toBeInTheDocument();
      expect(renderCountUpdate).not.toHaveBeenCalled();
    });

    it('should not render children when required model is missing', () => {
      const resources = [
        {
          prop: 'services',
          kind: ServiceModel,
          isList: true,
          namespace: 'my-namespace',
        },
      ];

      // Use renderWithProviders (default models don't include ServiceModel)
      renderWithProviders(
        <Firehose resources={resources}>
          <LifecycleTest />
        </Firehose>,
      );

      // Should not render children when required model is missing
      expect(screen.queryByTestId('lifecycle-component')).not.toBeInTheDocument();
      expect(renderCountUpdate).not.toHaveBeenCalled();
    });

    it('should render children when cached model is available', async () => {
      const resources = [
        {
          prop: 'pods',
          kind: PodModel,
          isList: true,
          namespace: 'my-namespace',
        },
      ];

      renderWithProviders(
        <Firehose resources={resources}>
          <LifecycleTest />
        </Firehose>,
      );

      // Should render children when model is available
      expect(screen.getByTestId('lifecycle-component')).toBeInTheDocument();
      expect(renderCountUpdate).toHaveBeenCalled();

      // Should start API call for the resource
      expect(k8sListMock).toHaveBeenCalledWith(
        PodModel,
        { limit: 250, ns: 'my-namespace' },
        true,
        {},
      );
    });
  });

  describe('resource management and updates', () => {
    it('should restart firehoses when resources change', async () => {
      const initialResources = [
        {
          prop: 'pods',
          kind: PodModel,
          isList: true,
          namespace: 'my-namespace',
        },
      ];

      const { rerender } = renderWithProviders(
        <Firehose resources={initialResources}>
          <LifecycleTest />
        </Firehose>,
      );

      // Initial render should start watching
      expect(k8sListMock).toHaveBeenCalledTimes(1);
      k8sListMock.mockClear();

      // Add another resource - should trigger new watches
      const updatedResources = [
        ...initialResources,
        {
          prop: 'singlePod',
          kind: PodModel,
          namespace: 'my-namespace',
          name: 'specific-pod',
        },
      ];

      rerender(
        <Firehose resources={updatedResources}>
          <LifecycleTest />
        </Firehose>,
      );

      // Should start watching the new resource
      expect(k8sGetMock).toHaveBeenCalledWith(PodModel, 'specific-pod', 'my-namespace', {}, {});
    });

    it('should handle prop changes efficiently', async () => {
      const resources = [
        {
          prop: 'pods',
          kind: PodModel,
          isList: true,
          namespace: 'my-namespace',
        },
      ];

      const TestComponent: React.FC<{ customProp?: string }> = ({ customProp }) => {
        renderCountUpdate({ customProp });
        return <div data-testid="test-component">{customProp || 'default'}</div>;
      };

      const { rerender } = renderWithProviders(
        <Firehose resources={resources}>
          <TestComponent customProp="initial" />
        </Firehose>,
      );

      expect(screen.getByText('initial')).toBeInTheDocument();
      expect(renderCountUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ customProp: 'initial' }),
      );

      const initialCallCount = renderCountUpdate.mock.calls.length;

      // Change the prop - should trigger re-render
      rerender(
        <Firehose resources={resources}>
          <TestComponent customProp="updated" />
        </Firehose>,
      );

      expect(screen.getByText('updated')).toBeInTheDocument();
      expect(renderCountUpdate.mock.calls.length).toBeGreaterThan(initialCallCount);
      expect(renderCountUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ customProp: 'updated' }),
      );
    });
  });

  describe('multiple children handling', () => {
    it('should pass same props to multiple children', async () => {
      const resources = [
        {
          prop: 'pods',
          kind: PodModel,
          isList: true,
          namespace: 'my-namespace',
        },
      ];

      const childARenderSpy = jest.fn();
      const childBRenderSpy = jest.fn();

      const ChildA: React.FCC = (props) => {
        childARenderSpy(props);
        return <div data-testid="child-a">Child A</div>;
      };

      const ChildB: React.FCC = (props) => {
        childBRenderSpy(props);
        return <div data-testid="child-b">Child B</div>;
      };

      renderWithProviders(
        <Firehose resources={resources}>
          <ChildA />
          <ChildB />
        </Firehose>,
      );

      // Both children should be rendered
      expect(screen.getByTestId('child-a')).toBeInTheDocument();
      expect(screen.getByTestId('child-b')).toBeInTheDocument();

      // Both should receive props (initially loading state)
      expect(childARenderSpy).toHaveBeenCalled();
      expect(childBRenderSpy).toHaveBeenCalled();

      // API should only be called once despite multiple children
      expect(k8sListMock).toHaveBeenCalledTimes(1);
    });
  });
});

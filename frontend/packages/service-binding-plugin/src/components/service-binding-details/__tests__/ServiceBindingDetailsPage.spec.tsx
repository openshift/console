import * as React from 'react';
import { render, act, configure } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { Firehose } from '@console/internal/components/utils/firehose';
import { modelFor, useModelFinder } from '@console/internal/module/k8s';
import store from '@console/internal/redux';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import {
  connectedServiceBinding,
  connectedServiceBindingWithLabelSelector,
  failedServiceBinding,
} from '../../../__tests__/mock-data';
import { ServiceBindingModel } from '../../../models';
import ServiceBindingDetailsPage from '../ServiceBindingDetailsPage';

jest.mock('@console/plugin-sdk', () => ({
  ...require.requireActual('@console/plugin-sdk'),
  useExtensions: () => [],
  useResolvedExtensions: () => [[]],
}));

jest.mock('@console/shared/src/components/error/error-boundary', () => ({
  ...require.requireActual('@console/shared/src/components/error/error-boundary'),
  withFallback: (children) => children,
}));

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  ...require.requireActual('@console/shared/src/hooks/useK8sModel'),
  useK8sModel: jest.fn(),
}));

jest.mock('@console/internal/module/k8s/k8s-models', () => ({
  ...require.requireActual('@console/internal/module/k8s/k8s-models'),
  modelFor: jest.fn(),
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...require.requireActual('@console/internal/module/k8s'),
  useModelFinder: jest.fn(() => ({
    findModel: jest.fn(),
  })),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  ...require.requireActual('@console/internal/components/utils/rbac'),
  useAccessReview: () => true,
}));

jest.mock('@console/internal/components/utils/timestamp', () => ({
  Timestamp: ({ timestamp }) => timestamp || null,
}));

jest.mock('@console/internal/components/utils/firehose', () => ({
  ...require.requireActual('@console/internal/components/utils/firehose'),
  Firehose: jest.fn(),
}));

jest.mock('@console/shared/src/components/actions', () => ({
  ...require.requireActual('@console/shared/src/components/actions'),
  ActionServiceProvider: () => null,
}));

const Wrapper: React.FC = ({ children }) => (
  <MemoryRouter>
    <Provider store={store}>{children}</Provider>
  </MemoryRouter>
);

(modelFor as jest.Mock).mockReturnValue(ServiceBindingModel);
(useK8sModel as jest.Mock).mockReturnValue([ServiceBindingModel]);
(useModelFinder as jest.Mock).mockImplementation(() => ({ findModel: () => ServiceBindingModel }));

configure({ testIdAttribute: 'data-test' });

describe('ServiceBindingDetailsPage', () => {
  it('should render a connected SB with the right status and attributes', async () => {
    ((Firehose as any) as jest.Mock).mockImplementation((props) => {
      const childProps = {
        obj: {
          loaded: true,
          data: connectedServiceBinding,
        },
      };
      return React.Children.map(props.children, (child) => React.cloneElement(child, childProps));
    });

    const matchExistingServiceBinding = {
      params: { ns: 'a-namespace', name: 'connected-service-binding' },
      isExact: true,
      path: '/',
      url: '',
    };

    const renderResult = render(
      <Wrapper>
        <ServiceBindingDetailsPage match={matchExistingServiceBinding} kind="" />
      </Wrapper>,
    );
    // Consume one rerendering to hide 'test was not wrapped in act' warnings
    await act(async () => null);

    renderResult.getAllByText('ServiceBinding details');

    // Name
    renderResult.getByText('Name');
    renderResult.getByText('connected-service-binding');

    // Status
    renderResult.getAllByText('Status');
    renderResult.getAllByText('Connected');
    expect(renderResult.queryAllByText('Error')).toEqual([]);

    // Application
    renderResult.getByText('Application');
    renderResult.getByText('nodeinfo-from-source');

    // Services
    renderResult.getByText('Services');
    renderResult.getByText('example');

    // Conditions
    renderResult.getByText('Conditions');
    renderResult.getByText('Ready');
  });

  it('should render a failed SB with the right status and attributes', async () => {
    ((Firehose as any) as jest.Mock).mockImplementation((props) => {
      const childProps = {
        obj: {
          loaded: true,
          data: failedServiceBinding,
        },
      };
      return React.Children.map(props.children, (child) => React.cloneElement(child, childProps));
    });

    const matchExistingServiceBinding = {
      params: { ns: 'a-namespace', name: 'failed-service-binding' },
      isExact: true,
      path: '',
      url: '',
    };

    const renderResult = render(
      <Wrapper>
        <ServiceBindingDetailsPage match={matchExistingServiceBinding} kind="" />
      </Wrapper>,
    );
    // Consume one rerendering to hide 'test was not wrapped in act' warnings
    await act(async () => null);

    renderResult.getAllByText('ServiceBinding details');

    // Name
    renderResult.getByText('Name');
    renderResult.getByText('failed-service-binding');

    // Status
    renderResult.getAllByText('Status');
    expect(renderResult.queryAllByText('Connected')).toEqual([]);
    renderResult.getAllByText('Error');

    // Application
    renderResult.getByText('Application');
    renderResult.getByText('nodeinfo');

    // Services
    renderResult.getByText('Services');
    renderResult.getByText('redis-standalone');

    // Conditions
    renderResult.getByText('Conditions');
    renderResult.getByText('Ready');
    renderResult.getByText('ErrorReadingBinding');
    renderResult.getAllByText('redisSecret is not found');
  });

  it('should render a connected SB using label selector with the right status and attributes', async () => {
    ((Firehose as any) as jest.Mock).mockImplementation((props) => {
      const childProps = {
        obj: {
          loaded: true,
          data: connectedServiceBindingWithLabelSelector,
        },
      };
      return React.Children.map(props.children, (child) => React.cloneElement(child, childProps));
    });

    const matchExistingServiceBinding = {
      params: { ns: 'a-namespace', name: 'connected-service-binding-with-label-selector' },
      isExact: true,
      path: '/',
      url: '',
    };

    const renderResult = render(
      <Wrapper>
        <ServiceBindingDetailsPage match={matchExistingServiceBinding} kind="" />
      </Wrapper>,
    );
    // Consume one rerendering to hide 'test was not wrapped in act' warnings
    await act(async () => null);

    renderResult.getAllByText('ServiceBinding details');

    // Name
    renderResult.getByText('Name');
    renderResult.getByText('connected-service-binding-with-label-selector');

    // Status
    renderResult.getAllByText('Status');
    renderResult.getAllByText('Connected');
    expect(renderResult.queryAllByText('Error')).toEqual([]);

    // Application
    renderResult.getByText('Label Selector');
    expect(renderResult.getByTestId('label-list').textContent).toEqual('test=test');

    // Services
    renderResult.getByText('Services');
    renderResult.getByText('example');

    // Conditions
    renderResult.getByText('Conditions');
    renderResult.getByText('Ready');
  });
});

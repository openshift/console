import * as React from 'react';
import { configure, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { modelFor, useModelFinder } from '@console/internal/module/k8s';
import store from '@console/internal/redux';
import {
  connectedServiceBinding,
  connectedServiceBindingWithLabelSelector,
  failedServiceBinding,
} from '../../../__tests__/mock-data';
import { ServiceBindingModel } from '../../../models';
import ServiceBindingDetailsTab from '../ServiceBindingDetailsTab';

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  ...require.requireActual('@console/shared/src/hooks/useK8sModel'),
  useK8sModel: () => [],
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

(modelFor as jest.Mock).mockReturnValue(ServiceBindingModel);
(useModelFinder as jest.Mock).mockImplementation(() => ({ findModel: () => ServiceBindingModel }));

configure({ testIdAttribute: 'data-test' });

const Wrapper: React.FC = ({ children }) => (
  <MemoryRouter>
    <Provider store={store}>{children}</Provider>
  </MemoryRouter>
);

describe('ServiceBindingDetailsTab', () => {
  it('should render a connected SB with the right status and attributes', () => {
    const renderResult = render(
      <Wrapper>
        <ServiceBindingDetailsTab obj={connectedServiceBinding} />
      </Wrapper>,
    );
    renderResult.getByText('ServiceBinding details');

    // Name
    renderResult.getByText('Name');
    renderResult.getByText('connected-service-binding');

    // Status
    renderResult.getAllByText('Status');
    renderResult.getByText('Connected');
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

  it('should render a failed SB with the right status and attributes', () => {
    const renderResult = render(
      <Wrapper>
        <ServiceBindingDetailsTab obj={failedServiceBinding} />
      </Wrapper>,
    );
    renderResult.getByText('ServiceBinding details');

    // Name
    renderResult.getByText('Name');
    renderResult.getByText('failed-service-binding');

    // Status
    renderResult.getAllByText('Status');
    expect(renderResult.queryAllByText('Connected')).toEqual([]);
    renderResult.getByText('Error');

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

  it('should render a connected SB using label selector with the right status and attributes', () => {
    const renderResult = render(
      <Wrapper>
        <ServiceBindingDetailsTab obj={connectedServiceBindingWithLabelSelector} />
      </Wrapper>,
    );

    renderResult.getByText('ServiceBinding details');

    // Name
    renderResult.getByText('Name');
    renderResult.getByText('connected-service-binding-with-label-selector');

    // Status
    renderResult.getAllByText('Status');
    renderResult.getByText('Connected');
    expect(renderResult.queryAllByText('Error')).toEqual([]);

    // Label Selector
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

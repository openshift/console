import * as React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { modelFor } from '@console/internal/module/k8s';
import { connectedServiceBinding, failedServiceBinding } from '../../../__tests__/mock-data';
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

jest.mock('@console/internal/components/utils/rbac', () => ({
  ...require.requireActual('@console/internal/components/utils/rbac'),
  useAccessReview: () => true,
}));

jest.mock('@console/internal/components/utils/timestamp', () => ({
  Timestamp: ({ timestamp }) => timestamp || null,
}));

(modelFor as jest.Mock).mockReturnValue(ServiceBindingModel);

const Wrapper: React.FC = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

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
});

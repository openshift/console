import * as React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { NamespaceModel } from '@console/internal/models';
import { modelFor } from '@console/internal/module/k8s/k8s-models';
import store from '@console/internal/redux';
import { connectedServiceBinding, failedServiceBinding } from '../../../__tests__/mock-data';
import { ServiceBindingModel } from '../../../models';
import { ServiceBindingHeader, ServiceBindingRow } from '../ServiceBindingTable';

jest.mock('@console/internal/module/k8s/k8s-models', () => ({
  ...require.requireActual('@console/internal/module/k8s/k8s-models'),
  modelFor: jest.fn(),
}));

(modelFor as jest.Mock).mockImplementation((ref: string) => {
  if (ref === 'Namespace') return NamespaceModel;
  if (ref.endsWith('ServiceBinding')) return ServiceBindingModel;
  throw new Error(`Unexpected model when mocking 'modelFor': ${ref}`);
});

const Wrapper: React.FC = ({ children }) => (
  <MemoryRouter>
    <Provider store={store}>{children}</Provider>
  </MemoryRouter>
);

describe('ServiceBindingHeader', () => {
  it('should have at least a name and a status column', () => {
    const columns = ServiceBindingHeader();
    expect(columns.map((c) => c.title === 'Name')).toBeTruthy();
    expect(columns.map((c) => c.title === 'Status')).toBeTruthy();
  });
});

describe('ServiceBindingRow', () => {
  it('should render a connected SB with the right status and attributes', async () => {
    const renderResult = render(
      <Wrapper>
        <table>
          <tbody>
            <tr>
              <ServiceBindingRow columns={[]} obj={connectedServiceBinding} />
            </tr>
          </tbody>
        </table>
      </Wrapper>,
    );

    // Name
    renderResult.getByText('connected-service-binding');

    // Status
    renderResult.getAllByText('Connected');
    expect(renderResult.queryAllByText('Error')).toEqual([]);
  });

  it('should render a failed SB with the right status and attributes', async () => {
    const renderResult = render(
      <Wrapper>
        <table>
          <tbody>
            <tr>
              <ServiceBindingRow columns={[]} obj={failedServiceBinding} />
            </tr>
          </tbody>
        </table>
      </Wrapper>,
    );

    // Name
    renderResult.getByText('failed-service-binding');

    // Status
    expect(renderResult.queryAllByText('Connected')).toEqual([]);
    renderResult.getAllByText('Error');
  });
});

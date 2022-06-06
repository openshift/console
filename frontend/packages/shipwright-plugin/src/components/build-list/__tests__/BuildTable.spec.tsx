import * as React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { NamespaceModel } from '@console/internal/models';
import { modelFor } from '@console/internal/module/k8s/k8s-models';
import store from '@console/internal/redux';
import { incompleteBuild } from '../../../__tests__/mock-data.spec';
import { BuildModel } from '../../../models';
import { BuildHeader, BuildRow } from '../BuildTable';

jest.mock('@console/internal/module/k8s/k8s-models', () => ({
  ...require.requireActual('@console/internal/module/k8s/k8s-models'),
  modelFor: jest.fn(),
}));

(modelFor as jest.Mock).mockImplementation((ref: string) => {
  if (ref === 'Namespace') return NamespaceModel;
  if (ref.endsWith('Build')) return BuildModel;
  throw new Error(`Unexpected model when mocking 'modelFor': ${ref}`);
});

const Wrapper: React.FC = ({ children }) => (
  <MemoryRouter>
    <Provider store={store}>{children}</Provider>
  </MemoryRouter>
);

describe('BuildHeader', () => {
  it('should have at least a name and a status column', () => {
    const columns = BuildHeader();
    expect(columns.map((c) => c.title === 'Name')).toBeTruthy();
    expect(columns.map((c) => c.title === 'Status')).toBeTruthy();
  });
});

describe('BuildRow', () => {
  it('should render a connected SB with the right status and attributes', async () => {
    const renderResult = render(
      <Wrapper>
        <table>
          <tbody>
            <tr>
              <BuildRow columns={[]} obj={incompleteBuild} />
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
              <BuildRow columns={[]} obj={incompleteBuild} />
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

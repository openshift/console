import * as React from 'react';
import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { Firehose } from '@console/internal/components/utils/firehose';
import { modelFor } from '@console/internal/module/k8s/k8s-models';
import store from '@console/internal/redux';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { incompleteBuild } from '../../../__tests__/mock-data.spec';
import { BuildModel } from '../../../models';
import BuildDetailsPage from '../BuildDetailsPage';

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

(modelFor as jest.Mock).mockReturnValue(BuildModel);
(useK8sModel as jest.Mock).mockReturnValue([BuildModel]);

describe('BuildDetailsPage', () => {
  // it('should render a Tech Preview badge', async () => {
  //   const renderResult = render(
  //     <Wrapper>
  //       <BuildDetailsPage match={matchExistingBuild} kind="" />
  //     </Wrapper>,
  //   );
  //   // Consume one rerendering to hide 'test was not wrapped in act' warnings
  //   await act(async () => null);

  //   renderResult.getAllByText('Build details');

  //   // Name
  //   renderResult.getByText('Name');
  // });

  it('should render a connected SB with the right status and attributes', async () => {
    ((Firehose as any) as jest.Mock).mockImplementation((props) => {
      const childProps = {
        obj: {
          loaded: true,
          data: incompleteBuild,
        },
      };
      return React.Children.map(props.children, (child) => React.cloneElement(child, childProps));
    });

    const matchExistingBuild = {
      params: { ns: 'a-namespace', name: 'connected-service-binding' },
      isExact: true,
      path: '/',
      url: '',
    };

    const renderResult = render(
      <Wrapper>
        <BuildDetailsPage match={matchExistingBuild} kind="" />
      </Wrapper>,
    );
    // Consume one rerendering to hide 'test was not wrapped in act' warnings
    await act(async () => null);

    renderResult.getAllByText('Build details');

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
          data: incompleteBuild,
        },
      };
      return React.Children.map(props.children, (child) => React.cloneElement(child, childProps));
    });

    const matchExistingBuild = {
      params: { ns: 'a-namespace', name: 'failed-service-binding' },
      isExact: true,
      path: '',
      url: '',
    };

    const renderResult = render(
      <Wrapper>
        <BuildDetailsPage match={matchExistingBuild} kind="" />
      </Wrapper>,
    );
    // Consume one rerendering to hide 'test was not wrapped in act' warnings
    await act(async () => null);

    renderResult.getAllByText('Build details');

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
});

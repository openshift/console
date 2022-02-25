import * as React from 'react';
import { cleanup, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import store from '@console/internal/redux';
import { useActiveNamespace } from '@console/shared/src/hooks';
import NamespacedPage from '../NamespacedPage';

const Wrapper: React.FC<{}> = ({ children }) => <Provider store={store}>{children}</Provider>;

jest.mock('react-redux', () => ({
  ...require.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('@console/shared/src/hooks', () => ({
  ...require.requireActual('@console/shared/src/hooks'),
  useActiveNamespace: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  ...require.requireActual('@console/internal/components/utils/k8s-watch-hook'),
  useK8sWatchResource: jest.fn(),
}));

const useActiveNamespaceMock = useActiveNamespace as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

afterEach(() => {
  cleanup();
});

describe('NamespacedPage', () => {
  it("should render Namespace not found if the active namespace doesn't exist", () => {
    useActiveNamespaceMock.mockReturnValue('my-namespace');
    const allProjects: K8sResourceKind[] = [
      {
        metadata: { name: 'existing-project' },
      },
    ];
    useK8sWatchResourceMock.mockReturnValue([allProjects, true, undefined]);

    const renderResult = render(
      <Wrapper>
        <NamespacedPage />
      </Wrapper>,
    );
    expect(renderResult.getByText('404: Namespace not found')).toBeTruthy();
  });
});

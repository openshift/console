import { render, screen, configure } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useProjectOrNamespaceModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NamespaceModel } from '@console/internal/models';
import store from '@console/internal/redux';
import NamespaceDropdown from '../NamespaceDropdown';
import { usePreferredNamespace } from '../usePreferredNamespace';
import { mockNamespaces } from './namespace.data';

jest.mock('@console/internal/components/utils/list-dropdown', () => ({
  useProjectOrNamespaceModel: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('../usePreferredNamespace', () => ({
  usePreferredNamespace: jest.fn(),
}));

jest.mock('fuzzysearch', () => {
  return { default: jest.fn() };
});

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

const mockProjectOrNamespaceModel = useProjectOrNamespaceModel as jest.Mock;
const mockK8sWatchResource = useK8sWatchResource as jest.Mock;
const mockUsePreferredNamespace = usePreferredNamespace as jest.Mock;

describe('NamespaceDropdown', () => {
  const preferredNamespace: string = mockNamespaces[1].metadata.name;

  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if extensions have not loaded', () => {
    mockProjectOrNamespaceModel.mockReturnValue([NamespaceModel, true]);
    mockK8sWatchResource.mockReturnValue([mockNamespaces, true, false]);
    mockUsePreferredNamespace.mockReturnValue(['', jest.fn(), false]);

    render(
      <Provider store={store}>
        <NamespaceDropdown />
      </Provider>,
    );

    expect(screen.getByTestId('dropdown skeleton console.preferredNamespace')).toBeInTheDocument();
  });

  it('should render menu with preferred namespace if extensions have loaded and user preference for namespace is defined', () => {
    mockProjectOrNamespaceModel.mockReturnValue([NamespaceModel, true]);
    mockK8sWatchResource.mockReturnValue([mockNamespaces, true, false]);
    mockUsePreferredNamespace.mockReturnValue([preferredNamespace, jest.fn(), true]);

    render(
      <Provider store={store}>
        <NamespaceDropdown />
      </Provider>,
    );

    expect(screen.getByTestId('dropdown console.preferredNamespace')).toBeInTheDocument();
    expect(screen.getByText(preferredNamespace)).toBeInTheDocument();
  });

  it('should render select with "Last viewed" if extensions have loaded but user preference for namespace is not defined', () => {
    mockProjectOrNamespaceModel.mockReturnValue([NamespaceModel, true]);
    mockK8sWatchResource.mockReturnValue([mockNamespaces, true, false]);
    mockUsePreferredNamespace.mockReturnValue([undefined, jest.fn(), true]);

    render(
      <Provider store={store}>
        <NamespaceDropdown />
      </Provider>,
    );

    expect(screen.getByTestId('dropdown console.preferredNamespace')).toBeInTheDocument();
    expect(screen.getByText('Last viewed')).toBeInTheDocument();
  });
});

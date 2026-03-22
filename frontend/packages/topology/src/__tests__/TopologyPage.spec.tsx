import { configure, screen } from '@testing-library/react';
import * as Router from 'react-router';
import { useQueryParams } from '@console/shared/src/hooks/useQueryParams';
import * as RouterUtils from '@console/shared/src/hooks/useQueryParamsMutator';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { TopologyPage } from '../components/page/TopologyPage';
import { TopologyViewType } from '../topology-types';
import { usePreferredTopologyView } from '../user-preferences/usePreferredTopologyView';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
  useK8sWatchResource: jest.fn(() => [[], true, null]),
}));

jest.mock('@console/shared/src/hooks/useClusterVersion', () => ({
  useClusterVersion: jest.fn(() => [{}, true]),
}));

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useQueryParams', () => ({
  useQueryParams: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

jest.mock('../user-preferences/usePreferredTopologyView', () => ({
  usePreferredTopologyView: jest.fn(),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useQueryParamsMutator', () => ({
  ...jest.requireActual('@console/shared/src/hooks/useQueryParamsMutator'),
  useQueryParamsMutator: jest.fn(),
}));

jest.mock('../filters/FilterProvider', () => ({
  ...jest.requireActual('../filters/FilterProvider'),
  FilterProvider: 'FilterProvider',
}));

jest.mock('@console/dev-console/src/components/NamespacedPage', () => ({
  __esModule: true,
  default: 'NamespacedPage',
  NamespacedPageVariants: {
    default: 'default',
    light: 'light',
  },
}));

jest.mock('@console/internal/components/start-guide', () => ({
  __esModule: true,
  withStartGuide: () => 'withStartGuide',
}));

const useUserPreferenceMock = useUserPreference as jest.Mock;
const usePreferredTopologyViewMock = usePreferredTopologyView as jest.Mock;
const useQueryParamsMock = useQueryParams as jest.Mock;

configure({ testIdAttribute: 'data-test-id' });

describe('TopologyPage view logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Router.useParams as jest.Mock).mockReturnValue({ name: 'default' });

    // Mock useQueryParamsMutator
    (RouterUtils.useQueryParamsMutator as jest.Mock).mockReturnValue({
      getQueryArgument: jest.fn(),
      setQueryArgument: jest.fn(),
      setQueryArguments: jest.fn(),
      setAllQueryArguments: jest.fn(),
      removeQueryArgument: jest.fn(),
      removeQueryArguments: jest.fn(),
      setOrRemoveQueryArgument: jest.fn(),
    });
  });

  it('should default to graph view', () => {
    useUserPreferenceMock.mockReturnValue(['', () => {}, true]);
    usePreferredTopologyViewMock.mockReturnValue(['', true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams('view=graph'));
    renderWithProviders(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should allow setting default to list view', () => {
    useUserPreferenceMock.mockReturnValue(['', () => {}]);
    usePreferredTopologyViewMock.mockReturnValue(['', true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams('view=list'));
    renderWithProviders(<TopologyPage defaultViewType={TopologyViewType.list} />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });

  it('should prefer view from URL over user settings', () => {
    useUserPreferenceMock.mockReturnValue(['list', () => {}, true]);
    usePreferredTopologyViewMock.mockReturnValue(['list', true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams('view=graph'));
    renderWithProviders(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should use preferred user setting if valid and all settings loaded', () => {
    useUserPreferenceMock.mockReturnValue(['list', () => {}, true]);
    usePreferredTopologyViewMock.mockReturnValue(['graph', true]);
    renderWithProviders(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should use last-viewed if preferred view is "latest"', () => {
    useUserPreferenceMock.mockReturnValue(['graph', () => {}, true]);
    usePreferredTopologyViewMock.mockReturnValue(['latest', true]);
    renderWithProviders(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should use last-viewed if preferred view is undefined', () => {
    useUserPreferenceMock.mockReturnValue(['list', () => {}, true]);
    usePreferredTopologyViewMock.mockReturnValue([undefined, true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams('view=list'));
    renderWithProviders(<TopologyPage />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });

  it('should use defaultViewType if both preferred and last-viewed are undefined', () => {
    useUserPreferenceMock.mockReturnValue([undefined, () => {}, true]);
    usePreferredTopologyViewMock.mockReturnValue([undefined, true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams('view=list'));
    renderWithProviders(<TopologyPage defaultViewType={TopologyViewType.list} />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });

  it('should support URL view=graph', () => {
    useUserPreferenceMock.mockReturnValue(['', () => {}, true]);
    usePreferredTopologyViewMock.mockReturnValue(['', true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams('view=graph'));
    renderWithProviders(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should support URL view=list', () => {
    useUserPreferenceMock.mockReturnValue(['', () => {}]);
    usePreferredTopologyViewMock.mockReturnValue(['', true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams('view=list'));
    renderWithProviders(<TopologyPage />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });
});

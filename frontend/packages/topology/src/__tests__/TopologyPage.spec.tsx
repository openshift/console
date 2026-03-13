import { configure, screen } from '@testing-library/react';
import * as Router from 'react-router';
import { useQueryParams, useUserPreferenceCompatibility } from '@console/shared/src';
import * as RouterUtils from '@console/shared/src/hooks/useQueryParamsMutator';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { TopologyPage } from '../components/page/TopologyPage';
import { TopologyViewType } from '../topology-types';
import { usePreferredTopologyView } from '../user-preferences/usePreferredTopologyView';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
  useK8sWatchResource: jest.fn(() => [[], true, null]),
}));

jest.mock('@console/shared/src/hooks/version', () => ({
  useClusterVersion: jest.fn(() => [{}, true]),
}));

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: jest.fn(),
}));

jest.mock('@console/shared/src', () => {
  const ActualShared = jest.requireActual('@console/shared/src');
  return {
    ...ActualShared,
    useQueryParams: jest.fn(),
    useUserPreferenceCompatibility: jest.fn(),
  };
});

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
    (useUserPreferenceCompatibility as jest.Mock).mockReturnValue(['', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=graph'));
    renderWithProviders(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should allow setting default to list view', () => {
    (useUserPreferenceCompatibility as jest.Mock).mockReturnValue(['', () => {}]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=list'));
    renderWithProviders(<TopologyPage defaultViewType={TopologyViewType.list} />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });

  it('should prefer view from URL over user settings', () => {
    (useUserPreferenceCompatibility as jest.Mock).mockReturnValue(['list', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['list', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=graph'));
    renderWithProviders(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should use preferred user setting if valid and all settings loaded', () => {
    (useUserPreferenceCompatibility as jest.Mock).mockReturnValue(['list', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['graph', true]);
    renderWithProviders(<TopologyPage activeViewStorageKey="fake-key" />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should use last-viewed if preferred view is "latest"', () => {
    (useUserPreferenceCompatibility as jest.Mock).mockReturnValue(['graph', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['latest', true]);
    renderWithProviders(<TopologyPage activeViewStorageKey="fake-key" />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should use last-viewed if preferred view is undefined', () => {
    (useUserPreferenceCompatibility as jest.Mock).mockReturnValue(['list', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue([undefined, true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=list'));
    renderWithProviders(<TopologyPage activeViewStorageKey="fake-key" />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });

  it('should use defaultViewType if both preferred and last-viewed are undefined', () => {
    (useUserPreferenceCompatibility as jest.Mock).mockReturnValue([undefined, () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue([undefined, true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=list'));
    renderWithProviders(<TopologyPage defaultViewType={TopologyViewType.list} />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });

  it('should support URL view=graph', () => {
    (useUserPreferenceCompatibility as jest.Mock).mockReturnValue(['', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=graph'));
    renderWithProviders(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should support URL view=list', () => {
    (useUserPreferenceCompatibility as jest.Mock).mockReturnValue(['', () => {}]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=list'));
    renderWithProviders(<TopologyPage />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });
});

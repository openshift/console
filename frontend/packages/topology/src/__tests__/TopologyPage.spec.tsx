import { configure, render, screen } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import * as RouterUtils from '@console/internal/components/utils/router';
import { useQueryParams, useUserSettingsCompatibility } from '@console/shared/src';
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

jest.mock('react-redux', () => {
  const ActualReactRedux = jest.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});

jest.mock('@console/shared/src', () => {
  const ActualShared = jest.requireActual('@console/shared/src');
  return {
    ...ActualShared,
    useQueryParams: jest.fn(),
    useUserSettingsCompatibility: jest.fn(),
  };
});

jest.mock('../user-preferences/usePreferredTopologyView', () => ({
  usePreferredTopologyView: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/utils/router', () => ({
  ...jest.requireActual('@console/internal/components/utils/router'),
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
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=graph'));
    render(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should allow setting default to list view', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=list'));
    render(<TopologyPage defaultViewType={TopologyViewType.list} />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });

  it('should prefer view from URL over user settings', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['list', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['list', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=graph'));
    render(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should use preferred user setting if valid and all settings loaded', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['list', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['graph', true]);
    render(<TopologyPage activeViewStorageKey="fake-key" />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should use last-viewed if preferred view is "latest"', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['graph', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['latest', true]);
    render(<TopologyPage activeViewStorageKey="fake-key" />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should use last-viewed if preferred view is undefined', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['list', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue([undefined, true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=list'));
    render(<TopologyPage activeViewStorageKey="fake-key" />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });

  it('should use defaultViewType if both preferred and last-viewed are undefined', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue([undefined, () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue([undefined, true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=list'));
    render(<TopologyPage defaultViewType={TopologyViewType.list} />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });

  it('should support URL view=graph', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}, true]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=graph'));
    render(<TopologyPage />);
    expect(screen.queryByTestId('topology-list-page')).not.toBeInTheDocument();
  });

  it('should support URL view=list', () => {
    (useUserSettingsCompatibility as jest.Mock).mockReturnValue(['', () => {}]);
    (usePreferredTopologyView as jest.Mock).mockReturnValue(['', true]);
    (useQueryParams as jest.Mock).mockReturnValue(new URLSearchParams('view=list'));
    render(<TopologyPage />);
    expect(screen.getByTestId('topology-list-page')).toBeInTheDocument();
  });
});

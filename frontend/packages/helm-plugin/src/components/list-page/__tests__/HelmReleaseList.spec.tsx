import { act, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { fetchHelmReleases } from '../../../utils/helm-utils';
import HelmReleaseList from '../HelmReleaseList';

const mockUseParams = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => mockUseParams(),
  Link: ({ children, to }: any) => (
    <a href={typeof to === 'string' ? to : to.pathname}>{children}</a>
  ),
}));

const mockUseK8sWatchResource = jest.fn();
jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: (...args: any[]) => mockUseK8sWatchResource(...args),
}));

jest.mock('@console/app/src/components/data-view/ConsoleDataView', () => ({
  ConsoleDataView: ({ label, data, loaded, loadError }: any) => (
    <div data-test="console-data-view">
      <span data-test="data-view-label">{label}</span>
      {!loaded && <span>Loading...</span>}
      {loadError && <span data-test="load-error">{String(loadError)}</span>}
      {loaded && !loadError && <span data-test="data-count">{data?.length ?? 0} releases</span>}
    </div>
  ),
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: () => <div data-test="loading-box">Loading...</div>,
}));

jest.mock('@console/shared/src/components/catalog/utils/catalog-utils', () => ({
  isCatalogTypeEnabled: jest.fn(() => true),
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: ({ children }: any) => <title>{children}</title>,
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-test="pane-body">{children}</div>,
}));

jest.mock('../../../utils/icons', () => ({
  HelmCatalogIcon: () => null,
}));

jest.mock('../HelmReleaseListRow', () => ({
  getDataViewRows: jest.fn(() => []),
  tableColumnInfo: [
    { id: 'name' },
    { id: 'namespace' },
    { id: 'revision' },
    { id: 'updated' },
    { id: 'status' },
    { id: 'chart-name' },
    { id: 'chart-version' },
    { id: 'app-version' },
    { id: 'actions' },
  ],
}));

jest.mock('@patternfly/react-data-view', () => ({
  DataViewCheckboxFilter: () => null,
}));

jest.mock('../../../utils/helm-utils', () => ({
  ...jest.requireActual('../../../utils/helm-utils'),
  fetchHelmReleases: jest.fn(),
}));

const mockHelmRelease = {
  name: 'test-release',
  namespace: 'test-ns',
  chart: {
    files: [],
    metadata: {
      name: 'test-chart',
      version: '1.0.0',
      apiVersion: 'v2',
      appVersion: '2.0.0',
      urls: [],
    },
    templates: [],
    values: {},
  },
  info: {
    description: 'A test release',
    deleted: '',
    first_deployed: '2026-01-01T00:00:00Z',
    last_deployed: '2026-01-01T00:00:00Z',
    status: 'deployed',
    notes: '',
  },
  version: 1,
};

const secrets = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ metadata: { name: `secret-${i}` } }));

describe('HelmReleaseList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ ns: 'test-ns' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the document title and data view label as Helm releases', () => {
    mockUseK8sWatchResource.mockReturnValue([[], false, null]);

    renderWithProviders(<HelmReleaseList />);

    expect(document.title).toBe('Helm releases');
    expect(screen.getByTestId('data-view-label')).toHaveTextContent('Helm releases');
  });

  it('should show ConsoleDataView in loading state when secrets are not loaded', () => {
    mockUseK8sWatchResource.mockReturnValue([[], false, null]);

    renderWithProviders(<HelmReleaseList />);

    expect(screen.getByText('Loading...')).toBeVisible();
  });

  it('should show empty state when no Helm releases exist', async () => {
    mockUseK8sWatchResource.mockReturnValue([[], true, null]);

    renderWithProviders(<HelmReleaseList />);

    await waitFor(() => {
      expect(screen.getByText('No Helm releases found')).toBeVisible();
    });
  });

  it('should show a link to browse the catalog in empty state', async () => {
    mockUseK8sWatchResource.mockReturnValue([[], true, null]);

    renderWithProviders(<HelmReleaseList />);

    await waitFor(() => {
      expect(
        screen.getByText('Browse the catalog to discover available Helm charts'),
      ).toBeVisible();
    });
  });

  it('should render ConsoleDataView with fetched releases when secrets exist', async () => {
    const secretsData = [{ metadata: { name: 'helm-secret-1' } }];
    mockUseK8sWatchResource.mockReturnValue([secretsData, true, null]);
    (fetchHelmReleases as jest.Mock).mockResolvedValue([mockHelmRelease as any]);

    renderWithProviders(<HelmReleaseList />);

    await waitFor(() => {
      expect(screen.getByTestId('data-count')).toHaveTextContent('1 releases');
    });
  });

  it('should display load error from secrets watch', () => {
    mockUseK8sWatchResource.mockReturnValue([[], true, 'Failed to load secrets']);

    renderWithProviders(<HelmReleaseList />);

    expect(screen.getByTestId('load-error')).toHaveTextContent('Failed to load secrets');
  });

  it('should display error when fetchHelmReleases fails', async () => {
    const secretsData = [{ metadata: { name: 'helm-secret-1' } }];
    mockUseK8sWatchResource.mockReturnValue([secretsData, true, null]);
    (fetchHelmReleases as jest.Mock).mockRejectedValue(new Error('Network failure'));

    renderWithProviders(<HelmReleaseList />);

    await waitFor(() => {
      expect(screen.getByTestId('load-error')).toHaveTextContent('Network failure');
    });
  });

  it('should use mock mode and show ConsoleDataView without empty state', () => {
    mockUseK8sWatchResource.mockReturnValue([[], true, null]);

    renderWithProviders(<HelmReleaseList mock />);

    expect(screen.getByTestId('console-data-view')).toBeVisible();
    expect(screen.queryByText('No Helm releases found')).not.toBeInTheDocument();
  });

  it('replaces an in-flight fetch when the secret count returns to a completed value', async () => {
    // Regression test: N -> N+1 -> N within request latency. The in-flight
    // request for N+1 is discarded by cleanup; the return to N must start a
    // replacement fetch, not skip it because N was already completed.
    let watchCount = 2;
    mockUseK8sWatchResource.mockImplementation(() => [secrets(watchCount), true, null]);

    const resolvers: ((releases: any[]) => void)[] = [];
    (fetchHelmReleases as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const { rerender } = renderWithProviders(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(1);

    // Complete the fetch for count 2.
    await act(async () => {
      resolvers[0]([mockHelmRelease as any]);
    });
    await waitFor(() => {
      expect(screen.getByTestId('data-count')).toHaveTextContent('1 releases');
    });

    // Watch count 2 -> 3: starts a second fetch, left pending.
    watchCount = 3;
    rerender(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(2);

    // Watch count 3 -> 2 before the second fetch resolves: the pending
    // request is discarded and a replacement fetch for 2 must start.
    watchCount = 2;
    rerender(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(3);

    await act(async () => {
      resolvers[2]([mockHelmRelease as any]);
    });
    await waitFor(() => {
      expect(screen.getByTestId('data-count')).toHaveTextContent('1 releases');
    });
  });

  it('does not refetch when the completed count is unchanged', async () => {
    mockUseK8sWatchResource.mockImplementation(() => [secrets(2), true, null]);

    const resolvers: ((releases: any[]) => void)[] = [];
    (fetchHelmReleases as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const { rerender } = renderWithProviders(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvers[0]([mockHelmRelease as any]);
    });
    await waitFor(() => {
      expect(screen.getByTestId('data-count')).toHaveTextContent('1 releases');
    });

    // Unrelated re-render with the same count must not fetch again.
    rerender(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(1);
  });

  it('refetches after a watch error discards an in-flight request, with an unchanged count', async () => {
    // Regression test: a watch error (or any dependency change) discards an
    // in-flight fetch via cleanup; when the watch recovers with the same
    // secret count, a replacement fetch must start.
    let watchError: Error | undefined;
    mockUseK8sWatchResource.mockImplementation(() => [secrets(2), true, watchError]);

    const resolvers: ((releases: any[]) => void)[] = [];
    (fetchHelmReleases as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const { rerender } = renderWithProviders(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(1);

    // Watch error appears while the first request is in flight.
    watchError = new Error('watch failed');
    rerender(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(1);

    // Watch recovers with the same count: a replacement fetch must start.
    watchError = undefined;
    rerender(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolvers[1]([mockHelmRelease as any]);
    });
    await waitFor(() => {
      expect(screen.getByTestId('data-count')).toHaveTextContent('1 releases');
    });
  });

  it('refetches when returning to a namespace after a round trip, with an unchanged count', async () => {
    // Regression test: A loaded -> B (watch not loaded) -> A with the same
    // secret count. The namespace change resets the completed count, so the
    // stale request identity from the first namespace must not skip the
    // replacement fetch on the return.
    mockUseK8sWatchResource.mockImplementation(() => [secrets(2), true, null]);

    const resolvers: ((releases: any[]) => void)[] = [];
    (fetchHelmReleases as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );

    // Namespace A: fetch completes and the list is loaded.
    mockUseParams.mockReturnValue({ ns: 'ns-a' });
    const { rerender } = renderWithProviders(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolvers[0]([mockHelmRelease as any]);
    });
    await waitFor(() => {
      expect(screen.getByTestId('data-count')).toHaveTextContent('1 releases');
    });

    // Namespace B: the watch has not loaded yet, so no fetch starts.
    mockUseParams.mockReturnValue({ ns: 'ns-b' });
    mockUseK8sWatchResource.mockImplementation(() => [[], false, null]);
    rerender(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(1);

    // Back to namespace A with the same count: a replacement fetch must
    // start and the list must become loaded again.
    mockUseParams.mockReturnValue({ ns: 'ns-a' });
    mockUseK8sWatchResource.mockImplementation(() => [secrets(2), true, null]);
    rerender(<HelmReleaseList />);
    expect(fetchHelmReleases).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolvers[1]([mockHelmRelease as any]);
    });
    await waitFor(() => {
      expect(screen.getByTestId('data-count')).toHaveTextContent('1 releases');
    });
  });
});

import { screen, waitFor } from '@testing-library/react';
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
  initialFiltersDefault: { name: '' },
  actionsCellProps: {},
  nameCellProps: {},
}));

jest.mock('@console/app/src/components/data-view/useResizableColumnProps', () => ({
  useColumnWidthSettings: jest.fn(() => ({
    getResizableProps: jest.fn(() => ({})),
    resetAllColumnWidths: jest.fn(),
  })),
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

describe('HelmReleaseList', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ ns: 'test-ns' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the document title and data view label as Helm Releases', () => {
    mockUseK8sWatchResource.mockReturnValue([[], false, null]);

    renderWithProviders(<HelmReleaseList />);

    expect(screen.getAllByText('Helm releases')).toHaveLength(2);
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
        screen.getByText('Browse the catalog to discover available Helm Charts'),
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
});

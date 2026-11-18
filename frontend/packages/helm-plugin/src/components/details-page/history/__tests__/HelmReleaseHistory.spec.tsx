import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { fetchHelmReleaseHistory } from '../../../../utils/helm-utils';
import HelmReleaseHistory from '../HelmReleaseHistory';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn().mockReturnValue({ ns: 'test-ns', name: 'my-release' }),
}));

jest.mock('../../../../utils/helm-utils', () => ({
  ...jest.requireActual('../../../../utils/helm-utils'),
  fetchHelmReleaseHistory: jest.fn(),
}));

jest.mock('../HelmReleaseHistoryTable', () => {
  const MockTable = (props: { releaseHistory: unknown[]; isLoading: boolean }) => (
    <div
      data-test="mock-history-table"
      data-loading={String(props.isLoading)}
      data-count={String(props.releaseHistory?.length ?? 0)}
    />
  );
  return { __esModule: true, default: MockTable };
});

jest.mock('../HelmReleaseHistoryTableHelpers', () => ({
  useHelmReleaseHistoryColumns: jest.fn(),
  getHelmReleaseHistoryRows: jest.fn().mockReturnValue([]),
  getHistoryColumnIndexById: jest.fn().mockReturnValue(0),
}));

jest.mock('@console/internal/components/utils', () => ({
  StatusBox: (props: { loadError: string; label: string }) => (
    <div data-test="status-box">{props.loadError}</div>
  ),
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => {
  const MockPaneBody = (props: { children: unknown }) => (
    <div data-test="pane-body">{props.children as string}</div>
  );
  return { __esModule: true, default: MockPaneBody };
});

jest.mock('@console/shared/src/hooks/useDeepCompareMemoize', () => ({
  useDeepCompareMemoize: (value: unknown) => value,
}));

const mockFetchHistory = fetchHelmReleaseHistory as jest.Mock;

const mockObj = {
  metadata: { name: 'my-release', namespace: 'test-ns' },
};

const mockHelmRelease = {
  name: 'my-release',
  namespace: 'test-ns',
  version: 3,
  chart: {
    metadata: { name: 'my-chart', version: '1.0.0', apiVersion: 'v2', urls: [] },
    files: [],
    templates: [],
    values: {},
  },
  info: {
    description: 'Install complete',
    deleted: '',
    first_deployed: '2024-01-01T00:00:00Z',
    last_deployed: '2024-01-03T00:00:00Z',
    status: 'deployed',
    notes: '',
  },
};

const mockRevisions = [
  {
    ...mockHelmRelease,
    version: 1,
    info: { ...mockHelmRelease.info, last_deployed: '2024-01-01T00:00:00Z' },
  },
  {
    ...mockHelmRelease,
    version: 2,
    info: { ...mockHelmRelease.info, last_deployed: '2024-01-02T00:00:00Z' },
  },
  {
    ...mockHelmRelease,
    version: 3,
    info: { ...mockHelmRelease.info, last_deployed: '2024-01-03T00:00:00Z' },
  },
];

const defaultProps = {
  obj: mockObj,
  customData: mockHelmRelease,
};

describe('HelmReleaseHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the history table when revisions load successfully', async () => {
    mockFetchHistory.mockResolvedValue(mockRevisions);
    renderWithProviders(<HelmReleaseHistory {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('mock-history-table')).toBeTruthy();
    });
  });

  it('should show loading state while fetching revisions', () => {
    mockFetchHistory.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<HelmReleaseHistory {...defaultProps} />);
    const table = screen.getByTestId('mock-history-table');
    expect(table.getAttribute('data-loading')).toBe('true');
  });

  it('should show StatusBox with error when fetchHelmReleaseHistory fails', async () => {
    mockFetchHistory.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<HelmReleaseHistory {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('status-box')).toBeTruthy();
    });
    expect(screen.getByText('Network error')).toBeTruthy();
  });

  it('should pass revisions to HelmReleaseHistoryTable', async () => {
    mockFetchHistory.mockResolvedValue(mockRevisions);
    renderWithProviders(<HelmReleaseHistory {...defaultProps} />);
    await waitFor(() => {
      const table = screen.getByTestId('mock-history-table');
      expect(table.getAttribute('data-count')).toBe('3');
    });
  });

  it('should fetch history with the correct namespace and release name', () => {
    mockFetchHistory.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<HelmReleaseHistory {...defaultProps} />);
    expect(mockFetchHistory).toHaveBeenCalledWith('my-release', 'test-ns');
  });

  it('should show default error message when error has no message', async () => {
    mockFetchHistory.mockRejectedValue(new Error());
    renderWithProviders(<HelmReleaseHistory {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('status-box')).toBeTruthy();
    });
    expect(screen.getByText('Unable to load Helm release history')).toBeTruthy();
  });

  it('should render within PaneBody when loaded successfully', async () => {
    mockFetchHistory.mockResolvedValue(mockRevisions);
    renderWithProviders(<HelmReleaseHistory {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('pane-body')).toBeTruthy();
    });
    expect(screen.getByTestId('mock-history-table')).toBeTruthy();
  });

  it('should not render PaneBody when there is a load error', async () => {
    mockFetchHistory.mockRejectedValue(new Error('Server error'));
    renderWithProviders(<HelmReleaseHistory {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('status-box')).toBeTruthy();
    });
    expect(screen.queryByTestId('pane-body')).toBeNull();
  });
});

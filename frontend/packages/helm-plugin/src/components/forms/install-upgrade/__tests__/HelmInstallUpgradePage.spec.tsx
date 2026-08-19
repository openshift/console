import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import HelmInstallUpgradePage from '../HelmInstallUpgradePage';

const mockNavigate = jest.fn();
let capturedOnNamespaceChange: ((ns: string) => void) | undefined;

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ ns: 'test-ns' }),
  useLocation: () => ({
    pathname: '/helm/ns/test-ns',
    search: '?chartURL=https%3A%2F%2Fexample.com%2Fchart.tgz&indexEntry=test-chart--1.0.0',
    hash: '',
    state: null,
    key: 'default',
  }),
}));

jest.mock('@console/dev-console/src/components/NamespacedPage', () => ({
  __esModule: true,
  NamespacedPageVariants: { light: 'light' },
  default: ({ children, onNamespaceChange }: any) => {
    capturedOnNamespaceChange = onNamespaceChange;
    return <div data-testid="namespaced-page">{children}</div>;
  },
}));

jest.mock('@console/dynamic-plugin-sdk/src', () => ({
  useActivePerspective: () => ['admin'],
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: () => <div data-testid="loading-box">Loading...</div>,
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: ({ children }: any) => <title>{children}</title>,
}));

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetchJSON: jest.fn(() =>
    Promise.resolve({
      chart: {
        metadata: { name: 'test-chart', version: '1.0.0', appVersion: '1.0.0', annotations: {} },
        values: {},
      },
    }),
  ),
}));

jest.mock('../../../utils/helm-utils', () => ({
  getHelmActionConfig: jest.fn((_action, _release, ns, _t, _origin, chartURL, indexEntry) => ({
    type: 'install',
    title: 'Install Helm Chart',
    subTitle: '',
    helmReleaseApi: `/api/helm/chart?url=${encodeURIComponent(chartURL || '')}&indexEntry=${indexEntry || ''}`,
    fetch: jest.fn(),
    redirectURL: `/topology/ns/${ns}`,
  })),
  getChartValuesYAML: jest.fn(() => ''),
  getChartReadme: jest.fn(() => ''),
  fetchHelmRelease: jest.fn(),
  loadHelmManifestResources: jest.fn(() => []),
  isGoingToTopology: jest.fn(() => true),
}));

jest.mock('../../../utils/helm-validation-utils', () => ({
  getHelmActionValidationSchema: jest.fn(() => ({})),
}));

jest.mock('../../url-chart/useBasicAuthSecretDropdown', () => ({
  NONE_SECRET_KEY: '__none__',
}));

jest.mock('../HelmChartMetaDescription', () => ({
  __esModule: true,
  default: () => <div data-testid="chart-meta">Chart meta</div>,
}));

jest.mock('../HelmInstallUpgradeForm', () => ({
  __esModule: true,
  default: () => <div data-testid="helm-form">Helm form</div>,
}));

describe('HelmInstallUpgradePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    capturedOnNamespaceChange = undefined;
  });

  it('should preserve query params when namespace changes', async () => {
    renderWithProviders(<HelmInstallUpgradePage />);

    // Wait for chart data to load so NamespacedPage renders
    await waitFor(() => {
      expect(capturedOnNamespaceChange).toBeDefined();
    });

    // Simulate namespace change via project dropdown
    capturedOnNamespaceChange('new-ns');

    expect(mockNavigate).toHaveBeenCalledWith(
      '/helm/ns/new-ns?chartURL=https%3A%2F%2Fexample.com%2Fchart.tgz&indexEntry=test-chart--1.0.0',
    );
  });

  it('should not navigate when switching to same namespace', async () => {
    renderWithProviders(<HelmInstallUpgradePage />);

    await waitFor(() => {
      expect(capturedOnNamespaceChange).toBeDefined();
    });

    capturedOnNamespaceChange('test-ns');

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should navigate to all-namespaces without query params', async () => {
    renderWithProviders(<HelmInstallUpgradePage />);

    await waitFor(() => {
      expect(capturedOnNamespaceChange).toBeDefined();
    });

    capturedOnNamespaceChange('#ALL_NS#');

    expect(mockNavigate).toHaveBeenCalledWith('/helm/all-namespaces');
  });
});

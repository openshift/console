import type { ReactNode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import HelmInstallUpgradePage from '../HelmInstallUpgradePage';

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: (...args: unknown[]) => mockUseParams(...args),
  useLocation: (...args: unknown[]) => mockUseLocation(...args),
  useNavigate: () => mockNavigate,
}));

const mockUseActivePerspective = jest.fn();
jest.mock('@console/dynamic-plugin-sdk/src', () => ({
  useActivePerspective: () => mockUseActivePerspective(),
}));

let capturedOnNamespaceChange: (ns: string) => void;
jest.mock('@console/dev-console/src/components/NamespacedPage', () => ({
  __esModule: true,
  default: ({ children, onNamespaceChange }: { children: ReactNode; onNamespaceChange: (ns: string) => void }) => {
    capturedOnNamespaceChange = onNamespaceChange;
    return <div data-test="namespaced-page">{children}</div>;
  },
  NamespacedPageVariants: { light: 'light' },
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: () => <div data-test="loading-box">Loading...</div>,
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: ({ children }: { children: ReactNode }) => <title>{children}</title>,
}));

const mockCoFetchJSON = jest.fn();
jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetchJSON: (...args: unknown[]) => mockCoFetchJSON(...args),
}));

jest.mock('../../../../utils/helm-utils', () => ({
  getHelmActionConfig: () => ({
    type: 'Create',
    title: 'Install Helm Chart',
    helmReleaseApi: '/api/helm/chart?url=test-chart-url',
    fetch: jest.fn(),
    redirectURL: '/topology',
  }),
  getChartValuesYAML: () => 'key: value',
  getChartReadme: () => '# README',
  fetchHelmRelease: jest.fn(),
  loadHelmManifestResources: () => [],
  isGoingToTopology: () => true,
}));

jest.mock('../../../../utils/helm-validation-utils', () => ({
  getHelmActionValidationSchema: () => ({}),
}));

jest.mock('../HelmChartMetaDescription', () => ({
  __esModule: true,
  default: () => <div data-test="chart-meta" />,
}));

jest.mock('../HelmInstallUpgradeForm', () => ({
  __esModule: true,
  default: () => <div data-test="helm-form">Helm Form</div>,
}));

jest.mock('../../url-chart/useBasicAuthSecretDropdown', () => ({
  NONE_SECRET_KEY: 'none',
}));

describe('HelmInstallUpgradePage', () => {
  const chartSearchParams = '?chartURL=https%3A%2F%2Fexample.com%2Fchart.tgz&indexEntry=repo--chart--1.0.0';

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseActivePerspective.mockReturnValue(['admin', jest.fn()]);
    mockUseParams.mockReturnValue({ ns: 'foo' });
    mockUseLocation.mockReturnValue({
      pathname: '/helm/ns/foo',
      search: chartSearchParams,
      state: null,
      hash: '',
      key: 'default',
    });
    mockCoFetchJSON.mockResolvedValue({
      metadata: { name: 'test-chart', version: '1.0.0', appVersion: '1.0', annotations: {} },
      values: {},
    });
  });

  it('should preserve query params when namespace changes', async () => {
    renderWithProviders(<HelmInstallUpgradePage />);

    await waitFor(() => {
      expect(capturedOnNamespaceChange).toBeDefined();
    });

    capturedOnNamespaceChange('bar');

    expect(mockNavigate).toHaveBeenCalledWith(`/helm/ns/bar${chartSearchParams}`);
  });

  it('should preserve query params when switching to all-namespaces', async () => {
    renderWithProviders(<HelmInstallUpgradePage />);

    await waitFor(() => {
      expect(capturedOnNamespaceChange).toBeDefined();
    });

    capturedOnNamespaceChange(ALL_NAMESPACES_KEY);

    expect(mockNavigate).toHaveBeenCalledWith(`/helm/all-namespaces${chartSearchParams}`);
  });

  it('should not navigate when selecting the same namespace', async () => {
    renderWithProviders(<HelmInstallUpgradePage />);

    await waitFor(() => {
      expect(capturedOnNamespaceChange).toBeDefined();
    });

    capturedOnNamespaceChange('foo');

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should show loading state before chart data loads', () => {
    mockCoFetchJSON.mockReturnValue(new Promise(() => {})); // never resolves

    renderWithProviders(<HelmInstallUpgradePage />);

    expect(screen.getByTestId('loading-box')).toBeVisible();
  });
});

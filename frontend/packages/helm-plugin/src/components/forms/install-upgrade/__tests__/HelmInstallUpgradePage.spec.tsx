import { useEffect, type ReactNode } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import HelmInstallUpgradePage from '../HelmInstallUpgradePage';

const mockUseActivePerspective = jest.fn();
jest.mock('@console/dynamic-plugin-sdk/src', () => ({
  useActivePerspective: () => mockUseActivePerspective(),
}));

let capturedOnNamespaceChange: (ns: string) => void;
jest.mock('@console/dev-console/src/components/NamespacedPage', () => ({
  __esModule: true,
  default: ({
    children,
    onNamespaceChange,
  }: {
    children: ReactNode;
    onNamespaceChange: (ns: string) => void;
  }) => {
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

let testLocation: { pathname: string; search: string };
const LocationDisplay = () => {
  const location = useLocation();
  useEffect(() => {
    testLocation = { pathname: location.pathname, search: location.search };
  });
  return null;
};

describe('HelmInstallUpgradePage', () => {
  const chartSearchParams =
    '?chartURL=https%3A%2F%2Fexample.com%2Fchart.tgz&indexEntry=repo--chart--1.0.0&chartRepoName=example-repo';

  const renderComponent = (initialPath: string = `/helm/ns/foo${chartSearchParams}`) =>
    render(
      <>
        <Routes>
          <Route path="/helm/ns/:ns" element={<HelmInstallUpgradePage />} />
          <Route path="/helm/all-namespaces" element={<div data-test="all-ns-page" />} />
        </Routes>
        <LocationDisplay />
      </>,
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
        ),
      },
    );

  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnNamespaceChange = undefined;
    mockUseActivePerspective.mockReturnValue(['admin', jest.fn()]);
    mockCoFetchJSON.mockResolvedValue({
      metadata: { name: 'test-chart', version: '1.0.0', appVersion: '1.0', annotations: {} },
      values: {},
    });
  });

  it('should preserve query params when namespace changes', async () => {
    renderComponent();

    await waitFor(() => {
      expect(capturedOnNamespaceChange).toBeDefined();
    });

    act(() => {
      capturedOnNamespaceChange('bar');
    });

    expect(testLocation.pathname).toBe('/helm/ns/bar');
    expect(testLocation.search).toBe(chartSearchParams);
  });

  it('should preserve query params when switching to all-namespaces', async () => {
    renderComponent();

    await waitFor(() => {
      expect(capturedOnNamespaceChange).toBeDefined();
    });

    act(() => {
      capturedOnNamespaceChange(ALL_NAMESPACES_KEY);
    });

    expect(testLocation.pathname).toBe('/helm/all-namespaces');
    expect(testLocation.search).toBe(chartSearchParams);
  });

  it('should not navigate when selecting the same namespace', async () => {
    renderComponent();

    await waitFor(() => {
      expect(capturedOnNamespaceChange).toBeDefined();
    });

    const initialPathname = testLocation.pathname;
    const initialSearch = testLocation.search;

    act(() => {
      capturedOnNamespaceChange('foo');
    });

    expect(testLocation.pathname).toBe(initialPathname);
    expect(testLocation.search).toBe(initialSearch);
  });

  it('should show loading state before chart data loads', () => {
    mockCoFetchJSON.mockReturnValue(new Promise(() => {})); // never resolves

    renderComponent();

    expect(screen.getByTestId('loading-box')).toBeVisible();
  });
});

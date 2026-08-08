import { screen } from '@testing-library/react';
import * as Router from 'react-router';
import * as MultiTabListPageModule from '@console/shared/src/components/multi-tab-list/MultiTabListPage';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import HelmTabbedPage from '../HelmTabbedPage';

const mockUseAccessReview = jest.fn();
const mockUseActivePerspective = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src', () => ({
  useAccessReview: (...args: unknown[]) => mockUseAccessReview(...args),
  useActivePerspective: () => mockUseActivePerspective(),
}));

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn(),
}));

jest.mock('@console/internal/components/start-guide', () => ({
  withStartGuide: (Component: React.ComponentType) => Component,
}));

jest.mock('@console/dev-console/src/components/NamespacedPage', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
  NamespacedPageVariants: { light: 'light' },
}));

jest.mock('@console/dev-console/src/components/projects/CreateProjectListPage', () => ({
  __esModule: true,
  default: ({
    title,
    children,
  }: {
    title: string;
    children: (fn: () => void) => React.ReactNode;
  }) => (
    <div data-test="create-project-list-page">
      <span>{title}</span>
      {typeof children === 'function' ? children(jest.fn()) : children}
    </div>
  ),
  CreateAProjectButton: () => null,
}));

jest.mock('@console/shared/src/components/multi-tab-list/MultiTabListPage', () => ({
  MultiTabListPage: jest.fn(({ title }: { title: string }) => (
    <div data-test="multi-tab-list-page">
      <span>{title}</span>
    </div>
  )),
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: () => <div data-test="loading-box">Loading...</div>,
}));

jest.mock('../HelmReleaseList', () => ({
  __esModule: true,
  default: 'HelmReleaseList',
}));

jest.mock('../HelmReleaseListPage', () => ({
  __esModule: true,
  default: () => <div data-test="helm-release-list-page">Helm Release List Page</div>,
}));

jest.mock('../RepositoriesListPage', () => ({
  __esModule: true,
  default: 'RepositoriesPage',
}));

jest.mock('../../../models/helm', () => ({
  HelmChartRepositoryModel: {
    apiGroup: 'helm.openshift.io',
    plural: 'helmchartrepositories',
  },
  ProjectHelmChartRepositoryModel: {
    apiGroup: 'helm.openshift.io',
    plural: 'projecthelmchartrepositories',
  },
}));

const useParamsMock = Router.useParams as jest.Mock;
const useFlagMock = useFlag as jest.Mock;
const mockMultiTabListPage = MultiTabListPageModule.MultiTabListPage as jest.Mock;

/** Helper: configure all 6 useAccessReview calls to return the same tuple. */
const setAllAccessReviews = (allowed: boolean, loading: boolean) => {
  mockUseAccessReview.mockReturnValue([allowed, loading]);
};

describe('HelmTabbedPage', () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({ ns: 'test-ns' });
    useFlagMock.mockReturnValue(true);
    mockUseActivePerspective.mockReturnValue(['dev']);
    mockMultiTabListPage.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show LoadingBox when access reviews are loading', () => {
    setAllAccessReviews(false, true);

    renderWithProviders(<HelmTabbedPage />);

    expect(screen.getByTestId('loading-box')).toBeVisible();
    expect(screen.getByText('Loading...')).toBeVisible();
  });

  it('should show MultiTabListPage with "Helm" title when user has full access', () => {
    setAllAccessReviews(true, false);

    renderWithProviders(<HelmTabbedPage />);

    expect(screen.getByTestId('multi-tab-list-page')).toBeVisible();
    expect(screen.getByText('Helm')).toBeVisible();
  });

  it('should show HelmReleaseListPage when user has no repository access', () => {
    setAllAccessReviews(false, false);

    renderWithProviders(<HelmTabbedPage />);

    expect(screen.getByTestId('helm-release-list-page')).toBeVisible();
    expect(screen.queryByTestId('multi-tab-list-page')).not.toBeInTheDocument();
  });

  it('should pass "Helm Releases" and "Repositories" pages to MultiTabListPage', () => {
    setAllAccessReviews(true, false);

    renderWithProviders(<HelmTabbedPage />);

    const callArgs = mockMultiTabListPage.mock.calls[0][0];
    expect(callArgs.pages).toHaveLength(2);
    expect(callArgs.pages[0].nameKey).toBe('helm-plugin~Helm Releases');
    expect(callArgs.pages[1].nameKey).toBe('helm-plugin~Repositories');
  });

  it('should show CreateProjectListPage when no namespace and dev perspective', () => {
    useParamsMock.mockReturnValue({});
    mockUseActivePerspective.mockReturnValue(['dev']);

    renderWithProviders(<HelmTabbedPage />);

    expect(screen.getByTestId('create-project-list-page')).toBeVisible();
    expect(screen.queryByTestId('multi-tab-list-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading-box')).not.toBeInTheDocument();
  });

  it('should show HelmPage when admin perspective even without namespace', () => {
    useParamsMock.mockReturnValue({});
    mockUseActivePerspective.mockReturnValue(['admin']);
    setAllAccessReviews(true, false);

    renderWithProviders(<HelmTabbedPage />);

    expect(screen.getByTestId('multi-tab-list-page')).toBeVisible();
    expect(screen.queryByTestId('create-project-list-page')).not.toBeInTheDocument();
  });

  it('should pass correct telemetryPrefix to MultiTabListPage', () => {
    setAllAccessReviews(true, false);

    renderWithProviders(<HelmTabbedPage />);

    const callArgs = mockMultiTabListPage.mock.calls[0][0];
    expect(callArgs.telemetryPrefix).toBe('Helm');
  });

  it('should pass menuActions with helmRelease, projectHelmChartRepository, and helmChartInstallation', () => {
    setAllAccessReviews(true, false);

    renderWithProviders(<HelmTabbedPage />);

    const callArgs = mockMultiTabListPage.mock.calls[0][0];
    const actionKeys = Object.keys(callArgs.menuActions);
    expect(actionKeys).toEqual(
      expect.arrayContaining([
        'helmRelease',
        'projectHelmChartRepository',
        'helmChartInstallation',
      ]),
    );
  });
});

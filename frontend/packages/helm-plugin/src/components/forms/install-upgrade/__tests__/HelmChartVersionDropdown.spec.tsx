import { screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { HelmActionType } from '../../../../types/helm-types';
import { getChartEntriesByName, getChartVersions } from '../../../../utils/helm-utils';
import HelmChartVersionDropdown from '../HelmChartVersionDropdown';

jest.mock('@console/shared/src/components/formik-fields/DropdownField', () => ({
  DropdownField: ({ label, title, disabled, helpText, name }: any) => (
    <div data-test="dropdown-field">
      <label>{label}</label>
      <span data-test="dropdown-title">{title}</span>
      {disabled && <span data-test="dropdown-disabled">disabled</span>}
      {helpText && <span data-test="dropdown-help">{helpText}</span>}
      <input type="hidden" name={name} />
    </div>
  ),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(() => [[], true, null]),
}));

jest.mock('@console/shared/src/hooks/useWarningModal', () => ({
  useWarningModal: jest.fn(() => jest.fn()),
}));

const mockCoFetch = jest.fn();
jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetchJSON: jest.fn(),
  coFetch: (...args: any[]) => mockCoFetch(...args),
}));

jest.mock('../../../../models/helm', () => ({
  HelmChartRepositoryModel: {
    apiGroup: 'helm.openshift.io',
    apiVersion: 'v1beta1',
    kind: 'HelmChartRepository',
    plural: 'helmchartrepositories',
  },
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceForModel: jest.fn(() => 'helm.openshift.io~v1beta1~HelmChartRepository'),
}));

jest.mock('../../../../utils/helm-utils', () => ({
  getChartEntriesByName: jest.fn(() => []),
  getChartVersions: jest.fn(() => ({})),
  getChartIndexEntry: jest.fn(() => 'test-chart--my-repo'),
  concatVersions: jest.fn((version: string) => version),
  getChartURL: jest.fn(() => ''),
  getChartReadme: jest.fn(() => ''),
  getChartRepositoryTitle: jest.fn(() => ''),
  mergeHelmValuesOnChartVersionChange: jest.fn(() => ({})),
}));

const indexYaml = `entries:
  test-chart:
    - name: test-chart
      version: "2.0.0"
    - name: test-chart
      version: "1.0.0"`;

const formikInitialValues = {
  chartVersion: '1.0.0',
  chartURL: 'https://example.com/charts/test-chart-1.0.0.tgz',
  chartRepoName: 'my-repo',
  chartName: 'test-chart',
  chartReadme: '',
  appVersion: '1.0',
  yamlData: 'key: value',
  formData: {},
  formSchema: {},
  editorType: 'form',
  releaseName: 'my-release',
  chartIndexEntry: '',
};

const defaultProps = {
  chartVersion: '1.0.0',
  chartName: 'test-chart',
  helmAction: HelmActionType.Create,
  onVersionChange: jest.fn(),
  namespace: 'test-ns',
  chartIndexEntry: 'test-chart--my-repo',
};

const renderDropdown = (props = {}) => {
  return renderWithProviders(
    <Formik initialValues={formikInitialValues} onSubmit={jest.fn()}>
      <HelmChartVersionDropdown {...defaultProps} {...props} />
    </Formik>,
  );
};

describe('HelmChartVersionDropdown', () => {
  beforeEach(() => {
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve(indexYaml) });
    (getChartEntriesByName as jest.Mock).mockReturnValue([
      { version: '2.0.0', repoName: 'my-repo' },
      { version: '1.0.0', repoName: 'my-repo' },
    ]);
    (getChartVersions as jest.Mock).mockReturnValue({
      '2.0.0': '2.0.0',
      '1.0.0': '1.0.0',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the Chart version label', async () => {
    renderDropdown();

    expect(screen.getByText('Chart version')).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByTestId('dropdown-disabled')).not.toBeInTheDocument();
    });
  });

  it('should display the current chart version in the dropdown title', async () => {
    renderDropdown();

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-title')).toHaveTextContent('1.0.0');
    });
  });

  it('should show help text for upgrade action', async () => {
    renderDropdown({ helmAction: HelmActionType.Upgrade });

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-help')).toHaveTextContent(
        'Select the version to upgrade to.',
      );
    });
  });

  it('should not show help text for create action', async () => {
    renderDropdown({ helmAction: HelmActionType.Create });

    await waitFor(() => {
      expect(screen.queryByTestId('dropdown-disabled')).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId('dropdown-help')).not.toBeInTheDocument();
  });

  it('should show "No versions available" when no chart versions are loaded and no chartVersion', async () => {
    (getChartEntriesByName as jest.Mock).mockReturnValue([]);
    (getChartVersions as jest.Mock).mockReturnValue({});

    renderDropdown({ chartVersion: '' });

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-title')).toHaveTextContent('No versions available');
    });
  });

  it('should disable dropdown when only one version is available', async () => {
    (getChartEntriesByName as jest.Mock).mockReturnValue([
      { version: '1.0.0', repoName: 'my-repo' },
    ]);
    (getChartVersions as jest.Mock).mockReturnValue({ '1.0.0': '1.0.0' });

    renderDropdown();

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-disabled')).toBeVisible();
    });
  });

  it('should fetch chart index from the correct namespace', async () => {
    renderDropdown({ namespace: 'my-namespace' });

    expect(mockCoFetch).toHaveBeenCalledWith('/api/helm/charts/index.yaml?namespace=my-namespace');
    await waitFor(() => {
      expect(screen.queryByTestId('dropdown-disabled')).not.toBeInTheDocument();
    });
  });
});

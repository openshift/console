import { screen } from '@testing-library/react';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import RepositoriesList from '../RepositoriesList';

const mockConsoleDataView = jest.fn();
jest.mock('@console/app/src/components/data-view/ConsoleDataView', () => ({
  ConsoleDataView: (props: Record<string, unknown>) => {
    mockConsoleDataView(props);
    return props.label as string;
  },
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: () => 'LoadingBox',
}));

const mockResetAllColumnWidths = jest.fn();
const mockColumns = [
  { id: 'name', title: 'Name' },
  { id: 'repoUrl', title: 'Repo URL' },
];

jest.mock('../RepositoriesHeader', () => ({
  useRepositoriesColumns: () => ({
    columns: mockColumns,
    resetAllColumnWidths: mockResetAllColumnWidths,
  }),
}));

jest.mock('../RepositoriesRow', () => ({
  getDataViewRows: jest.fn(),
}));

jest.mock('../../../models/helm', () => ({
  HelmRepositoriesCombinedListModel: {
    apiGroup: 'console.ui',
    apiVersion: 'v1',
    kind: 'HelmRepositoriesCombinedList',
    id: 'helmrepositoriescombinedlist',
    plural: 'helmrepositoriescombinedlists',
    label: 'Helm Chart Repositories',
    labelPlural: 'Helm Chart Repositories',
    abbr: 'HCRL',
    namespaced: false,
    crd: true,
  },
}));

const mockData: K8sResourceKind[] = [
  {
    apiVersion: 'helm.openshift.io/v1beta1',
    kind: 'HelmChartRepository',
    metadata: { name: 'repo-1', namespace: 'default' },
    spec: { name: 'Test Repo 1' },
  },
  {
    apiVersion: 'helm.openshift.io/v1beta1',
    kind: 'HelmChartRepository',
    metadata: { name: 'repo-2', namespace: 'test-ns' },
    spec: { name: 'Test Repo 2' },
  },
];

describe('RepositoriesList', () => {
  beforeEach(() => {
    mockConsoleDataView.mockClear();
    mockResetAllColumnWidths.mockClear();
  });

  it('should render ConsoleDataView with HelmChartRepositories label', () => {
    renderWithProviders(<RepositoriesList data={[]} loaded={false} />);

    expect(screen.getByText('HelmChartRepositories')).toBeInTheDocument();
    expect(mockConsoleDataView).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'HelmChartRepositories' }),
    );
  });

  it('should pass data and loaded props to ConsoleDataView', () => {
    renderWithProviders(<RepositoriesList data={mockData} loaded />);

    expect(mockConsoleDataView).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockData,
        loaded: true,
      }),
    );
  });

  it('should pass the correct data count when loaded with data', () => {
    renderWithProviders(<RepositoriesList data={mockData} loaded />);

    const calledProps = mockConsoleDataView.mock.calls[0][0];
    expect(calledProps.data).toHaveLength(2);
    expect(calledProps.loaded).toBe(true);
  });

  it('should pass loaded as false when not loaded', () => {
    renderWithProviders(<RepositoriesList data={[]} loaded={false} />);

    const calledProps = mockConsoleDataView.mock.calls[0][0];
    expect(calledProps.loaded).toBe(false);
  });

  it('should pass loadError to ConsoleDataView when loadError is set', () => {
    const loadError = 'Failed to fetch repositories';
    renderWithProviders(<RepositoriesList data={[]} loaded loadError={loadError} />);

    expect(mockConsoleDataView).toHaveBeenCalledWith(
      expect.objectContaining({ loadError: 'Failed to fetch repositories' }),
    );
  });

  it('should pass columns and resetAllColumnWidths from useRepositoriesColumns', () => {
    renderWithProviders(<RepositoriesList data={[]} loaded />);

    expect(mockConsoleDataView).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: mockColumns,
        resetAllColumnWidths: mockResetAllColumnWidths,
      }),
    );
  });
});

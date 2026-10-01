import { screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  renderHookWithProviders,
  renderWithProviders,
} from '@console/shared/src/test-utils/unit-test-utils';
import { testPackageManifest } from '../../../mocks';
import type { PackageManifestKind } from '../../types';
import { ClusterServiceVersionLogo } from '../cluster-service-version-logo';
import { getPackageManifestDataViewRows, usePackageManifestColumns } from '../package-manifest';

jest.mock('../cluster-service-version-logo', () => ({
  ClusterServiceVersionLogo: jest.fn(() => null),
}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: ({ timestamp }) => timestamp,
}));

jest.mock('@console/internal/components/utils/resource-link', () => ({
  ...jest.requireActual('@console/internal/components/utils/resource-link'),
  ResourceLink: ({ name }) => name,
}));

const mockClusterServiceVersionLogo = ClusterServiceVersionLogo as jest.Mock;

const renderRow = (obj: PackageManifestKind, ids: string[]) => {
  const columns: ConsoleDataViewColumn<PackageManifestKind>[] = ids.map((id) => ({
    id,
    title: id,
  }));
  const [cells] = getPackageManifestDataViewRows(
    [{ obj, activeColumnIDs: new Set(ids), rowData: undefined, index: 0 }],
    columns,
  );
  return renderWithProviders(
    <table>
      <tbody>
        <tr>
          {cells.map(({ id, cell }) => (
            <td key={id}>{cell}</td>
          ))}
        </tr>
      </tbody>
    </table>,
  );
};

describe('usePackageManifestColumns', () => {
  it('should omit the CatalogSource column when the list is scoped to one CatalogSource', () => {
    const { result } = renderHookWithProviders(() => usePackageManifestColumns(true));
    expect(result.current.columns.map(({ id }) => id)).toEqual([
      'name',
      'latestVersion',
      'created',
    ]);
  });

  it('should append the CatalogSource column when the list is not scoped to one CatalogSource', () => {
    const { result } = renderHookWithProviders(() => usePackageManifestColumns(false));
    expect(result.current.columns.map(({ id }) => id)).toEqual([
      'name',
      'latestVersion',
      'created',
      'catalogsource',
    ]);
  });

  it('should title the columns', () => {
    const { result } = renderHookWithProviders(() => usePackageManifestColumns(false));
    expect(result.current.columns.map(({ title }) => title)).toEqual([
      'Name',
      'Latest version',
      'Created',
      'CatalogSource',
    ]);
  });
});

describe('getPackageManifestDataViewRows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the package logo with the default channel display name', () => {
    renderRow(testPackageManifest, ['name']);
    expect(mockClusterServiceVersionLogo).toHaveBeenCalledTimes(1);
    const [logoProps] = mockClusterServiceVersionLogo.mock.calls[0];
    expect(logoProps.displayName).toEqual(
      testPackageManifest.status.channels[0].currentCSVDesc.displayName,
    );
  });

  it('should render the latest CSV version and its channel', () => {
    const {
      name,
      currentCSVDesc: { version },
    } = testPackageManifest.status.channels[0];
    renderRow(testPackageManifest, ['latestVersion']);
    expect(screen.getByRole('cell', { name: `${version} (${name})` })).toBeVisible();
  });

  it('should render the creation timestamp', () => {
    renderRow(testPackageManifest, ['created']);
    expect(
      screen.getByRole('cell', { name: testPackageManifest.metadata.creationTimestamp }),
    ).toBeVisible();
  });

  it('should render the CatalogSource', () => {
    renderRow(testPackageManifest, ['catalogsource']);
    expect(
      screen.getByRole('cell', { name: testPackageManifest.status.catalogSource }),
    ).toBeVisible();
  });

  it('should preserve the requested column order and omit columns that are not active', () => {
    renderRow(testPackageManifest, ['created', 'catalogsource']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      testPackageManifest.metadata.creationTimestamp,
      testPackageManifest.status.catalogSource,
    ]);
  });

  it('should not throw when the package has no channels', () => {
    const noChannels = {
      ...testPackageManifest,
      status: { ...testPackageManifest.status, defaultChannel: '', channels: [] },
    } as PackageManifestKind;
    expect(() => renderRow(noChannels, ['name', 'latestVersion'])).not.toThrow();
    expect(mockClusterServiceVersionLogo).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: undefined, provider: undefined }),
      expect.anything(),
    );
  });
});

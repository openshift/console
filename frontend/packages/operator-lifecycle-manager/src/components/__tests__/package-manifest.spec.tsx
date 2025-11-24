import { screen } from '@testing-library/react';
import * as UIActions from '@console/internal/actions/ui';
import { ResourceLink } from '@console/internal/components/utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testPackageManifest, testCatalogSource } from '../../../mocks';
import { ClusterServiceVersionLogo } from '../cluster-service-version-logo';
import {
  PackageManifestTableRow,
  PackageManifestTableHeader,
  PackageManifestTableHeaderWithCatalogSource,
} from '../package-manifest';

jest.mock('../cluster-service-version-logo', () => ({
  ClusterServiceVersionLogo: jest.fn(() => null),
}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: jest.fn(() => null),
}));

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/internal/components/utils'),
  ResourceLink: jest.fn(() => null),
}));

const mockClusterServiceVersionLogo = ClusterServiceVersionLogo as jest.Mock;
const mockTimestamp = Timestamp as jest.Mock;
const mockResourceLink = ResourceLink as jest.Mock;

describe('PackageManifestTableHeader', () => {
  it('renders column header for package name', () => {
    const headers = PackageManifestTableHeader();
    expect(headers[0].title).toEqual('Name');
  });

  it('renders column header for latest CSV version for package in catalog', () => {
    const headers = PackageManifestTableHeader();
    expect(headers[1].title).toEqual('Latest version');
  });

  it('renders column header for creation timestamp', () => {
    const headers = PackageManifestTableHeader();
    expect(headers[2].title).toEqual('Created');
  });
});

describe('PackageManifestTableHeaderWithCatalogSource', () => {
  it('renders column header for catalog source', () => {
    const headers = PackageManifestTableHeaderWithCatalogSource();
    expect(headers[3].title).toEqual('CatalogSource');
  });
});

describe('PackageManifestTableRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(UIActions, 'getActiveNamespace').mockReturnValue('default');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders column for package name and logo', () => {
    const columns: any[] = [];

    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <PackageManifestTableRow
              obj={testPackageManifest}
              customData={{ catalogSource: testCatalogSource }}
              columns={columns}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(mockClusterServiceVersionLogo).toHaveBeenCalledTimes(1);
    const [logoProps] = mockClusterServiceVersionLogo.mock.calls[0];
    expect(logoProps.displayName).toEqual(
      testPackageManifest.status.channels[0].currentCSVDesc.displayName,
    );
  });

  it('renders column for latest CSV version for package in catalog', () => {
    const columns: any[] = [];
    const {
      name,
      currentCSVDesc: { version },
    } = testPackageManifest.status.channels[0];

    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <PackageManifestTableRow
              obj={testPackageManifest}
              customData={{ catalogSource: testCatalogSource }}
              columns={columns}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText(`${version} (${name})`)).toBeVisible();
  });

  it('renders column for creation timestamp', () => {
    const columns: any[] = [];
    const pkgManifestCreationTimestamp = testPackageManifest.metadata.creationTimestamp;

    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <PackageManifestTableRow
              obj={testPackageManifest}
              customData={{ catalogSource: testCatalogSource }}
              columns={columns}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(mockTimestamp).toHaveBeenCalledTimes(1);
    const [timestampProps] = mockTimestamp.mock.calls[0];
    expect(timestampProps.timestamp).toEqual(pkgManifestCreationTimestamp);
  });

  it('renders column for catalog source for a package when no catalog source is defined', () => {
    const catalogSourceName = testPackageManifest.status.catalogSource;
    const columns: any[] = [];

    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <PackageManifestTableRow
              obj={testPackageManifest}
              customData={{ catalogSource: null }}
              columns={columns}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(mockResourceLink).toHaveBeenCalledTimes(1);
    const [resourceLinkProps] = mockResourceLink.mock.calls[0];
    expect(resourceLinkProps.name).toEqual(catalogSourceName);
  });
});

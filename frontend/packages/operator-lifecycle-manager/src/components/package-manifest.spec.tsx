import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as UIActions from '@console/internal/actions/ui';
import { TableRow, RowFunction } from '@console/internal/components/factory';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { testPackageManifest, testCatalogSource } from '../../mocks';
import { PackageManifestKind, CatalogSourceKind } from '../types';
import {
  PackageManifestTableRow,
  PackageManifestTableHeader,
  PackageManifestTableHeaderWithCatalogSource,
} from './package-manifest';
import { ClusterServiceVersionLogo } from '.';

describe(PackageManifestTableHeader.displayName, () => {
  it('renders column header for package name', () => {
    expect(PackageManifestTableHeader()[0].title).toEqual('Name');
  });

  it('renders column header for latest CSV version for package in catalog', () => {
    expect(PackageManifestTableHeader()[1].title).toEqual('Latest version');
  });

  it('renders column header for creation timestamp', () => {
    expect(PackageManifestTableHeader()[2].title).toEqual('Created');
  });
});

describe(PackageManifestTableHeaderWithCatalogSource.displayName, () => {
  it('renders column header for catalog source', () => {
    expect(PackageManifestTableHeaderWithCatalogSource()[3].title).toEqual('CatalogSource');
  });
});

describe('PackageManifestTableRow', () => {
  let wrapper: ShallowWrapper<RowFunction<
    PackageManifestKind,
    { catalogSource: CatalogSourceKind }
  >>;

  beforeEach(() => {
    jest.spyOn(UIActions, 'getActiveNamespace').mockReturnValue('default');

    const columns: any[] = [];
    wrapper = shallow(
      <PackageManifestTableRow
        obj={testPackageManifest}
        customData={{ catalogSource: testCatalogSource }}
        index={0}
        key={'0'}
        style={null}
        isScrolling
        columns={columns}
      />,
    );
  });

  it('renders column for package name and logo', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(0)
        .dive()
        .find(ClusterServiceVersionLogo)
        .props().displayName,
    ).toEqual(testPackageManifest.status.channels[0].currentCSVDesc.displayName);
  });

  it('renders column for latest CSV version for package in catalog', () => {
    const {
      name,
      currentCSVDesc: { version },
    } = testPackageManifest.status.channels[0];
    expect(
      wrapper
        .find(TableRow)
        .childAt(1)
        .dive()
        .text(),
    ).toEqual(`${version} (${name})`);
  });

  it('renders column for creation timestamp', () => {
    const pkgManifestCreationTimestamp = testPackageManifest.metadata.creationTimestamp;
    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .dive()
        .find(Timestamp)
        .props().timestamp,
    ).toEqual(`${pkgManifestCreationTimestamp}`);
  });

  // This is to verify cataloSource column gets rendered on the Search page for PackageManifest resource
  it('renders column for catalog source for a package when no catalog source is defined', () => {
    const catalogSourceName = testPackageManifest.status.catalogSource;
    const columns: any[] = [];

    wrapper = shallow(
      <PackageManifestTableRow
        obj={testPackageManifest}
        customData={{ catalogSource: null }}
        index={0}
        key={'0'}
        style={null}
        isScrolling
        columns={columns}
      />,
    );
    expect(
      wrapper
        .find(TableRow)
        .childAt(3)
        .dive()
        .find(ResourceLink)
        .props().name,
    ).toEqual(`${catalogSourceName}`);
  });
});

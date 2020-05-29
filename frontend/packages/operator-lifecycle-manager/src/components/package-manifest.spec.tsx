import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import { Table, TableRow } from '@console/internal/components/factory';
import * as UIActions from '@console/internal/actions/ui';
import { testPackageManifest, testCatalogSource, testSubscription } from '../../mocks';
import { PackageManifestKind } from '../types';
import {
  PackageManifestTableHeader,
  PackageManifestTableRow,
  PackageManifestTableRowProps,
  PackageManifestList,
  PackageManifestListProps,
} from './package-manifest';
import { ClusterServiceVersionLogo } from '.';
import { Button } from '@patternfly/react-core';

describe(PackageManifestTableHeader.displayName, () => {
  it('renders column header for package name', () => {
    expect(PackageManifestTableHeader()[0].title).toEqual('Name');
  });

  it('renders column header for latest CSV version for package in catalog', () => {
    expect(PackageManifestTableHeader()[1].title).toEqual('Latest Version');
  });

  it('renders column header for subscriptions', () => {
    expect(PackageManifestTableHeader()[2].title).toEqual('Subscriptions');
  });
});

describe(PackageManifestTableRow.displayName, () => {
  let wrapper: ShallowWrapper<PackageManifestTableRowProps>;

  beforeEach(() => {
    jest.spyOn(UIActions, 'getActiveNamespace').mockReturnValue('default');
    wrapper = shallow(
      <PackageManifestTableRow
        index={0}
        rowKey={'0'}
        style={null}
        obj={testPackageManifest}
        catalogSourceNamespace={testCatalogSource.metadata.namespace}
        catalogSourceName={testCatalogSource.metadata.name}
        subscription={testSubscription}
        defaultNS="default"
        canSubscribe
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

  it('does not render link if no subscriptions exist in the current namespace', () => {
    wrapper = wrapper.setProps({ subscription: null });

    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .dive()
        .text(),
    ).toContain('None');
  });

  it('renders column with link to subscriptions', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .dive()
        .find(Link)
        .at(0)
        .props().to,
    ).toEqual(`/operatormanagement/ns/default?name=${testSubscription.metadata.name}`);
    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .dive()
        .find(Link)
        .at(0)
        .childAt(0)
        .text(),
    ).toEqual('View');
  });

  it('renders button to create new subscription if `canSubscribe` is true', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .dive()
        .find(Link)
        .at(1)
        .find(Button)
        .render()
        .text(),
    ).toEqual('Create Subscription');
  });

  it('does not render button to create new subscription if `canSubscribe` is false', () => {
    wrapper = wrapper.setProps({ canSubscribe: false });

    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .dive()
        .find(Link)
        .at(1)
        .exists(),
    ).toBe(false);
  });
});

describe(PackageManifestList.displayName, () => {
  let wrapper: ShallowWrapper<PackageManifestListProps>;
  let packages: PackageManifestKind[];

  beforeEach(() => {
    const otherPackageManifest = _.cloneDeep(testPackageManifest);
    otherPackageManifest.status.catalogSource = 'another-catalog-source';
    otherPackageManifest.status.catalogSourceDisplayName = 'Another Catalog Source';
    otherPackageManifest.status.catalogSourcePublisher = 'Some Publisher';
    packages = [otherPackageManifest, testPackageManifest];

    wrapper = shallow(
      <PackageManifestList.WrappedComponent
        loaded
        data={packages}
        operatorGroup={null}
        subscription={null}
      />,
    );
  });

  it('renders a section for each unique `CatalogSource` for the given packages', () => {
    expect(wrapper.find('.co-catalogsource-list__section').length).toEqual(2);
    packages.forEach(({ status }, i) => {
      expect(
        wrapper
          .find('.co-catalogsource-list__section')
          .at(i)
          .find('h3')
          .text(),
      ).toEqual(status.catalogSourceDisplayName);
    });
  });

  it('renders `Table` component with correct props for each section', () => {
    expect(wrapper.find(Table).length).toEqual(2);
    packages.forEach((pkg, i) => {
      expect(
        wrapper
          .find('.co-catalogsource-list__section')
          .at(i)
          .find(Table)
          .props().Header,
      ).toEqual(PackageManifestTableHeader);
      expect(
        wrapper
          .find('.co-catalogsource-list__section')
          .at(i)
          .find(Table)
          .props().data.length,
      ).toEqual(1);
    });
  });
});

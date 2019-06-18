import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';

import { PackageManifestHeader, PackageManifestHeaderProps, PackageManifestRow, PackageManifestRowProps, PackageManifestList, PackageManifestListProps } from '../../../public/components/operator-lifecycle-manager/package-manifest';
import { ClusterServiceVersionLogo, PackageManifestKind } from '../../../public/components/operator-lifecycle-manager';
import { ListHeader, ColHead, List, ListInnerProps } from '../../../public/components/factory';
import { testPackageManifest, testCatalogSource, testSubscription } from '../../../__mocks__/k8sResourcesMocks';

describe(PackageManifestHeader.displayName, () => {
  let wrapper: ShallowWrapper<PackageManifestHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<PackageManifestHeader />);
  });

  it('renders column header for package name', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(0).childAt(0).text()).toEqual('Name');
  });

  it('renders column header for latest CSV version for package in catalog', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(1).childAt(0).text()).toEqual('Latest Version');
  });

  it('renders column header for subscriptions', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(2).childAt(0).text()).toEqual('Subscriptions');
  });
});

describe(PackageManifestRow.displayName, () => {
  let wrapper: ShallowWrapper<PackageManifestRowProps>;

  beforeEach(() => {
    wrapper = shallow(<PackageManifestRow obj={testPackageManifest} catalogSourceNamespace={testCatalogSource.metadata.namespace} catalogSourceName={testCatalogSource.metadata.name} subscription={testSubscription} defaultNS="default" canSubscribe={true} />);
  });

  it('renders column for package name and logo', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ClusterServiceVersionLogo).props().displayName).toEqual(testPackageManifest.status.channels[0].currentCSVDesc.displayName);
  });

  it('renders column for latest CSV version for package in catalog', () => {
    const {name, currentCSVDesc: {version}} = testPackageManifest.status.channels[0];
    expect(wrapper.find('.co-resource-list__item').childAt(1).text()).toEqual(`${version} (${name})`);
  });

  it('does not render link if no subscriptions exist in the current namespace', () => {
    wrapper = wrapper.setProps({subscription: null});

    expect(wrapper.find('.co-resource-list__item').childAt(2).text()).toContain('None');
  });

  it('renders column with link to subscriptions', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(2).find(Link).at(0).props().to).toEqual(`/operatormanagement/ns/default?name=${testSubscription.metadata.name}`);
    expect(wrapper.find('.co-resource-list__item').childAt(2).find(Link).at(0).childAt(0).text()).toEqual('View');
  });

  it('renders button to create new subscription if `canSubscribe` is true', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(2).find('button').text()).toEqual('Create Subscription');
  });

  it('does not render button to create new subscription if `canSubscribe` is false', () => {
    wrapper = wrapper.setProps({canSubscribe: false});

    expect(wrapper.find('.co-resource-list__item').childAt(2).find('button').exists()).toBe(false);
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

    wrapper = shallow(<PackageManifestList.WrappedComponent loaded={true} data={packages} operatorGroup={null} subscription={null} />);
  });

  it('renders a section for each unique `CatalogSource` for the given packages', () => {
    expect(wrapper.find('.co-catalogsource-list__section').length).toEqual(2);
    packages.forEach(({status}, i) => {
      expect(wrapper.find('.co-catalogsource-list__section').at(i).find('h3').text()).toEqual(status.catalogSourceDisplayName);
    });
  });

  it('renders `List` component with correct props for each section', () => {
    expect(wrapper.find(List).length).toEqual(2);
    packages.forEach((pkg, i) => {
      expect(wrapper.find('.co-catalogsource-list__section').at(i).find<ListInnerProps>(List).props().Header).toEqual(PackageManifestHeader);
      expect(wrapper.find('.co-catalogsource-list__section').at(i).find<ListInnerProps>(List).props().data.length).toEqual(1);
      expect(wrapper.find('.co-catalogsource-list__section').at(i).find<ListInnerProps>(List).props().label).toEqual('Package Manifests');
    });
  });
});

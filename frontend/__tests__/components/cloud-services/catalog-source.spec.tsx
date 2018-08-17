/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { safeDump, safeLoad } from 'js-yaml';

import { CatalogSourceDetails, CatalogSourceDetailsProps, CatalogSourceDetailsPage, CatalogSourceDetailsPageProps, PackageHeader, PackageHeaderProps, PackageRow, PackageRowProps, PackageList, PackageListProps, CreateSubscriptionYAML, CreateSubscriptionYAMLProps, CatalogSourcesPage, CatalogSourcePageProps, CatalogSourceList, CatalogSourceListProps, CatalogSourceHeader, CatalogSourceHeaderProps, CatalogSourceRow, CatalogSourceRowProps } from '../../../public/components/cloud-services/catalog-source';
import { ClusterServiceVersionLogo, olmNamespace } from '../../../public/components/cloud-services';
import { referenceForModel } from '../../../public/module/k8s';
import { SubscriptionModel, CatalogSourceModel, ConfigMapModel } from '../../../public/models';
import { ListHeader, ColHead, List, MultiListPage, ResourceRow, DetailsPage } from '../../../public/components/factory';
import { Firehose, LoadingBox, ErrorBoundary, ResourceLink, MsgBox, Timestamp } from '../../../public/components/utils';
import { CreateYAML, CreateYAMLProps } from '../../../public/components/create-yaml';
import { testPackage, testCatalogSource, testClusterServiceVersion, testSubscription } from '../../../__mocks__/k8sResourcesMocks';

describe(PackageHeader.displayName, () => {
  let wrapper: ShallowWrapper<PackageHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<PackageHeader />);
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

describe(PackageRow.displayName, () => {
  let wrapper: ShallowWrapper<PackageRowProps>;

  beforeEach(() => {
    wrapper = shallow(<PackageRow obj={testPackage} catalogSource={_.cloneDeep(testCatalogSource)} currentCSV={_.cloneDeep(testClusterServiceVersion)} subscription={testSubscription} />);
  });

  it('renders column for package name and logo', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ClusterServiceVersionLogo).props().displayName).toEqual(testClusterServiceVersion.spec.displayName);
  });

  it('renders column for latest CSV version for package in catalog', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(1).text()).toEqual(`${testClusterServiceVersion.spec.version} (stable)`);
  });

  it('does not render link if no subscriptions exist in the current namespace', () => {
    wrapper = wrapper.setProps({subscription: null});

    expect(wrapper.find('.co-resource-list__item').childAt(2).text()).toContain('Not subscribed');
  });

  it('renders column with link to subscriptions', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(2).find(Link).at(0).props().to).toEqual(`/k8s/ns/default/${SubscriptionModel.plural}/${testSubscription.metadata.name}`);
    expect(wrapper.find('.co-resource-list__item').childAt(2).find(Link).at(0).childAt(0).text()).toEqual('View subscription');
  });

  it('renders button to create new subscription', () => {
    wrapper = wrapper.setProps({subscription: null});

    expect(wrapper.find('.co-resource-list__item').childAt(2).find('button').text()).toEqual('Create Subscription');
  });
});

describe(PackageList.displayName, () => {
  let wrapper: ShallowWrapper<PackageListProps>;

  beforeEach(() => {
    wrapper = shallow(<PackageList packages={[testPackage]} catalogSource={testCatalogSource} clusterServiceVersions={[testClusterServiceVersion]} subscriptions={[]} />);
  });

  it('renders `List` component with correct props', () => {
    expect(wrapper.find<any>(List).props().data.length).toEqual(1);
    expect(wrapper.find<any>(List).props().Row).toBeDefined();
    expect(wrapper.find<any>(List).props().Header).toEqual(PackageHeader);
    expect(wrapper.find<any>(List).props().label).toEqual('Packages');
    expect(wrapper.find<any>(List).props().loaded).toBe(true);
    expect(wrapper.find<any>(List).props().EmptyMsg).toBeDefined();
  });

  it('adds `rowKey` to package data passed to `List` component', () => {
    expect(wrapper.find<any>(List).props().data.some(pkg => _.isEmpty(pkg.rowKey))).toBe(false);
  });

});

describe(CatalogSourceDetails.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourceDetailsProps>;
  let obj: CatalogSourceDetailsProps['obj'];
  let configMap: CatalogSourceDetailsProps['configMap'];
  const packages = safeDump([testPackage]);

  beforeEach(() => {
    obj = _.cloneDeep(testCatalogSource);
    configMap = {apiVersion: 'v1', kind: 'ConfigMap', metadata: {name: 'catalog', namespace: 'default'}, data: {packages}};

    wrapper = shallow(<CatalogSourceDetails obj={obj} configMap={configMap} subscription={null} />);
  });

  // TODO: Enzyme cannot test error boundary components (https://github.com/airbnb/enzyme/issues/1255)
  xit('renders fallback component if there is an error parsing the catalog', () => {
    wrapper = wrapper.setProps({configMap: {...configMap, data: {packages: '"no packages" here'}}});
    wrapper.dive().childAt(0).dive();

    expect(wrapper.find(ErrorBoundary).exists()).toBe(true);
    expect(wrapper.find(MsgBox).exists()).toBe(true);
  });

  it('renders nothing if not all resources are loaded', () => {
    wrapper = wrapper.setProps({obj: null, configMap: null});

    expect(wrapper.find('.co-catalog-details').exists()).toBe(false);
  });

  it('renders name and publisher of the catalog', () => {
    wrapper = wrapper.dive().childAt(0).dive();

    expect(wrapper.findWhere(node => node.equals(<dt>Name</dt>)).parents().at(0).find('dd').text()).toEqual(obj.spec.displayName);
    expect(wrapper.findWhere(node => node.equals(<dt>Publisher</dt>)).parents().at(0).find('dd').text()).toEqual(obj.spec.publisher);
  });

  it('renders a `PackageList` component', () => {
    wrapper = wrapper = wrapper.dive().childAt(0).dive();

    expect(wrapper.find(PackageList).props().packages).toEqual(safeLoad(packages));
    expect(wrapper.find(PackageList).props().catalogSource).toEqual(obj);
  });
});

describe(CatalogSourceDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourceDetailsPageProps>;
  let match: CatalogSourceDetailsPageProps['match'];

  beforeEach(() => {
    match = {isExact: true, params: {ns: 'default', name: 'some-catalog'}, path: '', url: ''};
    wrapper = shallow(<CatalogSourceDetailsPage match={match} />);
  });

  it('renders `DetailsPage` with correct props', () => {
    expect(wrapper.find(DetailsPage).props().kind).toEqual(referenceForModel(CatalogSourceModel));
    expect(wrapper.find(DetailsPage).props().pages.map(p => p.name)).toEqual(['Overview', 'YAML']);
    expect(wrapper.find(DetailsPage).props().pages[0].component).toEqual(CatalogSourceDetails);
    expect(wrapper.find(DetailsPage).props().resources).toEqual([
      {kind: 'ConfigMap', isList: false, namespace: match.params.ns, name: match.params.name, prop: 'configMap'},
      {kind: referenceForModel(SubscriptionModel), isList: true, namespace: match.params.ns, prop: 'subscription'},
    ]);
  });
});

describe(CatalogSourceHeader.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourceHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<CatalogSourceHeader />);
  });

  it('renders column header for catalog source name', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(0).props().sortField).toEqual('metadata.name');
    expect(wrapper.find(ListHeader).find(ColHead).at(0).childAt(0).text()).toEqual('Name');
  });

  it('renders column header for catalog source namespace', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(1).props().sortField).toEqual('metadata.namespace');
    expect(wrapper.find(ListHeader).find(ColHead).at(1).childAt(0).text()).toEqual('Namespace');
  });

  it('renders column header for catalog source publisher', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(2).childAt(0).text()).toEqual('Publisher');
  });

  it('renders column header for creation date', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(3).childAt(0).text()).toEqual('Created');
  });
});

describe(CatalogSourceRow.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourceRowProps>;

  beforeEach(() => {
    wrapper = shallow(<CatalogSourceRow obj={testCatalogSource} />);
  });

  it('renders column for catalog source name', () => {
    expect(wrapper.find(ResourceRow).childAt(0).find(ResourceLink).props().kind).toEqual(referenceForModel(CatalogSourceModel));
    expect(wrapper.find(ResourceRow).childAt(0).find(ResourceLink).props().namespace).toEqual(testCatalogSource.metadata.namespace);
    expect(wrapper.find(ResourceRow).childAt(0).find(ResourceLink).props().name).toEqual(testCatalogSource.metadata.name);
    expect(wrapper.find(ResourceRow).childAt(0).find(ResourceLink).props().title).toEqual(testCatalogSource.metadata.uid);
  });

  it('renders column for catalog source namespace', () => {
    expect(wrapper.find(ResourceRow).childAt(1).find(ResourceLink).props().kind).toEqual('Namespace');
    expect(wrapper.find(ResourceRow).childAt(1).find(ResourceLink).props().title).toEqual(testCatalogSource.metadata.namespace);
    expect(wrapper.find(ResourceRow).childAt(1).find(ResourceLink).props().displayName).toEqual(testCatalogSource.metadata.namespace);
  });

  it('renders column for catalog source publisher', () => {
    expect(wrapper.find(ResourceRow).childAt(2).text()).toEqual(testCatalogSource.spec.publisher);
  });

  it('renders column with creation date', () => {
    expect(wrapper.find(ResourceRow).find(Timestamp).exists()).toBe(true);
  });
});

xdescribe(CatalogSourceList.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourceListProps>;
  let globalCatalogSource: CatalogSourceListProps['globalCatalogSource'];
  let globalConfigMap: CatalogSourceListProps['globalConfigMap'];
  let configMap: CatalogSourceListProps['configMap'];
  let subscription: CatalogSourceListProps['subscription'];

  beforeEach(() => {
    globalCatalogSource = {};
    globalConfigMap = {};
    configMap = {};
    subscription = {};

    wrapper = shallow(<CatalogSourceList loaded={true} data={[testCatalogSource]} configMap={configMap} globalConfigMap={globalConfigMap} globalCatalogSource={globalCatalogSource} subscription={subscription} />);
  });

  it('renders empty message if loaded and no catalog sources present', () => {
    wrapper = wrapper.setProps({data: []});

    expect(wrapper.find(MsgBox).exists()).toBe(true);
  });

  it('renders `LoadingBox` if loading', () => {
    wrapper = wrapper.setProps({loaded: false});

    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('renders section for each catalog source', () => {
    expect(wrapper.find('.co-catalogsource-list__section').length).toEqual(1);
  });
});

describe(CatalogSourcesPage.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourcePageProps>;

  it('renders a `MultiListPage` component with correct props', () => {
    wrapper = shallow(<CatalogSourcesPage namespace="default" />);

    expect(wrapper.find(MultiListPage).props().title).toEqual('Operator Catalog Sources');
    expect(wrapper.find(MultiListPage).props().showTitle).toBe(true);
    expect(wrapper.find(MultiListPage).props().ListComponent).toEqual(CatalogSourceList);
    expect(wrapper.find(MultiListPage).props().filterLabel).toEqual('Packages by name');
    expect(wrapper.find(MultiListPage).props().resources).toEqual([
      {kind: referenceForModel(CatalogSourceModel), isList: true, namespaced: true, prop: 'catalogSource'},
      {kind: ConfigMapModel.kind, isList: true, namespaced: true, prop: 'configMap'},
      {kind: referenceForModel(CatalogSourceModel), isList: true, namespace: olmNamespace, prop: 'globalCatalogSource'},
      {kind: ConfigMapModel.kind, isList: true, namespace: olmNamespace, prop: 'globalConfigMap'},
      {kind: referenceForModel(SubscriptionModel), isList: true, namespaced: true, prop: 'subscription'},
    ]);
  });

  it('does not include global `CatalogSource` if already in that namespace', () => {
    wrapper = shallow(<CatalogSourcesPage namespace={olmNamespace} />);

    expect(wrapper.find(MultiListPage).props().resources).toEqual([
      {kind: referenceForModel(CatalogSourceModel), isList: true, namespaced: true, prop: 'catalogSource'},
      {kind: ConfigMapModel.kind, isList: true, namespaced: true, prop: 'configMap'},
      {kind: referenceForModel(SubscriptionModel), isList: true, namespaced: true, prop: 'subscription'},
    ]);
  });
});

describe(CreateSubscriptionYAML.displayName, () => {
  let wrapper: ShallowWrapper<CreateSubscriptionYAMLProps>;
  let locationMock: Location;

  beforeEach(() => {
    locationMock = {search: `?pkg=${testPackage.packageName}&catalog=ocs&catalogNamespace=${olmNamespace}`} as Location;

    wrapper = shallow(<CreateSubscriptionYAML match={{isExact: true, url: '', path: '', params: {ns: 'default', pkgName: testPackage.packageName}}} location={locationMock} />);
  });

  it('renders a `Firehose` for the catalog ConfigMap', () => {
    expect(wrapper.find<any>(Firehose).props().resources).toEqual([
      {kind: 'ConfigMap', name: 'ocs', namespace: olmNamespace, isList: false, prop: 'ConfigMap'}
    ]);
  });

  xit('renders YAML editor component wrapped by an error boundary component', () => {
    wrapper = wrapper.setProps({ConfigMap: {loaded: true, data: {data: {packages: safeDump([testPackage])}}}} as any);

    expect(wrapper.find(Firehose).childAt(0).dive().find(ErrorBoundary).exists()).toBe(true);
    expect(wrapper.find(Firehose).childAt(0).dive().find(ErrorBoundary).childAt(0).dive().find(CreateYAML).exists()).toBe(true);
  });

  xit('passes example YAML templates using the package default channel', () => {
    wrapper = wrapper.setProps({ConfigMap: {loaded: true, data: {data: {packages: safeDump([testPackage])}}}} as any);

    const createYAML = wrapper.find(Firehose).childAt(0).dive().find(ErrorBoundary).childAt(0).dive<CreateYAMLProps, {}>();
    const subTemplate = safeDump(createYAML.props().template);

    expect(subTemplate.kind).toContain(SubscriptionModel.kind);
    expect(subTemplate.spec.name).toEqual(testPackage.packageName);
    expect(subTemplate.spec.channel).toEqual(testPackage.channels[0].name);
    expect(subTemplate.spec.startingCSV).toEqual(testPackage.channels[0].currentCSV);
    expect(subTemplate.spec.source).toEqual('ocs');
  });

  xit('does not render YAML editor component if ConfigMap has not loaded yet', () => {
    wrapper = wrapper.setProps({ConfigMap: {loaded: false}} as any);

    expect(wrapper.find(Firehose).childAt(0).dive().find(CreateYAML).exists()).toBe(false);
    expect(wrapper.find(Firehose).childAt(0).dive().find(ErrorBoundary).childAt(0).dive().find(LoadingBox).exists()).toBe(true);
  });
});

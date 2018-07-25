/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { safeLoad, safeDump } from 'js-yaml';
import Spy = jasmine.Spy;

import { CatalogSourceDetails, CatalogSourceFirehose, CatalogSourceDetailsProps, CatalogSourceDetailsPage, CatalogSourceDetailsPageProps, PackageHeader, PackageHeaderProps, PackageRow, PackageRowProps, PackageList, PackageListProps, CreateSubscriptionYAML, CreateSubscriptionYAMLProps, CreateSubscriptionYAMLFirehose } from '../../../public/components/cloud-services/catalog-source';
import { ClusterServiceVersionLogo, SubscriptionKind } from '../../../public/components/cloud-services';
import { SubscriptionModel } from '../../../public/models';
import { ListHeader, ColHead, List } from '../../../public/components/factory';
import { Firehose, NavTitle, LoadingBox, ErrorBoundary } from '../../../public/components/utils';
import { CreateYAML } from '../../../public/components/create-yaml';
import { testPackage, testCatalogSource, testClusterServiceVersion, testSubscription } from '../../../__mocks__/k8sResourcesMocks';
import * as yamlTemplates from '../../../public/yaml-templates';

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
    wrapper = shallow(<PackageRow obj={testPackage} catalogSource={_.cloneDeep(testCatalogSource)} currentCSV={_.cloneDeep(testClusterServiceVersion)} allPkgSubscriptions={[_.cloneDeep(testSubscription)]} namespace="default" />);
  });

  it('renders column for package name and logo', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ClusterServiceVersionLogo).props().displayName).toEqual(testClusterServiceVersion.spec.displayName);
  });

  it('renders column for latest CSV version for package in catalog', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(1).text()).toEqual(`${testClusterServiceVersion.spec.version} (stable)`);
  });

  it('renders column with link to subscriptions if any', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(2).find(Link).props().to).toEqual(`/k8s/ns/default/${SubscriptionModel.plural}?name=${testSubscription.spec.name}`);
    expect(wrapper.find('.co-resource-list__item').childAt(2).find(Link).childAt(0).text()).toEqual('View subscription');
  });

  it('renders column placeholder if no subscriptions exist for package', () => {
    wrapper = wrapper.setProps({allPkgSubscriptions: []});

    expect(wrapper.find('.co-resource-list__item').childAt(2).text()).toContain('Not subscribed');
  });

  it('renders button to create new subscription which triggers modal if no subscription exists', () => {
    wrapper = wrapper.setProps({allPkgSubscriptions: []});

    expect(wrapper.find('.co-resource-list__item').childAt(2).find('button').text()).toEqual('Subscribe');
  });

  it('renders button to create new subscription which triggers modal if viewing "all-namespaces"', () => {
    wrapper = wrapper.setProps({namespace: null});

    expect(wrapper.find('.co-resource-list__item').childAt(2).find('button').text()).toEqual('Subscribe');
  });

  it('does not render subscribe button if there is a subscription', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(2).find('button').exists()).toBe(false);
  });
});

describe(PackageList.displayName, () => {
  let wrapper: ShallowWrapper<PackageListProps>;
  let csvFor: Spy;
  let subscriptionsFor: Spy;

  beforeEach(() => {
    csvFor = jasmine.createSpy('csvForSpy').and.returnValue(testClusterServiceVersion);
    subscriptionsFor = jasmine.createSpy('subscriptionsForSpy').and.returnValue([testSubscription]);

    wrapper = shallow(<PackageList packages={[testPackage]} catalogSource={testCatalogSource} namespace="default" csvFor={csvFor} subscriptionsFor={subscriptionsFor} />);
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

  // TODO(alecmerdler): Test custom row logic with spies
});

describe(CatalogSourceDetails.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourceDetailsProps>;
  let catalogSource: CatalogSourceDetailsProps['catalogSource'];
  let configMap: CatalogSourceDetailsProps['configMap'];
  let subscription: CatalogSourceDetailsProps['subscription'];
  const packages = safeDump([testPackage]);

  beforeEach(() => {
    catalogSource = {loaded: true, data: _.cloneDeep(testCatalogSource), loadError: ''};
    configMap = {loaded: true, data: {data: {packages}}, loadError: ''};
    subscription = {loaded: true, data: [], loadError: ''};

    wrapper = shallow(<CatalogSourceDetails catalogSource={catalogSource} configMap={configMap} subscription={subscription} ns="default" />);
  });

  it('renders nothing if not all resources are loaded', () => {
    catalogSource.loaded = false;
    configMap.loaded = false;
    subscription.loaded = false;
    wrapper = wrapper.setProps({catalogSource, configMap, subscription});

    expect(wrapper.find('.co-catalog-details').exists()).toBe(false);
  });

  it('renders name and publisher of the catalog', () => {
    expect(wrapper.findWhere(node => node.equals(<dt>Name</dt>)).parents().at(0).find('dd').text()).toEqual(catalogSource.data.spec.displayName);
    expect(wrapper.findWhere(node => node.equals(<dt>Publisher</dt>)).parents().at(0).find('dd').text()).toEqual(catalogSource.data.spec.publisher);
  });

  it('renders a `PackageList` component', () => {
    expect(wrapper.find(PackageList).props().packages).toEqual(safeLoad(packages));
    expect(wrapper.find(PackageList).props().namespace).toEqual('default');
    expect(wrapper.find(PackageList).props().catalogSource).toEqual(catalogSource.data);
  });
});

describe(CatalogSourceDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourceDetailsPageProps>;

  beforeEach(() => {
    const match = {isExact: true, params: {ns: 'default'}, path: '', url: ''};
    wrapper = shallow(<CatalogSourceDetailsPage match={match} />);
  });

  it('renders catalog display name', () => {
    expect(wrapper.find(Helmet).find('title').text()).toEqual('Open Cloud Services');
    expect(wrapper.find(NavTitle).props().detail).toBe(true);
    expect(wrapper.find(NavTitle).props().title).toEqual('Open Cloud Services');
  });

  it('renders `CatalogSourceDetails` component wrapped in a custom `Firehose`', () => {
    const configMap = {loaded: false, loadError: null, data: null};
    const subscription = {loaded: false, loadError: null, data: null};
    const catalogSource = {loaded: false, loadError: null, data: null};

    const render = wrapper.find(CatalogSourceFirehose).props().render;
    wrapper = shallow(<div>{render({configMap, subscription, catalogSource})}</div>);

    expect(wrapper.find(CatalogSourceDetails).props().ns).toEqual('default');
    expect(wrapper.find(CatalogSourceDetails).props().configMap).toEqual(configMap);
    expect(wrapper.find(CatalogSourceDetails).props().subscription).toEqual(subscription);
    expect(wrapper.find(CatalogSourceDetails).props().catalogSource).toEqual(catalogSource);
  });
});

describe(CreateSubscriptionYAML.displayName, () => {
  let wrapper: ShallowWrapper<CreateSubscriptionYAMLProps>;
  let registerTemplateSpy: Spy;

  beforeEach(() => {
    registerTemplateSpy = spyOn(yamlTemplates, 'registerTemplate');

    wrapper = shallow(<CreateSubscriptionYAML match={{isExact: true, url: '', path: '', params: {ns: 'default', pkgName: testPackage.packageName}}} />);
  });

  it('renders a custom `Firehose` for the catalog ConfigMap', () => {
    expect(wrapper.find(CreateSubscriptionYAMLFirehose).shallow().find(Firehose).props().resources).toEqual([
      {kind: 'ConfigMap', name: 'tectonic-ocs', namespace: 'tectonic-system', isList: false, prop: 'ConfigMap'}
    ]);
  });

  it('renders YAML editor component wrapped by an error boundary component', () => {
    const render = wrapper.find(CreateSubscriptionYAMLFirehose).props().render;
    wrapper = shallow(<div>{render({ConfigMap: {loaded: true, data: {data: {packages: safeDump([testPackage])}}}})}</div>);

    expect(wrapper.childAt(0).dive().find(ErrorBoundary).exists()).toBe(true);
    expect(wrapper.childAt(0).dive().find(ErrorBoundary).childAt(0).dive().find(CreateYAML).exists()).toBe(true);
  });

  it('registers example YAML templates using the package default channel', () => {
    const render = wrapper.find(CreateSubscriptionYAMLFirehose).props().render;
    wrapper = shallow(<div>{render({ConfigMap: {loaded: true, data: {data: {packages: safeDump([testPackage])}}}})}</div>);

    wrapper.childAt(0).dive().find(ErrorBoundary).childAt(0).dive();
    const subTemplate: SubscriptionKind = safeLoad(registerTemplateSpy.calls.argsFor(0)[1]);

    expect(registerTemplateSpy.calls.count()).toEqual(1);
    expect(subTemplate.kind).toContain(SubscriptionModel.kind);
    expect(subTemplate.spec.name).toEqual(testPackage.packageName);
    expect(subTemplate.spec.channel).toEqual(testPackage.channels[0].name);
    expect(subTemplate.spec.startingCSV).toEqual(testPackage.channels[0].currentCSV);
    expect(subTemplate.spec.source).toEqual('tectonic-ocs');
  });

  it('does not render YAML editor component if ConfigMap has not loaded yet', () => {
    const render = wrapper.find(CreateSubscriptionYAMLFirehose).props().render;
    wrapper = shallow(<div>{render({ConfigMap: {loaded: false}})}</div>);

    expect(wrapper.childAt(0).dive().find(CreateYAML).exists()).toBe(false);
    expect(wrapper.childAt(0).dive().find(ErrorBoundary).childAt(0).dive().find(LoadingBox).exists()).toBe(true);
  });
});

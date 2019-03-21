/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';

import { CatalogSourceDetails, CatalogSourceDetailsProps, CatalogSourceDetailsPage, CatalogSourceDetailsPageProps, CreateSubscriptionYAML, CreateSubscriptionYAMLProps } from '../../../public/components/operator-lifecycle-manager/catalog-source';
import { PackageManifestList } from '../../../public/components/operator-lifecycle-manager/package-manifest';
import { visibilityLabel } from '../../../public/components/operator-lifecycle-manager';
import { referenceForModel, referenceForModelCompatible } from '../../../public/module/k8s';
import { SubscriptionModel, CatalogSourceModel, PackageManifestModel, OperatorGroupModel } from '../../../public/models';
import { DetailsPage } from '../../../public/components/factory';
import { Firehose, LoadingBox, ErrorBoundary } from '../../../public/components/utils';
import { CreateYAML, CreateYAMLProps } from '../../../public/components/create-yaml';
import { testCatalogSource, testPackageManifest } from '../../../__mocks__/k8sResourcesMocks';

describe(CatalogSourceDetails.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourceDetailsProps>;
  let obj: CatalogSourceDetailsProps['obj'];

  beforeEach(() => {
    obj = _.cloneDeep(testCatalogSource);

    wrapper = shallow(<CatalogSourceDetails obj={obj} packageManifests={[testPackageManifest]} subscriptions={[]} operatorGroups={[]} />);
  });

  it('renders nothing if not all resources are loaded', () => {
    wrapper = wrapper.setProps({obj: null});

    expect(wrapper.find('.co-catalog-details').exists()).toBe(false);
  });

  it('renders name and publisher of the catalog', () => {
    expect(wrapper.findWhere(node => node.equals(<dt>Name</dt>)).parents().at(0).find('dd').text()).toEqual(obj.spec.displayName);
    expect(wrapper.findWhere(node => node.equals(<dt>Publisher</dt>)).parents().at(0).find('dd').text()).toEqual(obj.spec.publisher);
  });

  it('renders a `PackageManifestList` component', () => {
    expect(wrapper.find(PackageManifestList).props().data).toEqual([testPackageManifest]);
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
    const selector = {matchLabels: {catalog: match.params.name}, matchExpressions: [{key: visibilityLabel, operator: 'DoesNotExist'}]};

    expect(wrapper.find(DetailsPage).props().kind).toEqual(referenceForModel(CatalogSourceModel));
    expect(wrapper.find(DetailsPage).props().pages.map(p => p.name)).toEqual(['Overview', 'YAML']);
    expect(wrapper.find(DetailsPage).props().pages[0].component).toEqual(CatalogSourceDetails);
    expect(wrapper.find(DetailsPage).props().resources).toEqual([
      {kind: referenceForModelCompatible(PackageManifestModel)('packages.apps.redhat.com~v1alpha1~PackageManifest'), isList: true, namespace: match.params.ns, selector, prop: 'packageManifests'},
      {kind: referenceForModel(SubscriptionModel), isList: true, namespace: match.params.ns, prop: 'subscriptions'},
      {kind: referenceForModelCompatible(OperatorGroupModel)('operators.coreos.com~v1alpha2~OperatorGroup'), isList: true, namespace: match.params.ns, prop: 'operatorGroups'},
    ]);
  });
});

describe(CreateSubscriptionYAML.displayName, () => {
  let wrapper: ShallowWrapper<CreateSubscriptionYAMLProps>;
  let locationMock: Location;

  beforeEach(() => {
    locationMock = {search: `?pkg=${testPackageManifest.metadata.name}&catalog=ocs&catalogNamespace=default`} as Location;

    wrapper = shallow(<CreateSubscriptionYAML match={{isExact: true, url: '', path: '', params: {ns: 'default', pkgName: testPackageManifest.metadata.name}}} location={locationMock} />);
  });

  it('renders a `Firehose` for the `PackageManfest` specified in the URL', () => {
    expect(wrapper.find<any>(Firehose).props().resources).toEqual([{
      kind: referenceForModelCompatible(PackageManifestModel)('packages.apps.redhat.com~v1alpha1~PackageManifest'),
      name: testPackageManifest.metadata.name,
      namespace: 'default',
      isList: false,
      prop: 'packageManifest',
    }, {
      kind: referenceForModelCompatible(OperatorGroupModel)('operators.coreos.com~v1alpha2~OperatorGroup'),
      isList: true,
      namespace: 'default',
      prop: 'operatorGroup',
    }]);
  });

  it('renders YAML editor component wrapped by an error boundary component', () => {
    wrapper = wrapper.setProps({packageManifest: {loaded: true, data: testPackageManifest}} as any);
    const createYAML = wrapper.find(Firehose).childAt(0).dive().dive();

    expect(createYAML.find(ErrorBoundary).exists()).toBe(true);
    expect(createYAML.find(ErrorBoundary).childAt(0).dive().find(CreateYAML).exists()).toBe(true);
  });

  it('passes example YAML templates using the package default channel', () => {
    wrapper = wrapper.setProps({packageManifest: {loaded: true, data: testPackageManifest}} as any);

    const createYAML = wrapper.find(Firehose).childAt(0).dive().dive().find(ErrorBoundary).childAt(0).dive<CreateYAMLProps, {}>();
    const subTemplate = safeLoad(createYAML.props().template);

    expect(subTemplate.kind).toContain(SubscriptionModel.kind);
    expect(subTemplate.spec.name).toEqual(testPackageManifest.metadata.name);
    expect(subTemplate.spec.channel).toEqual(testPackageManifest.status.channels[0].name);
    expect(subTemplate.spec.startingCSV).toEqual(testPackageManifest.status.channels[0].currentCSV);
    expect(subTemplate.spec.source).toEqual('ocs');
  });

  it('does not render YAML editor component if `PackageManifest` has not loaded yet', () => {
    wrapper = wrapper.setProps({packageManifest: {loaded: false}} as any);
    const createYAML = wrapper.find(Firehose).childAt(0).dive().dive();

    expect(createYAML.find(CreateYAML).exists()).toBe(false);
    expect(createYAML.find(ErrorBoundary).childAt(0).dive().find(LoadingBox).exists()).toBe(true);
  });
});

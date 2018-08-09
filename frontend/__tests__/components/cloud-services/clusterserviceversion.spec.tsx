/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import { shallow, ShallowWrapper, mount, ReactWrapper } from 'enzyme';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';

import { ClusterServiceVersionsDetailsPage, ClusterServiceVersionsDetailsPageProps, ClusterServiceVersionDetails, ClusterServiceVersionDetailsProps, ClusterServiceVersionsPage, ClusterServiceVersionsPageProps, ClusterServiceVersionList, ClusterServiceVersionListProps, ClusterServiceVersionHeader, ClusterServiceVersionRow, ClusterServiceVersionRowProps } from '../../../public/components/cloud-services/clusterserviceversion';
import { ClusterServiceVersionKind, ClusterServiceVersionLogo, ClusterServiceVersionLogoProps, referenceForCRDDesc } from '../../../public/components/cloud-services';
import { DetailsPage, ListPage, ListHeader, ColHead, List } from '../../../public/components/factory';
import { testClusterServiceVersion } from '../../../__mocks__/k8sResourcesMocks';
import { Timestamp, OverflowLink, Dropdown, MsgBox, ResourceLink, ResourceCog, ErrorBoundary, LoadingBox } from '../../../public/components/utils';
import { referenceForModel } from '../../../public/module/k8s';
import { ClusterServiceVersionModel } from '../../../public/models';

import * as operatorLogo from '../../../public/imgs/operator.svg';

describe(ClusterServiceVersionHeader.displayName, () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionHeader />);
  });

  it('renders `ListHeader`', () => {
    expect(wrapper.find(ListHeader).exists()).toBe(true);
  });

  it('renders column header for app name and logo', () => {
    expect(wrapper.find(ColHead).at(0).childAt(0).text()).toEqual('Name');
    expect(wrapper.find(ColHead).at(0).props().sortField).toEqual('metadata.name');
  });

  it('renders column header for app namespace', () => {
    expect(wrapper.find(ColHead).at(1).childAt(0).text()).toEqual('Namespace');
  });

  it('renders column header for Operator deployment', () => {
    expect(wrapper.find(ColHead).at(2).childAt(0).text()).toEqual('Deployment');
  });

  it('renders column header for app status', () => {
    expect(wrapper.find(ColHead).at(3).childAt(0).text()).toEqual('Status');
  });
});

describe(ClusterServiceVersionRow.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionRowProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionRow obj={testClusterServiceVersion} />).childAt(0).shallow();
  });

  it('renders a component wrapped in an `ErrorBoundary', () => {
    wrapper = shallow(<ClusterServiceVersionRow obj={testClusterServiceVersion} />);

    expect(wrapper.find(ErrorBoundary).exists()).toBe(true);
  });

  it('renders `ResourceCog` with actions', () => {
    const col = wrapper.find('.row').childAt(0);

    expect(col.find(ResourceCog).props().resource).toEqual(testClusterServiceVersion);
    expect(col.find(ResourceCog).props().kind).toEqual(referenceForModel(ClusterServiceVersionModel));
    expect(col.find(ResourceCog).props().actions.length).toEqual(2);
  });

  it('renders clickable column for app logo and name', () => {
    const col = wrapper.find('.row').childAt(0);

    expect(col.find(Link).props().to).toEqual(`/k8s/ns/${testClusterServiceVersion.metadata.namespace}/${ClusterServiceVersionModel.plural}/${testClusterServiceVersion.metadata.name}`);
    expect(col.find(Link).find(ClusterServiceVersionLogo).exists()).toBe(true);
  });

  it('renders column for app namespace link', () => {
    const link = wrapper.find('.row').childAt(1).find(ResourceLink);

    expect(link.props().kind).toEqual('Namespace');
    expect(link.props().title).toEqual(testClusterServiceVersion.metadata.namespace);
    expect(link.props().name).toEqual(testClusterServiceVersion.metadata.namespace);
  });

  it('renders column with link to Operator deployment', () => {
    const col = wrapper.find('.row').childAt(2);

    expect(col.find(ResourceLink).props().kind).toEqual('Deployment');
    expect(col.find(ResourceLink).props().name).toEqual(testClusterServiceVersion.spec.install.spec.deployments[0].name);
  });

  it('renders column for app status', () => {
    const col = wrapper.find('.row').childAt(3);

    expect(col.childAt(0).text()).toEqual('Enabled');
  });

  it('renders "disabling" status if CSV has `deletionTimestamp`', () => {
    wrapper = wrapper.setProps({obj: _.cloneDeepWith(testClusterServiceVersion, (v, k) => k === 'metadata' ? {...v, deletionTimestamp: Date.now()} : undefined)});
    const col = wrapper.find('.row').childAt(3);

    expect(col.childAt(0).text()).toEqual('Disabling');
  });

  it('renders column with links to app detail view and instances', () => {
    const col = wrapper.find('.row').childAt(4);

    expect(col.find(Link).childAt(0).text()).toEqual('View instances');
  });
});

describe(ClusterServiceVersionLogo.displayName, () => {
  let wrapper: ReactWrapper<ClusterServiceVersionLogoProps>;

  beforeEach(() => {
    const {provider, icon, displayName} = testClusterServiceVersion.spec;
    wrapper = mount(<ClusterServiceVersionLogo icon={icon} displayName={displayName} provider={provider} />);
  });

  it('renders logo image from given base64 encoded image string', () => {
    const image: ReactWrapper<React.ImgHTMLAttributes<any>> = wrapper.find('img');

    expect(image.props().height).toEqual('40');
    expect(image.props().width).toEqual('40');
    expect(image.props().src).toEqual(`data:${testClusterServiceVersion.spec.icon.mediatype};base64,${testClusterServiceVersion.spec.icon.base64data}`);
  });

  it('renders fallback image if given icon is invalid', () => {
    wrapper.setProps({icon: null});
    const fallbackImg: ReactWrapper<React.ImgHTMLAttributes<any>> = wrapper.find('img');

    expect(fallbackImg.props().src).toEqual(operatorLogo);
    expect(fallbackImg.props().height).toEqual('40');
    expect(fallbackImg.props().width).toEqual('40');
  });

  it('renders ClusterServiceVersion name and provider from given spec', () => {
    expect(wrapper.text()).toContain(testClusterServiceVersion.spec.displayName);
    expect(wrapper.text()).toContain(`by ${testClusterServiceVersion.spec.provider.name}`);
  });
});

describe(ClusterServiceVersionList.displayName, () => {

  it('renders `List` with correct props', () => {
    const wrapper = shallow<ClusterServiceVersionListProps>(<ClusterServiceVersionList data={[]} loaded={true} />);

    expect(wrapper.find(List).props().Row).toEqual(ClusterServiceVersionRow);
    expect(wrapper.find(List).props().Header).toEqual(ClusterServiceVersionHeader);
  });
});

describe(ClusterServiceVersionsPage.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionsPageProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionsPage.WrappedComponent kind={referenceForModel(ClusterServiceVersionModel)} namespaceEnabled={true} resourceDescriptions={[]} match={{params: {ns: 'foo'}, isExact: true, path: '', url: ''}} />);
  });

  it('renders a `ListPage` with correct props', () => {
    const listPage = wrapper.find(ListPage);

    expect(listPage.props().kind).toEqual(referenceForModel(ClusterServiceVersionModel));
    expect(listPage.props().ListComponent).toEqual(ClusterServiceVersionList);
    expect(listPage.props().filterLabel).toEqual('Cluster Service Versions by name');
    expect(listPage.props().showTitle).toBe(false);
  });

  it('renders an error page if the namespace is not enabled', () => {
    wrapper = wrapper.setProps({namespaceEnabled: false});
    const msgBox = wrapper.find(MsgBox);
    const listPage = wrapper.find(ListPage);

    expect(listPage.exists()).toBe(false);
    expect(msgBox.exists()).toBe(true);
  });

  it('renders `LoadingBox` if still detecting OpenShift or namespaces/projects are loading', () => {
    wrapper = wrapper.setProps({namespaceEnabled: false, loading: true});
    const msgBox = wrapper.find(MsgBox);
    const listPage = wrapper.find(ListPage);

    expect(listPage.exists()).toBe(false);
    expect(msgBox.exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });
});

describe(ClusterServiceVersionDetails.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionDetails obj={_.cloneDeep(testClusterServiceVersion)} />);
  });

  it('renders info section for ClusterServiceVersion', () => {
    const section = wrapper.find('.co-clusterserviceversion-details__section--info');

    expect(section.exists()).toBe(true);
  });

  it('renders create `Link` if only one `owned` app resource', () => {
    const createButton = wrapper.find('.btn-primary');

    expect(createButton.type()).toEqual(Link);
    expect(createButton.props().to).toEqual(`/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/${referenceForCRDDesc(testClusterServiceVersion.spec.customresourcedefinitions.owned[0])}/new`);
  });

  it('renders a create dropdown button if more than one `owned` app resource', () => {
    let obj = _.cloneDeep(testClusterServiceVersion);
    obj.spec.customresourcedefinitions.owned.push({name: 'foobars.testapp.coreos.com', displayName: 'Foo Bars', version: 'v1', kind: 'FooBars'});
    wrapper.setProps({obj});
    const createButton: ShallowWrapper<any> = wrapper.find('Dropdown');

    expect(createButton.type()).toEqual(Dropdown);
    expect(createButton.props().title).toEqual('Create New');
    expect(createButton.props().items).toEqual({'testresource.testapp.coreos.com': 'Test Resource', 'foobars.testapp.coreos.com': 'Foo Bars'});
    expect(createButton.props().onChange).toBeDefined();
  });

  it('renders description section for ClusterServiceVersion', () => {
    const section = wrapper.find('.co-clusterserviceversion-details__section--description');

    expect(section.find('h1').text()).toEqual('Description');
  });

  it('renders creation date from ClusterServiceVersion', () => {
    expect(wrapper.find(Timestamp).props().timestamp).toEqual(testClusterServiceVersion.metadata.creationTimestamp);
  });

  it('renders list of maintainers from ClusterServiceVersion', () => {
    const maintainers = wrapper.findWhere(node => node.equals(<dt>Maintainers</dt>)).parents().at(0).find('dd');

    expect(maintainers.length).toEqual(testClusterServiceVersion.spec.maintainers.length);

    testClusterServiceVersion.spec.maintainers.forEach((maintainer, i) => {
      expect(maintainers.at(i).text()).toContain(maintainer.name);
      expect(maintainers.at(i).find(OverflowLink).props().value).toEqual(maintainer.email);
      expect(maintainers.at(i).find(OverflowLink).props().href).toEqual(`mailto:${maintainer.email}`);
    });
  });

  it('renders important links from ClusterServiceVersion', () => {
    const links = wrapper.findWhere(node => node.equals(<dt>Links</dt>)).parents().at(0).find('dd');

    expect(links.length).toEqual(testClusterServiceVersion.spec.links.length);
  });

  it('renders empty state for unfulfilled outputs and metadata', () => {
    let emptyClusterServiceVersion: ClusterServiceVersionKind = _.cloneDeep(testClusterServiceVersion);
    emptyClusterServiceVersion.spec.description = '';
    emptyClusterServiceVersion.spec.provider = undefined;
    emptyClusterServiceVersion.spec.links = [];
    emptyClusterServiceVersion.spec.maintainers = [];
    wrapper.setProps({obj: emptyClusterServiceVersion});

    const provider = wrapper.findWhere(node => node.equals(<dt>Provider</dt>)).parents().at(0).find('dd').at(0);
    const links = wrapper.findWhere(node => node.equals(<dt>Links</dt>)).parents().at(0).find('dd');
    const maintainers = wrapper.findWhere(node => node.equals(<dt>Maintainers</dt>)).parents().at(0).find('dd');

    expect(provider.text()).toEqual('Not available');
    expect(links.text()).toEqual('Not available');
    expect(maintainers.text()).toEqual('Not available');
  });
});

describe(ClusterServiceVersionsDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionsDetailsPageProps>;
  const name = 'example';
  const ns = 'default';

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionsDetailsPage match={{params: {ns, name}, isExact: true, url: '', path: ''}} />);
  });

  it('passes URL parameters to `DetailsPage`', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.props().namespace).toEqual(ns);
    expect(detailsPage.props().name).toEqual(name);
    expect(detailsPage.props().kind).toEqual(referenceForModel(ClusterServiceVersionModel));
  });

  it('renders a `DetailsPage` with the correct subpages', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.props().pages[0].name).toEqual('Overview');
    expect(detailsPage.props().pages[0].href).toEqual('');
    expect(detailsPage.props().pages[0].component).toEqual(ClusterServiceVersionDetails);
    expect(detailsPage.props().pages[1].name).toEqual('YAML');
    expect(detailsPage.props().pages[1].href).toEqual('yaml');
    expect(detailsPage.props().pages[2].name).toEqual('Instances');
    expect(detailsPage.props().pages[2].href).toEqual('instances');
  });
});

/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import { shallow, ShallowWrapper, mount, ReactWrapper } from 'enzyme';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';

import { ClusterServiceVersionsDetailsPage, ClusterServiceVersionsDetailsPageProps, ClusterServiceVersionDetails, ClusterServiceVersionDetailsProps, ClusterServiceVersionsPage, ClusterServiceVersionsPageProps, ClusterServiceVersionList, ClusterServiceVersionListProps, ClusterServiceVersionListItem, ClusterServiceVersionListItemProps, ClusterServiceVersionHeader, ClusterServiceVersionRow, ClusterServiceVersionRowProps } from '../../../public/components/cloud-services/clusterserviceversion';
import { ClusterServiceVersionKind, ClusterServiceVersionLogo, ClusterServiceVersionLogoProps, ClusterServiceVersionPhase, appCatalogLabel, AppCatalog, referenceForCRDDesc } from '../../../public/components/cloud-services';
import { DetailsPage, MultiListPage, ListHeader, ColHead } from '../../../public/components/factory';
import { testClusterServiceVersion, localClusterServiceVersion, testResourceInstance, testOperatorDeployment } from '../../../__mocks__/k8sResourcesMocks';
import { StatusBox, Timestamp, OverflowLink, Dropdown, MsgBox, ResourceLink, ResourceCog, ErrorBoundary, LoadingBox } from '../../../public/components/utils';
import { K8sResourceKind, referenceForModel } from '../../../public/module/k8s';
import { ClusterServiceVersionModel } from '../../../public/models';

import * as appsLogoImg from '../../../public/imgs/apps-logo.svg';

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

  it('renders column header for app status', () => {
    expect(wrapper.find(ColHead).at(2).childAt(0).text()).toEqual('Status');
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

  it('renders column for app status', () => {
    const col = wrapper.find('.row').childAt(2);

    expect(col.childAt(0).text()).toEqual('Enabled');
  });

  it('renders "disabling" status if CSV has `deletionTimestamp`', () => {
    wrapper = wrapper.setProps({obj: _.cloneDeepWith(testClusterServiceVersion, (v, k) => k === 'metadata' ? {...v, deletionTimestamp: Date.now()} : undefined)});
    const col = wrapper.find('.row').childAt(2);

    expect(col.childAt(0).text()).toEqual('Disabling');
  });

  it('renders column with links to app detail view and instances', () => {
    const col = wrapper.find('.row').childAt(3);

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

    expect(fallbackImg.props().src).toEqual(appsLogoImg);
    expect(fallbackImg.props().height).toEqual('40');
    expect(fallbackImg.props().width).toEqual('40');
  });

  it('renders ClusterServiceVersion name and provider from given spec', () => {
    expect(wrapper.text()).toContain(testClusterServiceVersion.spec.displayName);
    expect(wrapper.text()).toContain(`by ${testClusterServiceVersion.spec.provider.name}`);
  });
});

describe(ClusterServiceVersionListItem.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionListItemProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionListItem obj={_.cloneDeep(testClusterServiceVersion)} namespaces={[testClusterServiceVersion.metadata.namespace]} />);
  });

  it('renders ClusterServiceVersion logo', () => {
    const logo = wrapper.find(ClusterServiceVersionLogo);

    expect(logo.exists());
    expect(logo.props().icon).toEqual(testClusterServiceVersion.spec.icon[0]);
    expect(logo.props().displayName).toEqual(testClusterServiceVersion.spec.displayName);
    expect(logo.props().provider).toEqual(testClusterServiceVersion.spec.provider);
  });

  it('renders clickable header to navigate to namespace if only one', () => {
    const header = wrapper.find('.co-clusterserviceversion-list-item').childAt(0);

    expect(header.props().style).toEqual({cursor: 'pointer'});
    expect(header.props().onClick).not.toBe(null);
  });

  it('renders button to view details for given application', () => {
    const detailsButton = wrapper.find('.co-clusterserviceversion-list-item__actions').find(Link).at(0);

    expect(detailsButton.props().title).toEqual('View details');
    expect(detailsButton.childAt(0).text()).toEqual('View details');
    expect(detailsButton.props().to).toEqual(`/k8s/ns/${testClusterServiceVersion.metadata.namespace}/${ClusterServiceVersionModel.plural}/${testClusterServiceVersion.metadata.name}`);
    expect(detailsButton.hasClass('btn')).toBe(true);
  });

  it('renders dropdown of installed namespaces if given', () => {
    const namespaces = ['default', 'my-testapp-ns', 'other-ns'];
    wrapper.setProps({namespaces});

    const dropdown = wrapper.find('.co-clusterserviceversion-list-item__actions').find(Dropdown);
    const detailsButton = wrapper.find('.co-clusterserviceversion-list-item__actions').find(Link);

    expect(dropdown.props().title).toEqual('View namespace');
    expect(dropdown.props().items).toEqual(namespaces.reduce((acc, ns) => ({...acc, [ns]: ns}), {}));
    expect(detailsButton.exists()).toBe(false);
  });

  it('renders link to application instances', () => {
    const link = wrapper.find('.co-clusterserviceversion-list-item__actions').find(Link).at(1);

    expect(link.props().title).toEqual('View instances');
    expect(link.childAt(0).text()).toEqual('View instances');
    expect(link.props().to).toEqual(`/k8s/ns/${testClusterServiceVersion.metadata.namespace}/${ClusterServiceVersionModel.plural}/${testClusterServiceVersion.metadata.name}/instances`);
  });
});

describe(ClusterServiceVersionList.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionListProps>;
  let apps: ClusterServiceVersionKind[];
  let deployments: K8sResourceKind[];

  beforeEach(() => {
    let otherClusterServiceVersion = _.cloneDeep(testClusterServiceVersion);
    otherClusterServiceVersion.metadata.name = 'vault';
    apps = [_.cloneDeep(testClusterServiceVersion), otherClusterServiceVersion];
    deployments = new Array(apps.length).fill(_.cloneDeep(testOperatorDeployment)).map((deployment, i) => {
      deployment.metadata.ownerReferences[0].uid = apps[i].metadata.uid;
      return deployment;
    });

    wrapper = shallow(<ClusterServiceVersionList loaded={true} data={[].concat(apps).concat(deployments)} filters={{}} />);
  });

  it('renders section for applications installed from Open Cloud Services', () => {
    const sections = wrapper.find('.co-clusterserviceversion-list');

    expect(sections.length).toEqual(1);
    expect(sections.at(0).find(ClusterServiceVersionListItem).length).toEqual(apps.length);

    sections.at(0).find(ClusterServiceVersionListItem).forEach((listItem) => {
      expect(apps).toContain(listItem.props().obj);
      expect(listItem.props().namespaces).toEqual(apps.filter(app => app.metadata.name === listItem.props().obj.metadata.name).map(app => app.metadata.namespace));
    });
  });

  it('renders empty state if `props.data` is empty', () => {
    wrapper = wrapper.setProps({data: []});
    const statusBox = wrapper.find(StatusBox);

    expect(wrapper.find('.co-clusterserviceversion-list').exists()).toBe(false);
    expect(statusBox.props().label).toEqual('Applications');
    expect(statusBox.props().loaded).toEqual(true);
    expect(statusBox.render().text()).toContain('No Applications Found');
  });

  it('does not display ClusterServiceVersions with non-succeeded `status.phase`', () => {
    let nullCSV = _.cloneDeep(apps[0]);
    let failedCSV = _.cloneDeep(apps[1]);
    nullCSV.status.phase = null;
    failedCSV.status.phase = ClusterServiceVersionPhase.CSVPhaseFailed;
    wrapper.setProps({data: [].concat([nullCSV, failedCSV]).concat(deployments)});

    expect(wrapper.find(ClusterServiceVersionListItem).length).toEqual(0);
  });

  it('filters visible ClusterServiceVersions by `name`', () => {
    const searchFilter = apps[0].spec.displayName.slice(0, 2);
    wrapper = wrapper.setProps({filters: {name: searchFilter}});
    const list = wrapper.find('.co-clusterserviceversion-list__tile');

    expect(list.children().length).toEqual(2);
  });

  it('filters visible ClusterServiceVersions by `Running Status`', () => {
    wrapper.setProps({filters: {'clusterserviceversion-status': 'running'}});
    const list = wrapper.find('.co-clusterserviceversion-list__tile').find(ClusterServiceVersionListItem);

    expect(list.length).toEqual(0);
  });

  xit('filters visible ClusterServiceVersions by `catalog source`', () => {
    // TODO(alecmerdler)
  });

  it('does not render duplicate ClusterServiceVersions with the same `metadata.name` in different namespaces', () => {
    apps[0].metadata.name = 'repeat';
    apps[1].metadata.name = 'repeat';
    wrapper.setProps({data: [].concat(apps).concat(deployments)});
    const list = wrapper.find('.co-clusterserviceversion-list__tile').find(ClusterServiceVersionListItem);

    expect(list.length).toEqual(1);
    expect(list.at(0).props().obj.metadata.name).toEqual('repeat');
  });

  it('only renders ClusterServiceVersions that have an associated `Deployment` using owner references', () => {
    const list = wrapper.find('.co-clusterserviceversion-list__tile').find(ClusterServiceVersionListItem);

    expect(list.length).toEqual(2);
  });
});

describe(ClusterServiceVersionsPage.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionsPageProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionsPage.WrappedComponent kind={referenceForModel(ClusterServiceVersionModel)} namespaceEnabled={true} resourceDescriptions={[]} match={{params: {ns: 'foo'}, isExact: true, path: '', url: ''}} />);
  });

  it('renders a `MultiListPage` for Catalog Sources apps with correct props', () => {
    const listPage = wrapper.find(MultiListPage).at(0);

    expect(listPage.props().resources).toEqual([
      {kind: referenceForModel(ClusterServiceVersionModel), namespaced: true, prop: 'ClusterServiceVersion', selector: {matchLabels: {[appCatalogLabel]: AppCatalog.ocs}}},
      {kind: 'Deployment', namespaced: true, isList: true, prop: 'Deployment'},
    ]);
    expect(listPage.props().dropdownFilters).toBeDefined();
    expect(listPage.props().ListComponent).toEqual(ClusterServiceVersionList);
    expect(listPage.props().filterLabel).toEqual('Applications by name');
    expect(listPage.props().showTitle).toBe(false);
  });

  it('passes `flatten` function to Catalog Sources `MultiListPage` that returns list of all resources', () => {
    const resources = {
      TestResource: {data: [testResourceInstance]},
      'ClusterServiceVersion': {data: [localClusterServiceVersion, testClusterServiceVersion]},
    };
    const flatten = wrapper.find(MultiListPage).at(0).props().flatten;
    const data = flatten(resources);

    expect(data.length).toEqual(3);
  });

  it('renders a `MultiListPage` for custom apps with correct props', () => {
    const listPage = wrapper.find(MultiListPage).at(1);

    expect(listPage.props().resources).toEqual([
      {kind: referenceForModel(ClusterServiceVersionModel), namespaced: true, prop: 'ClusterServiceVersion', selector: {matchExpressions: [{key: appCatalogLabel, operator: 'DoesNotExist', values: []}]}},
    ]);
    // TODO(alecmerdler): Test custom applications list component
    expect(listPage.props().ListComponent).toBeDefined();
    expect(listPage.props().filterLabel).toEqual('Custom Applications by name');
    expect(listPage.props().showTitle).toBe(false);
  });

  it('passes `flatten` function to custom apps `MultiListPage` that returns list of all resources', () => {
    const resources = {
      'ClusterServiceVersion': {data: [localClusterServiceVersion, testClusterServiceVersion]},
    };
    const flatten = wrapper.find(MultiListPage).at(1).props().flatten;
    const data = flatten(resources);

    expect(data.length).toEqual(2);
  });

  it('renders an error page if the namespace is not enabled', () => {
    wrapper = wrapper.setProps({namespaceEnabled: false});
    const msgBox = wrapper.find(MsgBox);
    const listPage = wrapper.find(MultiListPage);

    expect(listPage.exists()).toBe(false);
    expect(msgBox.exists()).toBe(true);
  });

  it('renders `LoadingBox` if still detecting OpenShift or namespaces/projects are loading', () => {
    wrapper = wrapper.setProps({namespaceEnabled: false, loading: true});
    const msgBox = wrapper.find(MsgBox);
    const listPage = wrapper.find(MultiListPage);

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
    expect(detailsPage.props().pages[1].name).toEqual('Instances');
    expect(detailsPage.props().pages[1].href).toEqual('instances');
  });
});

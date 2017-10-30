/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper, mount, ReactWrapper } from 'enzyme';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';

import { ClusterServiceVersionsDetailsPage, ClusterServiceVersionsDetailsPageProps, ClusterServiceVersionDetails, ClusterServiceVersionDetailsProps, ClusterServiceVersionsPage, ClusterServiceVersionsPageProps, ClusterServiceVersionList, ClusterServiceVersionListProps, ClusterServiceVersionListItem, ClusterServiceVersionListItemProps } from '../../../public/components/cloud-services/clusterserviceversion';
import { ClusterServiceVersionKind, ClusterServiceVersionLogo, ClusterServiceVersionLogoProps, ClusterServiceVersionResourceKind } from '../../../public/components/cloud-services';
import { DetailsPage, ListPage } from '../../../public/components/factory';
import { testClusterServiceVersion, localClusterServiceVersion, testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import { StatusBox, LoadingBox, Timestamp, Overflow, Dropdown } from '../../../public/components/utils';

describe(ClusterServiceVersionLogo.displayName, () => {
  let wrapper: ReactWrapper<ClusterServiceVersionLogoProps>;

  beforeEach(() => {
    const {provider, icon, displayName} = testClusterServiceVersion.spec;
    wrapper = mount(<ClusterServiceVersionLogo icon={icon} displayName={displayName} provider={provider} />);
  });

  it('renders logo image from given base64 encoded image string', () => {
    const image: ReactWrapper<React.ImgHTMLAttributes<any>> = wrapper.find('img');

    expect(image.exists()).toBe(true);
    expect(image.props().height).toEqual('40');
    expect(image.props().width).toEqual('40');
    expect(image.props().src).toEqual(`data:${testClusterServiceVersion.spec.icon.mediatype};base64,${testClusterServiceVersion.spec.icon.base64data}`);
  });

  it('renders fallback image if given icon is invalid', () => {
    wrapper.setProps({icon: null});
    const fallbackImg = wrapper.find('.ci-appcube');

    expect(wrapper.find('img').exists()).toBe(false);
    expect(fallbackImg.exists()).toBe(true);
  });

  it('renders ClusterServiceVersion name and provider from given spec', () => {
    expect(wrapper.text()).toContain(testClusterServiceVersion.spec.displayName);
    expect(wrapper.text()).toContain(`by ${testClusterServiceVersion.spec.provider.name}`);
  });
});

describe(ClusterServiceVersionListItem.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionListItemProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionListItem appType={_.cloneDeep(testClusterServiceVersion)} namespaces={[testClusterServiceVersion.metadata.namespace]} />);
  });

  it('renders ClusterServiceVersion logo', () => {
    const heading = wrapper.find('.co-clusterserviceversion-list-item__heading');
    const logo = heading.childAt(0).find(ClusterServiceVersionLogo);

    expect(logo.exists());
    expect(logo.props().icon).toEqual(testClusterServiceVersion.spec.icon[0]);
    expect(logo.props().displayName).toEqual(testClusterServiceVersion.spec.displayName);
    expect(logo.props().provider).toEqual(testClusterServiceVersion.spec.provider);
  });

  it('renders button to view details for given application', () => {
    const detailsButton = wrapper.find('.co-clusterserviceversion-list-item__actions').find(Link).at(0);

    expect(detailsButton.props().title).toEqual('View details');
    expect(detailsButton.childAt(0).text()).toEqual('View details');
    expect(detailsButton.props().to).toEqual(`/ns/${testClusterServiceVersion.metadata.namespace}/clusterserviceversion-v1s/${testClusterServiceVersion.metadata.name}`);
    expect(detailsButton.hasClass('btn')).toBe(true);
  });

  it('renders dropdown of installed namespaces if given', () => {
    const namespaces = ['default', 'my-testapp-ns', 'other-ns'];
    wrapper.setProps({namespaces});

    const dropdown = wrapper.find('.co-clusterserviceversion-list-item__actions').find(Dropdown);
    const detailsButton = wrapper.find('.co-clusterserviceversion-list-item__actions').find(Link);

    expect(dropdown.exists()).toBe(true);
    expect(dropdown.props().title).toEqual('View namespace');
    expect(dropdown.props().items).toEqual(namespaces.reduce((acc, ns) => ({...acc, [ns]: ns}), {}));
    expect(detailsButton.exists()).toBe(false);
  });

  it('renders link to application resources', () => {
    const link = wrapper.find('.co-clusterserviceversion-list-item__actions').find(Link).at(1);

    expect(link.props().title).toEqual('View resources');
    expect(link.childAt(0).text()).toEqual('View resources');
    expect(link.props().to).toEqual(`/ns/${testClusterServiceVersion.metadata.namespace}/clusterserviceversion-v1s/${testClusterServiceVersion.metadata.name}/resources`);
  });
});

describe(ClusterServiceVersionList.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionListProps>;
  let apps: ClusterServiceVersionKind[];

  beforeEach(() => {
    let otherClusterServiceVersion = _.cloneDeep(testClusterServiceVersion);
    otherClusterServiceVersion.metadata.name = 'vault';
    apps = [_.cloneDeep(testClusterServiceVersion), localClusterServiceVersion, otherClusterServiceVersion];
    wrapper = shallow(<ClusterServiceVersionList.WrappedComponent loaded={true} data={apps} filters={{}} appCRDs={[]} appCRs={new Map()} />);
  });

  it('renders section for applications installed from Open Cloud Services', () => {
    const sections = wrapper.find('.co-clusterserviceversion-list__section--catalog');

    expect(sections.length).toEqual(1);
    expect(sections.at(0).find('.co-section-title').text()).toContain('Open Cloud Services');
    expect(sections.at(0).find(ClusterServiceVersionListItem).length).toEqual(apps.length);

    sections.at(0).find(ClusterServiceVersionListItem).forEach((listItem) => {
      expect(apps).toContain(listItem.props().appType);
      expect(listItem.props().namespaces).toEqual(apps.filter(app => app.metadata.name === listItem.props().appType.metadata.name).map(app => app.metadata.namespace));
    });
  });

  it('renders empty state if `props.data` is empty', () => {
    wrapper = wrapper.setProps({data: []});
    const statusBox = wrapper.find(StatusBox);

    expect(wrapper.find('.co-clusterserviceversion-list').exists()).toBe(false);
    expect(statusBox.exists()).toBe(true);
    expect(statusBox.props().label).toEqual('Applications');
    expect(statusBox.props().loaded).toEqual(true);
    expect(statusBox.render().text()).toContain('No Applications Found');
  });

  it('renders loading status if `props.loaded` is false', () => {
    wrapper = wrapper.setProps({loaded: false});
    const statusBox = wrapper.find(StatusBox);

    expect(wrapper.find('.co-clusterserviceversion-list').exists()).toBe(false);
    expect(statusBox.exists()).toBe(true);
    expect(statusBox.props().label).toEqual('Applications');
    expect(statusBox.props().loaded).toBe(false);
    expect(statusBox.find(LoadingBox).exists()).toBe(false);
  });

  it('filters visible ClusterServiceVersions by `name`', () => {
    const searchFilter = apps[0].spec.displayName.slice(0, 2);
    wrapper = wrapper.setProps({filters: {name: searchFilter}});
    const list = wrapper.find('.co-clusterserviceversion-list__section--catalog__items');

    expect(list.children().length).toEqual(apps.filter(app => app.spec.displayName.toLowerCase().includes(searchFilter.toLowerCase())).length);
  });

  it('filters visible ClusterServiceVersions by `running status`', () => {
    const appCRs = new Map<string, ClusterServiceVersionResourceKind[]>();
    appCRs.set('prometheuses.monitoring.coreos.com', [testResourceInstance]);
    apps[0].spec.customresourcedefinitions.owned = [...appCRs.keys()].map(name => Object.assign({}, {name}));

    wrapper.setProps({data: apps, appCRs, filters: {'clusterserviceversion-status': 'running'}});
    const items = wrapper.find(ClusterServiceVersionListItem);

    expect(items.length).toEqual(1);
  });

  xit('filters visible ClusterServiceVersions by `catalog source`', () => {
    // TODO(alecmerdler)
  });

  it('does not render duplicate ClusterServiceVersions', () => {
    apps[0].metadata.name = apps[1].metadata.name;
    wrapper.setProps({data: apps});
    const list = wrapper.find('.co-clusterserviceversion-list__section--catalog__items').find(ClusterServiceVersionListItem);

    list.forEach((listItem) => {
      expect(listItem.props().appType).not.toEqual(apps[1]);
    });
  });
});

describe(ClusterServiceVersionsPage.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionsPageProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionsPage kind="ClusterServiceVersion-v1" />);
  });

  it('renders a list page with correct props', () => {
    const listPage = wrapper.find<any>(ListPage);

    expect(listPage.exists()).toBe(true);
    expect(listPage.props().ListComponent).toEqual(ClusterServiceVersionList);
    expect(listPage.props().kind).toEqual('ClusterServiceVersion-v1');
    expect(listPage.props().filterLabel).toEqual('Applications by name');
    expect(listPage.props().title).toEqual('Installed Applications');
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
  });

  it('renders a create dropdown button if more than one `owned` app resource', () => {
    let obj = _.cloneDeep(testClusterServiceVersion);
    obj.spec.customresourcedefinitions.owned.push({name: 'foobars.testapp.coreos.com', displayName: 'Foo Bars'});
    wrapper.setProps({obj});
    const createButton: ShallowWrapper<any> = wrapper.find('.btn-primary');

    expect(createButton.type()).toEqual(Dropdown);
    expect(createButton.props().title).toEqual('Create New');
    expect(createButton.props().noButton).toEqual(true);
    expect(createButton.props().items).toEqual({'testresource.testapp.coreos.com': 'Test Resource', 'foobars.testapp.coreos.com': 'Foo Bars'});
    expect(createButton.props().onChange).toBeDefined();
  });

  it('renders description section for ClusterServiceVersion', () => {
    const section = wrapper.find('.co-clusterserviceversion-details__section--description');

    expect(section.find('h1').text()).toEqual('Description');
    expect(section.text()).toContain(testClusterServiceVersion.spec.description);
  });

  it('renders creation date from ClusterServiceVersion', () => {
    expect(wrapper.find(Timestamp).props().timestamp).toEqual(testClusterServiceVersion.metadata.creationTimestamp);
  });

  it('renders list of maintainers from ClusterServiceVersion', () => {
    const maintainers = wrapper.findWhere(node => node.equals(<dt>Maintainers</dt>)).parent().find('dd');

    expect(maintainers.length).toEqual(testClusterServiceVersion.spec.maintainers.length);

    testClusterServiceVersion.spec.maintainers.forEach((maintainer, i) => {
      expect(maintainers.at(i).text()).toContain(maintainer.name);
      expect(maintainers.at(i).find(Overflow).props().value).toEqual(maintainer.email);
      expect(maintainers.at(i).find('a').props().href).toEqual(`mailto:${maintainer.email}`);
    });
  });

  it('renders important links from ClusterServiceVersion', () => {
    const links = wrapper.findWhere(node => node.equals(<dt>Links</dt>)).parent().find('dd');

    expect(links.length).toEqual(testClusterServiceVersion.spec.links.length);
  });

  it('renders empty state for unfulfilled outputs and metadata', () => {
    let emptyClusterServiceVersion: ClusterServiceVersionKind = _.cloneDeep(testClusterServiceVersion);
    emptyClusterServiceVersion.spec.description = '';
    emptyClusterServiceVersion.spec.provider = undefined;
    emptyClusterServiceVersion.spec.links = [];
    emptyClusterServiceVersion.spec.maintainers = [];
    wrapper.setProps({obj: emptyClusterServiceVersion});

    const description = wrapper.find('.co-clusterserviceversion-details__section--description');
    const provider = wrapper.findWhere(node => node.equals(<dt>Provider</dt>)).parent().find('dd').at(0);
    const links = wrapper.findWhere(node => node.equals(<dt>Links</dt>)).parent().find('dd');
    const maintainers = wrapper.findWhere(node => node.equals(<dt>Maintainers</dt>)).parent().find('dd');

    expect(description.text()).toContain('Not available');
    expect(provider.text()).toEqual('Not available');
    expect(links.text()).toEqual('Not available');
    expect(maintainers.text()).toEqual('Not available');
  });
});

describe(ClusterServiceVersionsDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionsDetailsPageProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionsDetailsPage kind={testClusterServiceVersion.kind} name={testClusterServiceVersion.metadata.name} namespace="default" match={null} />);
  });

  it('renders a `DetailsPage` with the correct subpages', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.exists()).toBe(true);
    expect(detailsPage.props().pages[0].name).toEqual('Overview');
    expect(detailsPage.props().pages[0].href).toEqual('');
    expect(detailsPage.props().pages[0].component).toEqual(ClusterServiceVersionDetails);
    expect(detailsPage.props().pages[1].name).toEqual('YAML');
    expect(detailsPage.props().pages[1].href).toEqual('yaml');
    expect(detailsPage.props().pages[2].name).toEqual('Resources');
    expect(detailsPage.props().pages[2].href).toEqual('resources');
  });
});

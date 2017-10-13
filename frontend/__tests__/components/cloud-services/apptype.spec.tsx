/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper, mount, ReactWrapper } from 'enzyme';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';

import { AppTypesDetailsPage, AppTypesDetailsPageProps, AppTypeDetails, AppTypeDetailsProps, AppTypesPage, AppTypesPageProps, AppTypeList, AppTypeListProps, AppTypeListItem, AppTypeListItemProps, } from '../../../public/components/cloud-services/apptype';
import { AppTypeKind, AppTypeLogo, AppTypeLogoProps } from '../../../public/components/cloud-services';
import { DetailsPage, ListPage } from '../../../public/components/factory';
import { testAppType, localAppType } from '../../../__mocks__/k8sResourcesMocks';
import { StatusBox, LoadingBox, Timestamp, Overflow, Dropdown } from '../../../public/components/utils';

describe('AppTypeLogo', () => {
  let wrapper: ReactWrapper<AppTypeLogoProps>;

  beforeEach(() => {
    const {provider, icon, displayName} = testAppType.spec;
    wrapper = mount(<AppTypeLogo icon={icon} displayName={displayName} provider={provider} />);
  });

  it('renders logo image from given base64 encoded image string', () => {
    const image: ReactWrapper<React.ImgHTMLAttributes<any>> = wrapper.find('img');

    expect(image.exists()).toBe(true);
    expect(image.props().height).toEqual('40');
    expect(image.props().width).toEqual('40');
    expect(image.props().src).toEqual(`data:${testAppType.spec.icon.mediatype};base64,${testAppType.spec.icon.base64data}`);
  });

  it('renders fallback image if given icon is invalid', () => {
    wrapper.setProps({icon: null});
    const fallbackImg = wrapper.find('.ci-appcube');

    expect(wrapper.find('img').exists()).toBe(false);
    expect(fallbackImg.exists()).toBe(true);
  });

  it('renders AppType name and provider from given spec', () => {
    expect(wrapper.text()).toContain(testAppType.spec.displayName);
    expect(wrapper.text()).toContain(`by ${testAppType.spec.provider.name}`);
  });
});

describe('AppTypeListItem', () => {
  let wrapper: ShallowWrapper<AppTypeListItemProps>;

  beforeEach(() => {
    wrapper = shallow(<AppTypeListItem appType={testAppType} namespaces={[testAppType.metadata.namespace]} />);
  });

  it('renders AppType logo', () => {
    const heading = wrapper.find('.co-apptype-list-item__heading');
    const logo = heading.childAt(0).find(AppTypeLogo);

    expect(logo.exists());
    expect(logo.props().icon).toEqual(testAppType.spec.icon[0]);
    expect(logo.props().displayName).toEqual(testAppType.spec.displayName);
    expect(logo.props().provider).toEqual(testAppType.spec.provider);
  });

  it('renders button to view details for given application', () => {
    const detailsButton = wrapper.find('.co-apptype-list-item__actions').find(Link).at(0);

    expect(detailsButton.props().title).toEqual('View details');
    expect(detailsButton.childAt(0).text()).toEqual('View details');
    expect(detailsButton.props().to).toEqual(`/ns/${testAppType.metadata.namespace}/clusterserviceversion-v1s/${testAppType.metadata.name}/details`);
    expect(detailsButton.hasClass('btn')).toBe(true);
  });

  it('renders dropdown of installed namespaces if given', () => {
    const namespaces = ['default', 'my-testapp-ns', 'other-ns'];
    wrapper.setProps({namespaces});

    const dropdown = wrapper.find('.co-apptype-list-item__actions').find(Dropdown);
    const detailsButton = wrapper.find('.co-apptype-list-item__actions').find(Link);

    expect(dropdown.exists()).toBe(true);
    expect(dropdown.props().title).toEqual('View namespace');
    expect(dropdown.props().items).toEqual(namespaces.reduce((acc, ns) => ({...acc, [ns]: ns}), {}));
    expect(detailsButton.exists()).toBe(false);
  });

  it('renders link to application resources', () => {
    const link = wrapper.find('.co-apptype-list-item__actions').find(Link).at(1);

    expect(link.props().title).toEqual('View resources');
    expect(link.childAt(0).text()).toEqual('View resources');
    expect(link.props().to).toEqual(`/ns/${testAppType.metadata.namespace}/clusterserviceversion-v1s/${testAppType.metadata.name}/resources`);
  });
});

describe('AppTypeList', () => {
  let wrapper: ShallowWrapper<AppTypeListProps>;
  let apps: AppTypeKind[];

  beforeEach(() => {
    let otherAppType = _.cloneDeep(testAppType);
    otherAppType.metadata.name = 'vault';
    apps = [testAppType, localAppType, otherAppType];
    wrapper = shallow(<AppTypeList loaded={true} data={apps} filters={{}} />);
  });

  it('renders section for applications installed from Open Cloud Services', () => {
    const sections = wrapper.find('.co-apptype-list__section--catalog');

    expect(sections.length).toEqual(1);
    expect(sections.at(0).find('.co-section-title').text()).toContain('Open Cloud Services');
    expect(sections.at(0).find(AppTypeListItem).length).toEqual(apps.length);

    sections.at(0).find(AppTypeListItem).forEach((listItem) => {
      expect(apps).toContain(listItem.props().appType);
      expect(listItem.props().namespaces).toEqual(apps.filter(app => app.metadata.name === listItem.props().appType.metadata.name).map(app => app.metadata.namespace));
    });
  });

  it('renders empty state if `props.data` is empty', () => {
    wrapper = wrapper.setProps({data: []});
    const statusBox = wrapper.find(StatusBox);

    expect(wrapper.find('.co-apptype-list').exists()).toBe(false);
    expect(statusBox.exists()).toBe(true);
    expect(statusBox.props().label).toEqual('Applications');
    expect(statusBox.props().loaded).toEqual(wrapper.props().loaded);
    expect(statusBox.render().text()).toEqual('No Applications Found');
  });

  it('renders loading status if `props.loaded` is false', () => {
    wrapper = wrapper.setProps({loaded: false});
    const statusBox = wrapper.find(StatusBox);

    expect(wrapper.find('.co-apptype-list').exists()).toBe(false);
    expect(statusBox.exists()).toBe(true);
    expect(statusBox.props().label).toEqual('Applications');
    expect(statusBox.props().loaded).toBe(false);
    expect(statusBox.find(LoadingBox).exists()).toBe(false);
  });

  it('filters visible AppTypes by `spec.displayName`', () => {
    const searchFilter = apps[0].spec.displayName.slice(0, 2);
    wrapper = wrapper.setProps({filters: {name: searchFilter}});
    const list: ShallowWrapper = wrapper.find('.co-apptype-list__section--catalog__items');

    expect(list.children().length).toEqual(apps.filter(app => app.spec.displayName.toLowerCase().includes(searchFilter.toLowerCase())).length);
  });

  it('does not render duplicate AppTypes', () => {
    apps[0].metadata.name = apps[1].metadata.name;
    wrapper.setProps({data: apps});
    const list = wrapper.find('.co-apptype-list__section--catalog__items').find(AppTypeListItem);

    list.forEach((listItem) => {
      expect(listItem.props().appType).not.toEqual(apps[1]);
    });
  });
});

describe('AppTypesPage', () => {
  let wrapper: ShallowWrapper<AppTypesPageProps>;

  beforeEach(() => {
    wrapper = shallow(<AppTypesPage kind="AppType-v1" />);
  });

  it('renders a list page with correct props', () => {
    const listPage = wrapper.find<any>(ListPage);

    expect(listPage.exists()).toBe(true);
    expect(listPage.props().ListComponent).toEqual(AppTypeList);
    expect(listPage.props().kind).toEqual('AppType-v1');
    expect(listPage.props().filterLabel).toEqual('Applications by name');
    expect(listPage.props().title).toEqual('Installed Applications');
  });
});

describe('AppTypeDetails', () => {
  let wrapper: ShallowWrapper<AppTypeDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(<AppTypeDetails obj={testAppType} />);
  });

  it('renders info section for AppType', () => {
    const section = wrapper.find('.co-apptype-details__section--info');

    expect(section.exists()).toBe(true);
  });

  it('renders description section for AppType', () => {
    const section = wrapper.find('.co-apptype-details__section--description');

    expect(section.find('h1').text()).toEqual('Description');
    expect(section.text()).toContain(testAppType.spec.description);
  });

  it('renders creation date from AppType', () => {
    expect(wrapper.find(Timestamp).props().timestamp).toEqual(testAppType.metadata.creationTimestamp);
  });

  it('renders list of maintainers from AppType', () => {
    const maintainers = wrapper.findWhere(node => node.equals(<dt>Maintainers</dt>)).parent().find('dd');

    expect(maintainers.length).toEqual(testAppType.spec.maintainers.length);

    testAppType.spec.maintainers.forEach((maintainer, i) => {
      expect(maintainers.at(i).text()).toContain(maintainer.name);
      expect(maintainers.at(i).find(Overflow).props().value).toEqual(maintainer.email);
      expect(maintainers.at(i).find('a').props().href).toEqual(`mailto:${maintainer.email}`);
    });
  });

  it('renders important links from AppType', () => {
    const links = wrapper.findWhere(node => node.equals(<dt>Links</dt>)).parent().find('dd');

    expect(links.length).toEqual(testAppType.spec.links.length);
  });

  it('renders empty state for unfulfilled outputs and metadata', () => {
    let emptyAppType: AppTypeKind = _.cloneDeep(testAppType);
    emptyAppType.spec.description = '';
    emptyAppType.spec.provider = undefined;
    emptyAppType.spec.links = [];
    emptyAppType.spec.maintainers = [];
    wrapper.setProps({obj: emptyAppType});

    const description = wrapper.find('.co-apptype-details__section--description');
    const provider = wrapper.findWhere(node => node.equals(<dt>Provider</dt>)).parent().find('dd').at(0);
    const links = wrapper.findWhere(node => node.equals(<dt>Links</dt>)).parent().find('dd');
    const maintainers = wrapper.findWhere(node => node.equals(<dt>Maintainers</dt>)).parent().find('dd');

    expect(description.text()).toContain('Not available');
    expect(provider.text()).toEqual('Not available');
    expect(links.text()).toEqual('Not available');
    expect(maintainers.text()).toEqual('Not available');
  });
});

describe('AppTypesDetailsPage', () => {
  let wrapper: ShallowWrapper<AppTypesDetailsPageProps>;

  beforeEach(() => {
    wrapper = shallow(<AppTypesDetailsPage kind={testAppType.kind} name={testAppType.metadata.name} namespace="default" />);
  });

  it('renders a `DetailsPage` with the correct subpages', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.exists()).toBe(true);
    expect(detailsPage.props().pages[0].name).toEqual('Overview');
    expect(detailsPage.props().pages[0].href).toEqual('details');
    expect(detailsPage.props().pages[0].component).toEqual(AppTypeDetails);
    expect(detailsPage.props().pages[1].name).toEqual('YAML');
    expect(detailsPage.props().pages[1].href).toEqual('yaml');
    expect(detailsPage.props().pages[2].name).toEqual('Resources');
    expect(detailsPage.props().pages[2].href).toEqual('resources');
  });
});

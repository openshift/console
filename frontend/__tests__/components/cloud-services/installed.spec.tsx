/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper, ReactWrapper, mount } from 'enzyme';
import * as _ from 'lodash';

import { AppTypesPage, AppTypesPageProps, AppTypeList, AppTypeListProps, AppTypeListItem, AppTypeListItemProps, AppTypeLogo, AppTypeLogoProps, AppTypeKind } from '../../../public/components/cloud-services/installed';
import { ListPage } from '../../../public/components/factory';
import { StatusBox, LoadingBox } from '../../../public/components/utils';

// FIXME(alecmerdler): Update to match current schema
const testAppType: AppTypeKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'AppType',
  metadata: {
    name: 'testapp',
    uid: 'c02c0a8f-88e0-11e7-851b-080027b424ef',
    namespace: 'default',
  },
  spec: {
    displayName: 'Test App',
    description: 'This app does cool stuff',
    provider: {
      name: 'MyCompany, Inc',
    },
    links: {

    },
    icon: [
      {base64data: '', mediatype: 'image/png',} 
    ],
  },
};

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

  it('renders AppType name and provider from given spec', () => {
    expect(wrapper.text()).toContain(testAppType.spec.displayName);
    expect(wrapper.text()).toContain(`by ${testAppType.spec.provider.name}`);
  });
});

describe('AppTypeListItem', () => {
  let wrapper: ShallowWrapper<AppTypeListItemProps>;

  beforeEach(() => {
    wrapper = shallow(<AppTypeListItem key={1} appType={testAppType} />, {lifecycleExperimental: true});
  });

  it('renders AppType logo', () => {
    const heading = wrapper.find('.co-apptype-list-item__heading');

    expect(heading.childAt(0).find(AppTypeLogo).exists());
    expect(heading.childAt(0).find(AppTypeLogo).props().icon).toEqual(testAppType.spec.icon[0]);
    expect(heading.childAt(0).find(AppTypeLogo).props().displayName).toEqual(testAppType.spec.displayName);
    expect(heading.childAt(0).find(AppTypeLogo).props().provider).toEqual(testAppType.spec.provider);
  });
});

describe('AppTypeList', () => {
  let wrapper: ShallowWrapper<AppTypeListProps>;
  let apps: AppTypeKind[];

  beforeEach(() => {
    let otherAppType = _.cloneDeep(testAppType);
    otherAppType.spec.displayName = 'Etcd';
    apps = [testAppType, otherAppType];
    wrapper = shallow(<AppTypeList loaded={true} data={apps} filters={{}} />);
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

  it('renders a list of given AppType resources', () => {
    const list: ShallowWrapper = wrapper.find('.co-apptype-list');

    expect(list.exists()).toBe(true);

    apps.forEach((appType, i) => {
      const listItem = list.childAt(i);

      expect(listItem.type()).toEqual(AppTypeListItem);
      expect(listItem.props().appType).toEqual(appType);
    });
  });

  it('filters visible AppTypes by `spec.displayName`', () => {
    wrapper = shallow(<AppTypeList data={apps} filters={{}} loaded={true} />);
    wrapper = wrapper.setProps({filters: {name: 'etcd'}});
    const list: ShallowWrapper = wrapper.find('.co-apptype-list');

    expect(list.exists()).toBe(true);
    expect(list.children().length).toEqual(1);
    
    wrapper.find('.co-apptype-list').children().forEach((listItem) => {
      expect(listItem.props().appType).not.toEqual(testAppType);
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

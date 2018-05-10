/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';

import { SubscriptionHeader, SubscriptionHeaderProps, SubscriptionRow, SubscriptionRowProps, SubscriptionsList, SubscriptionsListProps, SubscriptionsPage, SubscriptionsPageProps } from '../../../public/components/cloud-services/subscription';
import { SubscriptionKind, SubscriptionState, ClusterServiceVersionLogo } from '../../../public/components/cloud-services';
import { referenceForModel } from '../../../public/module/k8s';
import { SubscriptionModel, ClusterServiceVersionModel } from '../../../public/models';
import { ListHeader, ColHead, List, MultiListPage } from '../../../public/components/factory';
import { ResourceCog, ResourceLink } from '../../../public/components/utils';
import { testSubscription, testClusterServiceVersion } from '../../../__mocks__/k8sResourcesMocks';

describe(SubscriptionHeader.displayName, () => {
  let wrapper: ShallowWrapper<SubscriptionHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<SubscriptionHeader />);
  });

  it('renders column header for package name', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(0).props().sortField).toEqual('spec.name');
    expect(wrapper.find(ListHeader).find(ColHead).at(0).childAt(0).text()).toEqual('Package');
  });

  it('renders column header for namespace name', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(1).props().sortField).toEqual('metadata.namespace');
    expect(wrapper.find(ListHeader).find(ColHead).at(1).childAt(0).text()).toEqual('Namespace');
  });

  it('renders column header for status', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(2).childAt(0).text()).toEqual('Status');
  });

  it('renders column header for channel', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(3).childAt(0).text()).toEqual('Channel');
  });

  it('renders column header for approval strategy', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(4).childAt(0).text()).toEqual('Approval Strategy');
  });
});

describe(SubscriptionRow.displayName, () => {
  let wrapper: ShallowWrapper<SubscriptionRowProps>;
  let subscription: SubscriptionKind;

  beforeEach(() => {
    subscription = {..._.cloneDeep(testSubscription), status: {installedCSV: 'testapp.v1.0.0'}};
    wrapper = shallow(<SubscriptionRow obj={subscription} csv={_.cloneDeep(testClusterServiceVersion)} />);
  });

  it('renders column for package name with actions cog', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceCog).props().actions[0]().label).toEqual('Remove Subscription...');
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceCog).props().kind).toEqual(referenceForModel(SubscriptionModel));
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceCog).props().resource).toEqual(subscription);

    expect(wrapper.find('.co-resource-list__item').childAt(0).find(Link).props().to).toEqual(`/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp`);

    expect(wrapper.find('.co-resource-list__item').childAt(0).find(Link).find(ClusterServiceVersionLogo).props().icon).toEqual(testClusterServiceVersion.spec.icon[0]);
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(Link).find(ClusterServiceVersionLogo).props().provider).toEqual(testClusterServiceVersion.spec.provider);
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(Link).find(ClusterServiceVersionLogo).props().displayName).toEqual(testClusterServiceVersion.spec.displayName);
  });

  it('renders column for namespace name', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(1).find(ResourceLink).props().name).toEqual(subscription.metadata.namespace);
    expect(wrapper.find('.co-resource-list__item').childAt(1).find(ResourceLink).props().title).toEqual(subscription.metadata.namespace);
    expect(wrapper.find('.co-resource-list__item').childAt(1).find(ResourceLink).props().displayName).toEqual(subscription.metadata.namespace);
    expect(wrapper.find('.co-resource-list__item').childAt(1).find(ResourceLink).props().kind).toEqual('Namespace');
  });

  it('renders column for subscription state when update available', () => {
    subscription.status.state = SubscriptionState.SubscriptionStateUpgradeAvailable;
    wrapper = wrapper.setProps({obj: subscription});

    expect(wrapper.find('.co-resource-list__item').childAt(2).text()).toContain('Upgrade available');
  });

  it('renders column for subscription state when unknown state', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(2).text()).toEqual('Unknown');
  });

  it('renders column for subscription state when update in progress', () => {
    subscription.status.state = SubscriptionState.SubscriptionStateUpgradePending;
    wrapper = wrapper.setProps({obj: subscription});

    expect(wrapper.find('.co-resource-list__item').childAt(2).text()).toContain('Upgrading');
  });

  it('renders column for subscription state when no updates available', () => {
    subscription.status.state = SubscriptionState.SubscriptionStateAtLatest;
    wrapper = wrapper.setProps({obj: subscription});

    expect(wrapper.find('.co-resource-list__item').childAt(2).text()).toContain('Up to date');
  });

  it('renders column for current subscription channel', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(3).text()).toEqual(subscription.spec.channel);
  });

  it('renders column for approval strategy', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(4).text()).toEqual('Automatic');
  });
});

describe(SubscriptionsList.displayName, () => {
  let wrapper: ShallowWrapper<SubscriptionsListProps>;

  beforeEach(() => {
    wrapper = shallow(<SubscriptionsList data={[]} loaded={true} {...{[referenceForModel(ClusterServiceVersionModel)]: {data: []}}} />);
  });

  it('renders a `List` component with correct props', () => {
    const Row = wrapper.find<any>(List).props().Row;

    expect(shallow(<Row />).find(SubscriptionRow).exists()).toBe(true);
    expect(wrapper.find<any>(List).props().Header).toEqual(SubscriptionHeader);
    expect(wrapper.find<any>(List).props().label).toEqual('Subscriptions');
  });
});

describe(SubscriptionsPage.displayName, () => {
  let wrapper: ShallowWrapper<SubscriptionsPageProps>;

  beforeEach(() => {
    const match = {params: {ns: 'default'}, isExact: true, path: '', url: ''};
    wrapper = shallow(<SubscriptionsPage packageName="testapp" match={match} />);
  });

  it('renders a `MultiListPage` component with the correct props', () => {
    expect(wrapper.find(MultiListPage).props().ListComponent).toEqual(SubscriptionsList);
    expect(wrapper.find(MultiListPage).props().title).toEqual('Subscriptions');
    expect(wrapper.find(MultiListPage).props().showTitle).toBe(true);
    expect(wrapper.find(MultiListPage).props().canCreate).toBe(true);
    expect(wrapper.find(MultiListPage).props().createProps).toEqual({to: '/k8s/ns/default/catalogsource-v1s'});
    expect(wrapper.find(MultiListPage).props().createButtonText).toEqual('New Subscription');
    expect(wrapper.find(MultiListPage).props().filterLabel).toEqual('Subscriptions by package');
    expect(wrapper.find(MultiListPage).props().resources).toEqual([
      {kind: referenceForModel(SubscriptionModel), isList: true, namespaced: true},
      {kind: referenceForModel(ClusterServiceVersionModel), isList: true, namespaced: true},
    ]);
  });

  xit('passes `flatten` function to `MultiListPage` that filters out subscriptions that do not match `props.packageName`', () => {
    // TODO(alecmerdler)
  });
});

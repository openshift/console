/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';

import { SubscriptionHeader, SubscriptionHeaderProps, SubscriptionRow, SubscriptionRowProps, SubscriptionsList, SubscriptionsListProps, SubscriptionsPage, SubscriptionsPageProps, SubscriptionDetails, SubscriptionDetailsPage, SubscriptionDetailsProps, SubscriptionUpdates, SubscriptionUpdatesProps, SubscriptionUpdatesState } from '../../../public/components/cloud-services/subscription';
import { SubscriptionKind, SubscriptionState, olmNamespace } from '../../../public/components/cloud-services';
import { referenceForModel } from '../../../public/module/k8s';
import { SubscriptionModel, ClusterServiceVersionModel, ConfigMapModel } from '../../../public/models';
import { ListHeader, ColHead, List, ListPage, DetailsPage } from '../../../public/components/factory';
import { ResourceCog, ResourceLink, Cog } from '../../../public/components/utils';
import { testSubscription, testClusterServiceVersion, testPackage } from '../../../__mocks__/k8sResourcesMocks';

describe(SubscriptionHeader.displayName, () => {
  let wrapper: ShallowWrapper<SubscriptionHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<SubscriptionHeader />);
  });

  it('renders column header for subscription name', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(0).props().sortField).toEqual('metadata.name');
    expect(wrapper.find(ListHeader).find(ColHead).at(0).childAt(0).text()).toEqual('Name');
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
    wrapper = shallow(<SubscriptionRow obj={subscription} />);
  });

  it('renders column for subscription name', () => {
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceLink).props().name).toEqual(subscription.metadata.name);
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceLink).props().title).toEqual(subscription.metadata.name);
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceLink).props().namespace).toEqual(subscription.metadata.namespace);
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceLink).props().kind).toEqual(referenceForModel(SubscriptionModel));
  });

  it('renders actions cog', () => {
    const menuArgs = [ClusterServiceVersionModel, subscription];
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceCog).props().kind).toEqual(referenceForModel(SubscriptionModel));
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceCog).props().resource).toEqual(subscription);
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceCog).props().actions[0]).toEqual(Cog.factory.Edit);
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceCog).props().actions[1]().label).toEqual('Remove Subscription...');
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceCog).props().actions[1]().callback).toBeDefined();
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceCog).props().actions[2](...menuArgs).label).toEqual(`View ${ClusterServiceVersionModel.kind}...`);
    expect(wrapper.find('.co-resource-list__item').childAt(0).find(ResourceCog).props().actions[2](...menuArgs).href).toEqual(`/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp.v1.0.0`);
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
    expect(wrapper.find<any>(List).props().Header).toEqual(SubscriptionHeader);
    expect(wrapper.find<any>(List).props().Row).toEqual(SubscriptionRow);
  });
});

describe(SubscriptionsPage.displayName, () => {
  let wrapper: ShallowWrapper<SubscriptionsPageProps>;

  beforeEach(() => {
    const match = {params: {ns: 'default'}, isExact: true, path: '', url: ''};
    wrapper = shallow(<SubscriptionsPage match={match} namespace="default" />);
  });

  it('renders a `ListPage` component with the correct props', () => {
    expect(wrapper.find(ListPage).props().ListComponent).toEqual(SubscriptionsList);
    expect(wrapper.find(ListPage).props().title).toEqual('Subscriptions');
    expect(wrapper.find(ListPage).props().showTitle).toBe(true);
    expect(wrapper.find(ListPage).props().canCreate).toBe(true);
    expect(wrapper.find(ListPage).props().createProps).toEqual({to: '/k8s/ns/default/catalogsources'});
    expect(wrapper.find(ListPage).props().createButtonText).toEqual('Create Subscription');
    expect(wrapper.find(ListPage).props().filterLabel).toEqual('Subscriptions by package');
    expect(wrapper.find(ListPage).props().kind).toEqual(referenceForModel(SubscriptionModel));
  });
});

describe(SubscriptionUpdates.name, () => {
  let wrapper: ShallowWrapper<SubscriptionUpdatesProps, SubscriptionUpdatesState>;

  beforeEach(() => {
    wrapper = shallow(<SubscriptionUpdates obj={testSubscription} pkg={testPackage} />);
  });

  it('renders link to configure update channel', () => {
    const channel = wrapper.findWhere(node => node.equals(<dt className="co-detail-table__section-header">Channel</dt>)).parents().at(0).find('dd').text();

    expect(channel).toEqual(testSubscription.spec.channel);
  });

  it('renders link to set approval strategy', () => {
    const strategy = wrapper.findWhere(node => node.equals(<dt className="co-detail-table__section-header">Approval</dt>)).parents().at(0).find('dd').text();

    expect(strategy).toEqual(testSubscription.spec.installPlanApproval || 'Automatic');
  });
});

describe(SubscriptionDetails.displayName, () => {
  let wrapper: ShallowWrapper<SubscriptionDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(<SubscriptionDetails obj={testSubscription} pkg={testPackage} />);
  });

  it('renders subscription update channel and approval component', () => {
    expect(wrapper.find(SubscriptionUpdates).exists()).toBe(true);
  });

  it('renders link to `ClusterServiceVersion` if installed', () => {
    let obj = _.cloneDeep(testSubscription);
    obj.status = {installedCSV: testClusterServiceVersion.metadata.name};
    wrapper = wrapper.setProps({obj, installedCSV: testClusterServiceVersion});

    const link = wrapper.findWhere(node => node.equals(<dt>Installed Version</dt>)).parents().at(0).find('dd').find(ResourceLink).at(0);

    expect(link.props().title).toEqual(obj.status.installedCSV);
    expect(link.props().name).toEqual(obj.status.installedCSV);
  });

  it('renders link to catalog source', () => {
    const link = wrapper.findWhere(node => node.equals(<dt>Catalog</dt>)).parents().at(0).find('dd').find(ResourceLink).at(0);

    expect(link.props().name).toEqual(testSubscription.spec.source);
  });
});

describe(SubscriptionDetailsPage.displayName, () => {

  it('renders `DetailsPage` with correct props', () => {
    const menuArgs = [ClusterServiceVersionModel, testSubscription];
    const match = {params: {ns: 'default', name: 'example-sub'}, url: '', isExact: true, path: ''};
    const wrapper = shallow(<SubscriptionDetailsPage match={match} namespace="default" />);

    expect(wrapper.find(DetailsPage).props().kind).toEqual(referenceForModel(SubscriptionModel));
    expect(wrapper.find(DetailsPage).props().pages.length).toEqual(2);
    expect(wrapper.find(DetailsPage).props().menuActions[0]).toEqual(Cog.factory.Edit);
    expect(wrapper.find(DetailsPage).props().menuActions[1](...menuArgs).label).toEqual('Remove Subscription...');
    expect(wrapper.find(DetailsPage).props().menuActions[2](...menuArgs).label).toEqual(`View ${ClusterServiceVersionModel.kind}...`);
  });

  it('passes additional resources to watch', () => {
    const match = {params: {ns: 'default', name: 'example-sub'}, url: '', isExact: true, path: ''};
    const wrapper = shallow(<SubscriptionDetailsPage match={match} namespace="default" />);

    expect(wrapper.find(DetailsPage).props().resources).toEqual([
      {kind: ConfigMapModel.kind, namespace: olmNamespace, isList: true, prop: 'globalConfigMaps'},
      {kind: ConfigMapModel.kind, namespace: 'default', isList: true, prop: 'localConfigMaps'},
      {kind: referenceForModel(ClusterServiceVersionModel), namespace: 'default', isList: true, prop: 'clusterServiceVersions'},
    ]);
  });
});

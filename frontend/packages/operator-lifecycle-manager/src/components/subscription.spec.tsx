import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import {
  Table,
  MultiListPage,
  DetailsPage,
  RowFunctionArgs,
  TableRow,
} from '@console/internal/components/factory';
import { ResourceKebab, ResourceLink, Kebab } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  testSubscription,
  testSubscriptions,
  testClusterServiceVersion,
  testPackageManifest,
  testCatalogSource,
} from '../../mocks';
import {
  SubscriptionModel,
  ClusterServiceVersionModel,
  PackageManifestModel,
  OperatorGroupModel,
  InstallPlanModel,
  CatalogSourceModel,
} from '../models';
import { SubscriptionKind, SubscriptionState } from '../types';
import {
  SubscriptionTableRow,
  SubscriptionsList,
  SubscriptionsListProps,
  SubscriptionsPage,
  SubscriptionsPageProps,
  SubscriptionDetails,
  SubscriptionDetailsPage,
  SubscriptionDetailsProps,
  SubscriptionUpdates,
  SubscriptionUpdatesProps,
  SubscriptionUpdatesState,
  SubscriptionStatus,
} from './subscription';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('SubscriptionTableRow', () => {
  let wrapper: ShallowWrapper;
  let subscription: SubscriptionKind;

  const updateWrapper = () => {
    const rowArgs: RowFunctionArgs<SubscriptionKind> = {
      obj: subscription,
      index: 0,
      key: '0',
      style: {},
    } as any;

    wrapper = shallow(<SubscriptionTableRow {...rowArgs} />);
    return wrapper;
  };

  beforeEach(() => {
    subscription = {
      ...testSubscription,
      status: { installedCSV: 'testapp.v1.0.0' },
    };
    wrapper = updateWrapper();
  });

  it('renders column for subscription name', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(0)
        .shallow()
        .find(ResourceLink)
        .props().name,
    ).toEqual(subscription.metadata.name);
    expect(
      wrapper
        .find(TableRow)
        .childAt(0)
        .shallow()
        .find(ResourceLink)
        .props().namespace,
    ).toEqual(subscription.metadata.namespace);
    expect(
      wrapper
        .find(TableRow)
        .childAt(0)
        .shallow()
        .find(ResourceLink)
        .props().kind,
    ).toEqual(referenceForModel(SubscriptionModel));
  });

  it('renders actions kebab', () => {
    const menuArgs = [ClusterServiceVersionModel, subscription];
    expect(
      wrapper
        .find(TableRow)
        .find(ResourceKebab)
        .props().kind,
    ).toEqual(referenceForModel(SubscriptionModel));
    expect(
      wrapper
        .find(TableRow)
        .find(ResourceKebab)
        .props().resource,
    ).toEqual(subscription);
    expect(
      wrapper
        .find(TableRow)
        .find(ResourceKebab)
        .props().actions[0],
    ).toEqual(Kebab.factory.Edit);
    expect(
      wrapper
        .find(TableRow)
        .find(ResourceKebab)
        .props()
        .actions[1](...menuArgs).labelKey,
    ).toEqual('olm~Remove Subscription');
    expect(
      wrapper
        .find(TableRow)
        .find(ResourceKebab)
        .props()
        .actions[1](...menuArgs).callback,
    ).toBeDefined();
    expect(
      wrapper
        .find(TableRow)
        .find(ResourceKebab)
        .props()
        .actions[2](...menuArgs).labelKey,
    ).toEqual('olm~View ClusterServiceVersion...');
    expect(
      wrapper
        .find(TableRow)
        .find(ResourceKebab)
        .props()
        .actions[2](...menuArgs).href,
    ).toEqual(`/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp.v1.0.0`);
  });

  it('renders column for namespace name', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(1)
        .shallow()
        .find(ResourceLink)
        .props().name,
    ).toEqual(subscription.metadata.namespace);
    expect(
      wrapper
        .find(TableRow)
        .childAt(1)
        .shallow()
        .find(ResourceLink)
        .props().kind,
    ).toEqual('Namespace');
  });

  it('renders column for subscription state when update available', () => {
    subscription.status.state = SubscriptionState.SubscriptionStateUpgradeAvailable;
    wrapper = updateWrapper();

    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .find(SubscriptionStatus)
        .shallow()
        .text(),
    ).toContain('Upgrade available');
  });

  it('renders column for subscription state when unknown state', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .find(SubscriptionStatus)
        .shallow()
        .text(),
    ).toEqual('olm~Unknown failure');
  });

  it('renders column for subscription state when update in progress', () => {
    subscription.status.state = SubscriptionState.SubscriptionStateUpgradePending;
    wrapper = updateWrapper();

    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .find(SubscriptionStatus)
        .shallow()
        .text(),
    ).toContain('Upgrading');
  });

  it('renders column for subscription state when no updates available', () => {
    subscription.status.state = SubscriptionState.SubscriptionStateAtLatest;
    wrapper = updateWrapper();

    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .find(SubscriptionStatus)
        .shallow()
        .text(),
    ).toContain('Up to date');
  });

  it('renders column for current subscription channel', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(3)
        .shallow()
        .text(),
    ).toEqual(subscription.spec.channel);
  });

  it('renders column for approval strategy', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(4)
        .shallow()
        .text(),
    ).toEqual('olm~Automatic');
  });
});

describe('SubscriptionsList', () => {
  let wrapper: ShallowWrapper<SubscriptionsListProps>;

  beforeEach(() => {
    wrapper = shallow(
      <SubscriptionsList.WrappedComponent
        data={[]}
        loaded
        {...{ [referenceForModel(ClusterServiceVersionModel)]: { data: [] } }}
        operatorGroup={null}
      />,
    );
  });

  it('renders a `Table` component with correct header', () => {
    const headerTitles = wrapper
      .find<any>(Table)
      .props()
      .Header()
      .map((header) => header.title);
    expect(headerTitles).toEqual([
      'olm~Name',
      'olm~Namespace',
      'olm~Status',
      'olm~Update channel',
      'olm~Update approval',
      '',
    ]);
  });
});

describe('SubscriptionsPage', () => {
  let wrapper: ShallowWrapper<SubscriptionsPageProps>;

  beforeEach(() => {
    const match = { params: { ns: 'default' }, isExact: true, path: '', url: '' };
    wrapper = shallow(<SubscriptionsPage match={match} namespace="default" />);
  });

  it('renders a `MultiListPage` component with the correct props', () => {
    expect(wrapper.find(MultiListPage).props().ListComponent).toEqual(SubscriptionsList);
    expect(wrapper.find(MultiListPage).props().title).toEqual('olm~Subscriptions');
    expect(wrapper.find(MultiListPage).props().canCreate).toBe(true);
    expect(wrapper.find(MultiListPage).props().createProps).toEqual({ to: '/operatorhub' });
    expect(wrapper.find(MultiListPage).props().createButtonText).toEqual('olm~Create Subscription');
    expect(wrapper.find(MultiListPage).props().filterLabel).toEqual('olm~Subscriptions by package');
    expect(wrapper.find(MultiListPage).props().resources).toEqual([
      {
        kind: referenceForModel(SubscriptionModel),
        namespace: 'default',
        namespaced: true,
        prop: 'subscription',
      },
      {
        kind: referenceForModel(OperatorGroupModel),
        namespace: 'default',
        namespaced: true,
        prop: 'operatorGroup',
      },
    ]);
  });
});

describe('SubscriptionUpdates', () => {
  let wrapper: ShallowWrapper<SubscriptionUpdatesProps, SubscriptionUpdatesState>;

  beforeEach(() => {
    wrapper = shallow(
      <SubscriptionUpdates
        catalogSource={testCatalogSource}
        obj={testSubscription}
        pkg={testPackageManifest}
        subscriptions={testSubscriptions}
      />,
    );
  });

  it('renders link to configure update channel', () => {
    const channel = wrapper
      .findWhere(
        (node) =>
          node.type() === 'dt' &&
          node.hasClass('co-detail-table__section-header') &&
          node.text().includes('olm~Update channel'),
      )
      .parents()
      .at(0)
      .shallow()
      .find(Button)
      .render()
      .text();

    expect(channel).toEqual(testSubscription.spec.channel);
  });

  it('renders link to set approval strategy', () => {
    const strategy = wrapper
      .findWhere(
        (node) =>
          node.type() === 'dt' &&
          node.hasClass('co-detail-table__section-header') &&
          node.text().includes('olm~Update approval'),
      )
      .parents()
      .at(0)
      .shallow()
      .find(Button)
      .render()
      .text();

    expect(strategy).toEqual(testSubscription.spec.installPlanApproval || 'Automatic');
  });
});

describe('SubscriptionDetails', () => {
  let wrapper: ShallowWrapper<SubscriptionDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(
      <SubscriptionDetails
        obj={testSubscription}
        packageManifests={[testPackageManifest]}
        catalogSources={[testCatalogSource]}
        subscriptions={testSubscriptions}
      />,
    );
  });

  it('renders subscription update channel and approval component', () => {
    expect(wrapper.find(SubscriptionUpdates).exists()).toBe(true);
  });

  it('renders link to `ClusterServiceVersion` if installed', () => {
    const obj = _.cloneDeep(testSubscription);
    obj.status = { installedCSV: testClusterServiceVersion.metadata.name };
    wrapper = wrapper.setProps({ obj, clusterServiceVersions: [testClusterServiceVersion] });

    const link = wrapper
      .findWhere((node) => node.equals(<dt>olm~Installed version</dt>))
      .parents()
      .at(0)
      .find('dd')
      .find(ResourceLink)
      .at(0);

    expect(link.props().title).toEqual(obj.status.installedCSV);
    expect(link.props().name).toEqual(obj.status.installedCSV);
  });

  it('renders link to catalog source', () => {
    const link = wrapper
      .findWhere((node) => node.equals(<dt>olm~CatalogSource</dt>))
      .parents()
      .at(0)
      .find('dd')
      .find(ResourceLink)
      .at(0);

    expect(link.props().name).toEqual(testSubscription.spec.source);
  });
});

describe('SubscriptionDetailsPage', () => {
  it('renders `DetailsPage` with correct props', () => {
    const menuArgs = [ClusterServiceVersionModel, testSubscription];
    const match = {
      params: { ns: 'default', name: 'example-sub' },
      url: '',
      isExact: true,
      path: '',
    };
    const wrapper = shallow(<SubscriptionDetailsPage match={match} namespace="default" />);

    expect(wrapper.find(DetailsPage).props().kind).toEqual(referenceForModel(SubscriptionModel));
    expect(wrapper.find(DetailsPage).props().pages.length).toEqual(2);
    expect(wrapper.find(DetailsPage).props().menuActions[0]).toEqual(Kebab.factory.Edit);
    expect(
      wrapper
        .find(DetailsPage)
        .props()
        .menuActions[1](...menuArgs).labelKey,
    ).toEqual('olm~Remove Subscription');
    expect(
      wrapper
        .find(DetailsPage)
        .props()
        .menuActions[2](...menuArgs).labelKey,
    ).toEqual(`olm~View ClusterServiceVersion...`);
  });

  it('passes additional resources to watch', () => {
    const match = {
      params: { ns: 'default', name: 'example-sub' },
      url: '',
      isExact: true,
      path: '',
    };
    const wrapper = shallow(<SubscriptionDetailsPage match={match} namespace="default" />);

    expect(wrapper.find(DetailsPage).props().resources).toEqual([
      {
        kind: referenceForModel(PackageManifestModel),
        namespace: 'default',
        isList: true,
        prop: 'packageManifests',
      },
      {
        kind: referenceForModel(InstallPlanModel),
        isList: true,
        namespace: 'default',
        prop: 'installPlans',
      },
      {
        kind: referenceForModel(ClusterServiceVersionModel),
        isList: true,
        namespace: 'default',
        prop: 'clusterServiceVersions',
      },
      {
        kind: referenceForModel(CatalogSourceModel),
        isList: true,
        prop: 'catalogSources',
      },
      {
        kind: referenceForModel(SubscriptionModel),
        isList: true,
        namespace: 'default',
        prop: 'subscriptions',
      },
    ]);
  });
});

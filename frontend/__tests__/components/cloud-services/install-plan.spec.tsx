/* eslint-disable no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash';
import { shallow, ShallowWrapper } from 'enzyme';

import { InstallPlanHeader, InstallPlanHeaderProps, InstallPlanRow, InstallPlanRowProps, InstallPlansList, InstallPlansListProps, InstallPlansPage, InstallPlansPageProps, InstallPlanDetailsPage } from '../../../public/components/cloud-services/install-plan';
import { ListHeader, ColHead, ResourceRow, List, ListPage, DetailsPage } from '../../../public/components/factory';
import { ResourceCog, ResourceLink, ResourceIcon, Cog, MsgBox } from '../../../public/components/utils';
import { testInstallPlan } from '../../../__mocks__/k8sResourcesMocks';
import { InstallPlanModel, ClusterServiceVersionModel } from '../../../public/models';
import { referenceForModel } from '../../../public/module/k8s';

describe(InstallPlanHeader.displayName, () => {
  let wrapper: ShallowWrapper<InstallPlanHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<InstallPlanHeader />);
  });

  it('renders column header for install plan name', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(0).props().sortField).toEqual('metadata.name');
    expect(wrapper.find(ListHeader).find(ColHead).at(0).childAt(0).text()).toEqual('Name');
  });

  it('renders column header for install plan namespace', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(1).props().sortField).toEqual('metadata.namespace');
    expect(wrapper.find(ListHeader).find(ColHead).at(1).childAt(0).text()).toEqual('Namespace');
  });

  it('renders column header for install plan components', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(2).childAt(0).text()).toEqual('Components');
  });

  it('renders column header for parent subscription(s)', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(3).childAt(0).text()).toEqual('Subscriptions');
  });

  it('renders column header for install plan status', () => {
    expect(wrapper.find(ListHeader).find(ColHead).at(4).props().sortField).toEqual('status.phase');
    expect(wrapper.find(ListHeader).find(ColHead).at(4).childAt(0).text()).toEqual('Status');
  });
});

describe(InstallPlanRow.displayName, () => {
  let wrapper: ShallowWrapper<InstallPlanRowProps>;

  beforeEach(() => {
    wrapper = shallow(<InstallPlanRow obj={_.cloneDeep(testInstallPlan)} />);
  });

  it('renders resource cog for performing common actions', () => {
    expect(wrapper.find(ResourceRow).childAt(0).find(ResourceCog).props().actions).toEqual(Cog.factory.common);
  });

  it('renders column for install plan name', () => {
    expect(wrapper.find(ResourceRow).childAt(0).find(ResourceLink).props().kind).toEqual(referenceForModel(InstallPlanModel));
    expect(wrapper.find(ResourceRow).childAt(0).find(ResourceLink).props().namespace).toEqual(testInstallPlan.metadata.namespace);
    expect(wrapper.find(ResourceRow).childAt(0).find(ResourceLink).props().name).toEqual(testInstallPlan.metadata.name);
    expect(wrapper.find(ResourceRow).childAt(0).find(ResourceLink).props().title).toEqual(testInstallPlan.metadata.uid);
  });

  it('renders column for install plan namespace', () => {
    expect(wrapper.find(ResourceRow).childAt(1).find(ResourceLink).props().kind).toEqual('Namespace');
    expect(wrapper.find(ResourceRow).childAt(1).find(ResourceLink).props().title).toEqual(testInstallPlan.metadata.namespace);
    expect(wrapper.find(ResourceRow).childAt(1).find(ResourceLink).props().displayName).toEqual(testInstallPlan.metadata.namespace);
  });

  it('render column for install plan components list', () => {
    expect(wrapper.find(ResourceRow).childAt(2).find(ResourceIcon).length).toEqual(1);
    expect(wrapper.find(ResourceRow).childAt(2).find(ResourceIcon).at(0).props().kind).toEqual(referenceForModel(ClusterServiceVersionModel));
  });

  it('renders column for parent subscription(s) determined by `metadata.ownerReferences`', () => {
    expect(wrapper.find(ResourceRow).childAt(3).find(ResourceLink).length).toEqual(1);
  });

  it('renders column for install plan status', () => {
    expect(wrapper.find(ResourceRow).childAt(4).text()).toEqual(testInstallPlan.status.phase);
  });

  it('renders column with fallback status if `status.phase` is undefined', () => {
    const obj = {..._.cloneDeep(testInstallPlan), status: null};
    wrapper = wrapper.setProps({obj});

    expect(wrapper.find(ResourceRow).childAt(4).text()).toEqual('Unknown');
  });
});

describe(InstallPlansList.displayName, () => {
  let wrapper: ShallowWrapper<InstallPlansListProps>;

  beforeEach(() => {
    wrapper = shallow(<InstallPlansList />);
  });

  it('renders a `List` component with the correct props', () => {
    expect(wrapper.find<any>(List).props().Header).toEqual(InstallPlanHeader);
    expect(wrapper.find<any>(List).props().Row).toEqual(InstallPlanRow);
  });

  it('passes custom empty message for list', () => {
    const EmptyMsg = wrapper.find<any>(List).props().EmptyMsg;
    const msgWrapper = shallow(<EmptyMsg />);

    expect(msgWrapper.find(MsgBox).props().title).toEqual('No Install Plans Found');
    expect(msgWrapper.find(MsgBox).props().detail).toEqual('Install Plans are created automatically by subscriptions or manually using kubectl.');
  });
});

describe(InstallPlansPage.displayName, () => {
  let wrapper: ShallowWrapper<InstallPlansPageProps>;

  beforeEach(() => {
    wrapper = shallow(<InstallPlansPage />);
  });

  it('renders a `ListPage` with the correct props', () => {
    expect(wrapper.find(ListPage).props().title).toEqual('Install Plans');
    expect(wrapper.find(ListPage).props().showTitle).toBe(true);
    expect(wrapper.find(ListPage).props().ListComponent).toEqual(InstallPlansList);
    expect(wrapper.find(ListPage).props().filterLabel).toEqual('Install Plans by name');
    expect(wrapper.find(ListPage).props().kind).toEqual(referenceForModel(InstallPlanModel));
  });
});

describe(InstallPlanDetailsPage.displayName, () => {

  it('passes `breadcrumbsFor` function for rendering a link back to the parent `Subscription-v1` if it has one', () => {
    const match = {params: {ns: 'default', name: 'example-sub'}, url: '', isExact: true, path: ''};
    const wrapper = shallow(<InstallPlanDetailsPage match={match} />);
    const breadcrumbsFor = wrapper.find(DetailsPage).props().breadcrumbsFor;

    expect(breadcrumbsFor(testInstallPlan)).toEqual([{
      name: testInstallPlan.metadata.ownerReferences[0].name,
      path: `/k8s/ns/default/subscription-v1s/${testInstallPlan.metadata.ownerReferences[0].name}`,
    }, {
      name: 'Install Plan Details',
      path: match.url,
    }]);
  });
});

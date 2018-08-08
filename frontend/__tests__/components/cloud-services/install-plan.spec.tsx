/* eslint-disable no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash';
import { shallow, ShallowWrapper } from 'enzyme';
import { Link } from 'react-router-dom';

import { InstallPlanHeader, InstallPlanHeaderProps, InstallPlanRow, InstallPlanRowProps, InstallPlansList, InstallPlansListProps, InstallPlansPage, InstallPlansPageProps, InstallPlanDetailsPage, InstallPlanPreview, InstallPlanPreviewProps, InstallPlanPreviewState, InstallPlanDetailsPageProps, InstallPlanDetails, InstallPlanDetailsProps } from '../../../public/components/cloud-services/install-plan';
import { InstallPlanKind, InstallPlanApproval } from '../../../public/components/cloud-services';
import { ListHeader, ColHead, ResourceRow, List, ListPage, DetailsPage } from '../../../public/components/factory';
import { ResourceCog, ResourceLink, ResourceIcon, Cog, MsgBox } from '../../../public/components/utils';
import { testInstallPlan } from '../../../__mocks__/k8sResourcesMocks';
import { InstallPlanModel, ClusterServiceVersionModel } from '../../../public/models';
import * as k8s from '../../../public/module/k8s';

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
    expect(wrapper.find(ResourceRow).childAt(0).find(ResourceLink).props().kind).toEqual(k8s.referenceForModel(InstallPlanModel));
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
    expect(wrapper.find(ResourceRow).childAt(2).find(ResourceIcon).at(0).props().kind).toEqual(k8s.referenceForModel(ClusterServiceVersionModel));
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
    expect(wrapper.find(ListPage).props().kind).toEqual(k8s.referenceForModel(InstallPlanModel));
  });
});

describe(InstallPlanPreview.name, () => {
  let wrapper: ShallowWrapper<InstallPlanPreviewProps, InstallPlanPreviewState>;
  let installPlan: InstallPlanKind;

  beforeEach(() => {
    installPlan = _.cloneDeep(testInstallPlan);
    installPlan.status.plan = [
      {
        resolving: 'testoperator.v1.0.0',
        status: 'Created',
        resource: {
          group: ClusterServiceVersionModel.apiGroup,
          version: ClusterServiceVersionModel.apiVersion,
          kind: ClusterServiceVersionModel.kind,
          name: 'testoperator.v1.0.0',
          manifest: '',
        }
      },
    ];

    wrapper = shallow(<InstallPlanPreview obj={installPlan} />);
  });

  it('renders empty message if `status.plan` is not filled', () => {
    installPlan.status.plan = [];
    wrapper = wrapper.setProps({obj: installPlan});

    expect(wrapper.find(MsgBox).exists()).toBe(true);
  });

  it('renders button to approve install plan if requires approval', () => {
    wrapper = wrapper.setState({needsApproval: true});

    expect(wrapper.find('.co-well').find('button').text()).toEqual('Approve');
  });

  it('calls `k8sUpdate` to set `approved: true` when button is clicked', (done) => {
    spyOn(k8s, 'k8sUpdate').and.callFake((model, obj) => {
      expect(obj.spec.approved).toBe(true);

      return Promise.resolve(testInstallPlan).then(() => done());
    });

    wrapper = wrapper.setState({needsApproval: true});
    wrapper.find('.co-well').find('button').simulate('click');
  });

  it('renders section for each resolving `ClusterServiceVersion`', () => {
    expect(wrapper.find('.co-m-pane__body').length).toEqual(installPlan.status.plan.length);
  });
});

describe(InstallPlanDetails.displayName, () => {
  let wrapper: ShallowWrapper<InstallPlanDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(<InstallPlanDetails obj={testInstallPlan} />);
  });

  it('renders link to "Components" tab if install plan needs approval', () => {
    let installPlan = _.cloneDeep(testInstallPlan);
    installPlan.spec.approval = InstallPlanApproval.Manual;
    installPlan.spec.approved = false;
    wrapper = wrapper.setProps({obj: installPlan});

    expect(wrapper.find('.co-well').find(Link).props().to).toEqual(`/k8s/ns/default/${k8s.referenceForModel(InstallPlanModel)}/${testInstallPlan.metadata.name}/components`);
  });

  it('does not render link to "Components" tab if install plan does not need approval"', () => {
    expect(wrapper.find('.co-well').exists()).toBe(false);
  });
});

describe(InstallPlanDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper<InstallPlanDetailsPageProps>;
  let match: InstallPlanDetailsPageProps['match'];

  beforeEach(() => {
    match = {isExact: true, path: '', url: '', params: {ns: 'default', name: testInstallPlan.metadata.name}};
    wrapper = shallow(<InstallPlanDetailsPage match={match} />);
  });

  it('renders a `DetailsPage` with correct props', () => {
    expect(wrapper.find(DetailsPage).props().pages.map(p => p.name)).toEqual(['Overview', 'YAML', 'Components']);
  });

  it('passes `breadcrumbsFor` function for rendering a link back to the parent `Subscription` if it has one', () => {
    const breadcrumbsFor = wrapper.find(DetailsPage).props().breadcrumbsFor;

    expect(breadcrumbsFor(testInstallPlan)).toEqual([{
      name: testInstallPlan.metadata.ownerReferences[0].name,
      path: `/k8s/ns/default/operators.coreos.com:v1alpha1:Subscription/${testInstallPlan.metadata.ownerReferences[0].name}`,
    }, {
      name: 'Install Plan Details',
      path: match.url,
    }]);
  });
});

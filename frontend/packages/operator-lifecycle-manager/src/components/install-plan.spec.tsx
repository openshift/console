import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import {
  Table,
  MultiListPage,
  DetailsPage,
  RowFunctionArgs,
  TableRow,
} from '@console/internal/components/factory';
import {
  ResourceKebab,
  ResourceLink,
  ResourceIcon,
  Kebab,
  MsgBox,
  HintBlock,
} from '@console/internal/components/utils';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import * as k8s from '@console/internal/module/k8s';
import { testInstallPlan } from '../../mocks';
import { InstallPlanModel, ClusterServiceVersionModel, OperatorGroupModel } from '../models';
import { InstallPlanKind, InstallPlanApproval } from '../types';
import {
  InstallPlanTableRow,
  InstallPlansList,
  InstallPlansListProps,
  InstallPlansPage,
  InstallPlansPageProps,
  InstallPlanDetailsPage,
  InstallPlanPreview,
  InstallPlanDetailsPageProps,
  InstallPlanDetails,
  InstallPlanDetailsProps,
} from './install-plan';
import * as modal from './modals/installplan-preview-modal';
import { referenceForStepResource } from '.';
import Spy = jasmine.Spy;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

const i18nNS = 'public';

describe('InstallPlanTableRow', () => {
  let obj: InstallPlanKind;
  let wrapper: ShallowWrapper;

  const updateWrapper = () => {
    const rowArgs: RowFunctionArgs<k8s.K8sResourceKind> = {
      obj,
      index: 0,
      key: '0',
      style: {},
    } as any;

    wrapper = shallow(<InstallPlanTableRow {...rowArgs} />);
    return wrapper;
  };

  beforeEach(() => {
    obj = _.cloneDeep(testInstallPlan);
    wrapper = updateWrapper();
  });

  it('renders resource kebab for performing common actions', () => {
    expect(wrapper.find(ResourceKebab).props().actions).toEqual(Kebab.factory.common);
  });

  it('renders column for install plan name', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(0)
        .find(ResourceLink)
        .props().kind,
    ).toEqual(k8s.referenceForModel(InstallPlanModel));
    expect(
      wrapper
        .find(TableRow)
        .childAt(0)
        .find(ResourceLink)
        .props().namespace,
    ).toEqual(testInstallPlan.metadata.namespace);
    expect(
      wrapper
        .find(TableRow)
        .childAt(0)
        .find(ResourceLink)
        .props().name,
    ).toEqual(testInstallPlan.metadata.name);
    expect(
      wrapper
        .find(TableRow)
        .childAt(0)
        .find(ResourceLink)
        .props().title,
    ).toEqual(testInstallPlan.metadata.uid);
  });

  it('renders column for install plan namespace', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(1)
        .find(ResourceLink)
        .props().kind,
    ).toEqual('Namespace');
    expect(
      wrapper
        .find(TableRow)
        .childAt(1)
        .find(ResourceLink)
        .props().title,
    ).toEqual(testInstallPlan.metadata.namespace);
    expect(
      wrapper
        .find(TableRow)
        .childAt(1)
        .find(ResourceLink)
        .props().displayName,
    ).toEqual(testInstallPlan.metadata.namespace);
  });

  it('renders column for install plan status', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .render()
        .find('[data-test="status-text"]')
        .text(),
    ).toEqual(testInstallPlan.status.phase);
  });

  it('renders column with fallback status if `status.phase` is undefined', () => {
    obj = { ..._.cloneDeep(testInstallPlan), status: null };
    wrapper = updateWrapper();

    expect(
      wrapper
        .find(TableRow)
        .childAt(2)
        .render()
        .text(),
    ).toEqual('Unknown');
    expect(
      wrapper
        .find(TableRow)
        .childAt(3)
        .find(ResourceIcon).length,
    ).toEqual(1);
    expect(
      wrapper
        .find(TableRow)
        .childAt(3)
        .find(ResourceIcon)
        .at(0)
        .props().kind,
    ).toEqual(k8s.referenceForModel(ClusterServiceVersionModel));
  });

  it('render column for install plan components list', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(3)
        .find(ResourceLink)
        .props().kind,
    ).toEqual(k8s.referenceForModel(ClusterServiceVersionModel));
    expect(
      wrapper
        .find(TableRow)
        .childAt(3)
        .find(ResourceLink)
        .props().name,
    ).toEqual(testInstallPlan.spec.clusterServiceVersionNames.toString());
    expect(
      wrapper
        .find(TableRow)
        .childAt(3)
        .find(ResourceLink)
        .props().namespace,
    ).toEqual(testInstallPlan.metadata.namespace);
  });

  it('renders column for parent subscription(s) determined by `metadata.ownerReferences`', () => {
    expect(
      wrapper
        .find(TableRow)
        .childAt(4)
        .find(ResourceLink).length,
    ).toEqual(1);
  });
});

describe('InstallPlansList', () => {
  let wrapper: ShallowWrapper<InstallPlansListProps>;

  beforeEach(() => {
    wrapper = shallow(<InstallPlansList.WrappedComponent operatorGroup={null} />);
  });

  it('renders a `Table` component with the correct props', () => {
    const headerTitles = wrapper
      .find(Table)
      .props()
      .Header()
      .map((header) => header.title);
    expect(headerTitles).toEqual([
      'olm~Name',
      'olm~Namespace',
      'olm~Status',
      'olm~Components',
      'olm~Subscriptions',
      '',
    ]);
  });

  it('passes custom empty message for table', () => {
    const MsgComponent = wrapper.find<any>(Table).props().EmptyMsg;
    const msgWrapper = shallow(<MsgComponent />);
    expect(msgWrapper.find(MsgBox).props().title).toEqual('olm~No InstallPlans found');
    expect(msgWrapper.find(MsgBox).props().detail).toEqual(
      'olm~InstallPlans are created automatically by subscriptions or manually using the CLI.',
    );
  });
});

describe('InstallPlansPage', () => {
  let wrapper: ShallowWrapper<InstallPlansPageProps>;
  const match: any = {
    params: {
      ns: 'default',
    },
  };

  beforeEach(() => {
    wrapper = shallow(<InstallPlansPage match={match} />);
  });

  it('renders a `MultiListPage` with the correct props', () => {
    expect(wrapper.find(MultiListPage).props().title).toEqual('olm~InstallPlans');
    expect(wrapper.find(MultiListPage).props().showTitle).toBe(false);
    expect(wrapper.find(MultiListPage).props().ListComponent).toEqual(InstallPlansList);
    expect(wrapper.find(MultiListPage).props().resources).toEqual([
      {
        kind: k8s.referenceForModel(InstallPlanModel),
        namespace: 'default',
        namespaced: true,
        prop: 'installPlan',
      },
      {
        kind: k8s.referenceForModel(OperatorGroupModel),
        namespace: 'default',
        namespaced: true,
        prop: 'operatorGroup',
      },
    ]);
  });
});

describe('InstallPlanPreview', () => {
  // let wrapper: ShallowWrapper<InstallPlanPreviewProps, InstallPlanPreviewState>;
  // let obj: InstallPlanKind;
  const obj: InstallPlanKind = {
    ...testInstallPlan,
    status: {
      ...testInstallPlan.status,
      plan: [
        {
          resolving: 'testoperator.v1.0.0',
          status: 'Created',
          resource: {
            group: ClusterServiceVersionModel.apiGroup,
            version: ClusterServiceVersionModel.apiVersion,
            kind: ClusterServiceVersionModel.kind,
            name: 'testoperator.v1.0.0',
            manifest: '',
          },
        },
        {
          resolving: 'testoperator.v1.0.0',
          status: 'Unknown',
          resource: {
            group: CustomResourceDefinitionModel.apiGroup,
            version: CustomResourceDefinitionModel.apiVersion,
            kind: CustomResourceDefinitionModel.kind,
            name: 'test-crds.test.com',
            manifest: '',
          },
        },
      ],
    },
  };

  const spyAndExpect = (spy: Spy) => (returnValue: any) =>
    new Promise((resolve) =>
      spy.and.callFake((...args) => {
        resolve(args);
        return returnValue;
      }),
    );

  it('renders empty message if `status.plan` is not filled', () => {
    const wrapper = shallow(
      <InstallPlanPreview obj={{ ...obj, status: { ...obj.status, plan: [] } }} />,
    );
    expect(wrapper.find(MsgBox).exists()).toBe(true);
  });

  it('renders button to approve install plan if requires approval', () => {
    const wrapper = shallow(
      <InstallPlanPreview
        obj={{
          ...obj,
          spec: {
            ...obj.spec,
            approval: InstallPlanApproval.Manual,
            approved: false,
          },
        }}
      />,
    );
    expect(
      wrapper
        .find(HintBlock)
        .shallow()
        .find(Button)
        .at(0)
        .render()
        .text(),
    ).toEqual('olm~Approve');
  });

  it('calls `k8sUpdate` to set `approved: true` when button is clicked', (done) => {
    spyAndExpect(spyOn(k8s, 'k8sUpdate'))(Promise.resolve(testInstallPlan))
      .then(([model, installPlan]) => {
        expect(model).toEqual(InstallPlanModel);
        expect(installPlan.spec.approved).toBe(true);
        done();
      })
      .catch((err) => fail(err));

    const wrapper = shallow(
      <InstallPlanPreview
        obj={{
          ...obj,
          spec: {
            ...obj.spec,
            approval: InstallPlanApproval.Manual,
            approved: false,
          },
        }}
      />,
    );
    wrapper
      .find(HintBlock)
      .shallow()
      .find(Button)
      .at(0)
      .simulate('click');
  });

  it('renders button to deny install plan if requires approval', () => {
    const wrapper = shallow(
      <InstallPlanPreview
        obj={{
          ...obj,
          spec: {
            ...obj.spec,
            approval: InstallPlanApproval.Manual,
            approved: false,
          },
        }}
      />,
    );
    expect(
      wrapper
        .find(HintBlock)
        .shallow()
        .find(Button)
        .at(1)
        .render()
        .text(),
    ).toEqual('olm~Deny');
  });

  it('renders section for each resolving `ClusterServiceVersion`', () => {
    const wrapper = shallow(<InstallPlanPreview obj={obj} />);
    expect(wrapper.find('.co-m-pane__body').length).toEqual(1);
    wrapper.find('.co-m-pane__body').forEach((section) => {
      expect(section.find('tbody').find('tr').length).toEqual(2);
    });
  });

  it('renders link to view install plan component if it exists', () => {
    const wrapper = shallow(<InstallPlanPreview obj={obj} />);
    const row = wrapper
      .find('.co-m-pane__body')
      .find('tbody')
      .find('tr')
      .at(0);

    expect(
      row
        .find('td')
        .at(0)
        .find(ResourceLink)
        .props().name,
    ).toEqual(obj.status.plan[0].resource.name);
  });

  it('renders link to open preview modal for install plan component if not created yet', () => {
    const wrapper = shallow(<InstallPlanPreview obj={obj} />);
    const row = wrapper
      .find('.co-m-pane__body')
      .find('tbody')
      .find('tr')
      .at(1);
    const modalSpy = spyOn(modal, 'installPlanPreviewModal').and.returnValue(null);

    expect(
      row
        .find('td')
        .at(0)
        .find(ResourceIcon)
        .props().kind,
    ).toEqual(referenceForStepResource(obj.status.plan[1].resource));

    row
      .find('td')
      .at(0)
      .find(Button)
      .simulate('click');

    expect(modalSpy.calls.argsFor(0)[0].stepResource).toEqual(obj.status.plan[1].resource);
  });
});

describe('InstallPlanDetails', () => {
  let wrapper: ShallowWrapper<InstallPlanDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(<InstallPlanDetails obj={testInstallPlan} />);
  });

  it('renders link to "Components" tab if install plan needs approval', () => {
    const installPlan = _.cloneDeep(testInstallPlan);
    installPlan.spec.approval = InstallPlanApproval.Manual;
    installPlan.spec.approved = false;
    wrapper = wrapper.setProps({ obj: installPlan });

    expect(
      wrapper
        .find(HintBlock)
        .shallow()
        .find(Link)
        .props().to,
    ).toEqual(
      `/k8s/ns/default/${k8s.referenceForModel(InstallPlanModel)}/${
        testInstallPlan.metadata.name
      }/components`,
    );
  });

  it('does not render link to "Components" tab if install plan does not need approval"', () => {
    expect(wrapper.find(HintBlock).exists()).toBe(false);
  });
});

describe('InstallPlanDetailsPage', () => {
  let wrapper: ShallowWrapper<InstallPlanDetailsPageProps>;
  let match: InstallPlanDetailsPageProps['match'];

  beforeEach(() => {
    match = {
      isExact: true,
      path: '',
      url: '',
      params: { ns: 'default', name: testInstallPlan.metadata.name },
    };
    wrapper = shallow(<InstallPlanDetailsPage match={match} />);
  });

  it('renders a `DetailsPage` with correct props', () => {
    expect(
      wrapper
        .find(DetailsPage)
        .props()
        .pages.map((p) => p.name || p.nameKey),
    ).toEqual([`${i18nNS}~Details`, `${i18nNS}~YAML`, 'olm~Components']);
  });
});

import * as React from 'react';
import { shallow, ShallowWrapper, mount, ReactWrapper } from 'enzyme';
import * as _ from 'lodash';
import { Provider } from 'react-redux';
import { MemoryRouter, Router, Route } from 'react-router-dom';
import { ListPageBody } from '@console/dynamic-plugin-sdk';
import { Table, DetailsPage, MultiListPage } from '@console/internal/components/factory';
import {
  ListPageCreateLink,
  ListPageCreateDropdown,
} from '@console/internal/components/factory/ListPage/ListPageCreate';
import ListPageFilter from '@console/internal/components/factory/ListPage/ListPageFilter';
import ListPageHeader from '@console/internal/components/factory/ListPage/ListPageHeader';
import {
  history,
  Timestamp,
  LabelList,
  FirehoseResourcesResult,
  ResourceLink,
} from '@console/internal/components/utils';
import * as k8sModels from '@console/internal/module/k8s';
import store from '@console/internal/redux';
import * as extensionHooks from '@console/plugin-sdk';
import { LazyActionMenu } from '@console/shared';
import {
  testCRD,
  testResourceInstance,
  testClusterServiceVersion,
  testModel,
  testConditionsDescriptor,
} from '../../../mocks';
import { ClusterServiceVersionModel } from '../../models';
import { DescriptorDetailsItem, DescriptorDetailsItemList } from '../descriptors';
import { Resources } from '../k8s-resource';
import { OperandLink } from './operand-link';
import {
  OperandList,
  OperandListProps,
  ProvidedAPIsPage,
  ProvidedAPIsPageProps,
  OperandTableRowProps,
  OperandTableRow,
  OperandDetails,
  OperandDetailsProps,
  OperandDetailsPage,
  ProvidedAPIPage,
  ProvidedAPIPageProps,
  OperandStatus,
  OperandStatusProps,
} from '.';

const mountWithRoute = <T,>(component, currentURL, routePath): ReactWrapper<T> =>
  mount<T>(component, {
    wrappingComponent: ({ children }) => (
      <Provider store={store}>
        <MemoryRouter initialEntries={[currentURL]}>
          <Route path={routePath}>{children}</Route>
        </MemoryRouter>
      </Provider>
    ),
  });

jest.mock('@console/shared/src/hooks/useK8sModels', () => ({
  useK8sModels: () => [
    {
      'testapp.coreos.com~v1alpha1~TestResource': {
        abbr: 'TR',
        apiGroup: 'testapp.coreos.com',
        apiVersion: 'v1alpha1',
        crd: true,
        kind: 'TestResource',
        label: 'Test Resource',
        labelPlural: 'Test Resources',
        namespaced: true,
        plural: 'testresources',
        verbs: ['create'],
      },
    },
    false,
    null,
  ],
}));

jest.mock('@console/shared/src/hooks/useK8sModel', () => {
  return {
    useK8sModel: (groupVersionKind) => [
      groupVersionKind === 'TestResourceRO'
        ? {
            abbr: 'TR',
            apiGroup: 'testapp.coreos.com',
            apiVersion: 'v1alpha1',
            crd: true,
            kind: 'TestResourceRO',
            label: 'Test Resource',
            labelPlural: 'Test Resources',
            namespaced: true,
            plural: 'testresources',
            verbs: ['get'],
          }
        : {
            abbr: 'TR',
            apiGroup: 'testapp.coreos.com',
            apiVersion: 'v1alpha1',
            crd: true,
            kind: 'TestResource',
            label: 'Test Resource',
            labelPlural: 'Test Resources',
            namespaced: true,
            plural: 'testresources',
            verbs: ['create'],
          },
      false,
      null,
    ],
  };
});

jest.mock('react-redux', () => ({
  ...(jest as any).requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useActiveCluster', () => ({
  useActiveCluster: () => ['local-cluster', () => {}],
}));

const i18nNS = 'public';

describe(OperandTableRow.displayName, () => {
  let wrapper: ReactWrapper<OperandTableRowProps>;

  beforeEach(() => {
    spyOn(extensionHooks, 'useExtensions').and.returnValue([]);
    wrapper = mount(<OperandTableRow obj={testResourceInstance} columns={[]} showNamespace />, {
      wrappingComponent: (props) => (
        <Router history={history}>
          <Provider store={store} {...props} />
        </Router>
      ),
    });
  });

  it('renders column for resource name', () => {
    const col = wrapper.childAt(0);
    const link = col.find(OperandLink);

    expect(link.props().obj).toEqual(testResourceInstance);
  });

  it('renders column for resource type', () => {
    const col = wrapper.childAt(1);

    expect(col.text()).toEqual(testResourceInstance.kind);
  });
  it('renders column for resource namespace', () => {
    const col = wrapper.childAt(2);
    const link = col.find(ResourceLink);

    expect(link.props().name).toEqual(testResourceInstance.metadata.namespace);
  });
  it('renders column for resource status', () => {
    const col = wrapper.childAt(3);

    expect(col.find(OperandStatus).props().operand).toEqual(testResourceInstance);
  });

  it('renders column for resource labels', () => {
    const col = wrapper.childAt(4);
    const labelList = col.find(LabelList);

    expect(labelList.props().kind).toEqual(testResourceInstance.kind);
    expect(labelList.props().labels).toEqual(testResourceInstance.metadata.labels);
  });

  it('renders column for last updated timestamp', () => {
    const col = wrapper.childAt(5);
    const timestamp = col.find(Timestamp);

    expect(timestamp.props().timestamp).toEqual(testResourceInstance.metadata.creationTimestamp);
  });

  it('renders a `LazyActionsMenu` for resource actions', () => {
    const kebab = wrapper.find(LazyActionMenu);
    expect(kebab.props().context.hasOwnProperty('csv-actions')).toBeTruthy();
  });
});

describe(OperandList.displayName, () => {
  let wrapper: ReactWrapper<OperandListProps>;
  let resources: k8sModels.K8sResourceKind[];

  beforeEach(() => {
    resources = [testResourceInstance];
    spyOn(extensionHooks, 'useExtensions').and.returnValue([]);
    wrapper = mount(<OperandList loaded data={resources} showNamespace />, {
      wrappingComponent: (props) => (
        <Router history={history}>
          <Provider store={store} {...props} />
        </Router>
      ),
    });
  });

  it('renders a `Table` of the custom resource instances of the given kind', () => {
    const table: ReactWrapper<any> = wrapper.find(Table);

    expect(
      Object.keys(wrapper.props()).reduce(
        (k, prop) => _.isEqual(table.prop(prop), wrapper.prop(prop)),
        false,
      ),
    ).toBe(true);
    expect(table.props().Header().length).toEqual(7);
    expect(table.props().Header()[0].title).toEqual('Name');
    expect(table.props().Header()[1].title).toEqual('Kind');
    expect(table.props().Header()[2].title).toEqual('Namespace');
    expect(table.props().Header()[3].title).toEqual('Status');
    expect(table.props().Header()[4].title).toEqual('Labels');
    expect(table.props().Header()[5].title).toEqual('Last updated');
    expect(_.isFunction(table.props().Row)).toBe(true);
  });
});

describe(OperandDetails.displayName, () => {
  let wrapper: ShallowWrapper<OperandDetailsProps>;
  let resourceDefinition: any;

  beforeEach(() => {
    resourceDefinition = {
      plural: testCRD.metadata.name.split('.')[0],
      annotations: testCRD.metadata.annotations,
    };
    wrapper = shallow(
      <OperandDetails.WrappedComponent
        csv={testClusterServiceVersion}
        crd={testCRD}
        obj={testResourceInstance}
        kindObj={resourceDefinition}
        appName={testClusterServiceVersion.metadata.name}
      />,
    );
  });

  it('renders description title', () => {
    const title = wrapper
      .find('SectionHeading')
      .first()
      .prop('text');
    expect(title).toEqual('Test Resource overview');
  });

  it('renders info section', () => {
    const section = wrapper.find('.co-operand-details__section.co-operand-details__section--info');

    expect(section.exists()).toBe(true);
  });

  it('does not render filtered status fields', () => {
    const crd = testClusterServiceVersion.spec.customresourcedefinitions.owned.find(
      (c) => c.name === 'testresources.testapp.coreos.com',
    );
    const filteredDescriptor = crd.statusDescriptors.find((sd) => sd.path === 'importantMetrics');
    const statusView = wrapper
      .find(DescriptorDetailsItem)
      .filterWhere((node) => node.props().descriptor === filteredDescriptor);

    expect(statusView.exists()).toBe(false);
  });

  it('does not render any spec descriptor fields if there are none defined on the `ClusterServiceVersion`', () => {
    const csv = _.cloneDeep(testClusterServiceVersion);
    csv.spec.customresourcedefinitions.owned = [];
    wrapper = wrapper.setProps({ csv });

    expect(wrapper.find(DescriptorDetailsItem).length).toEqual(0);
  });

  xit('[CONSOLE-2336] renders spec descriptor fields if the custom resource is `owned`', () => {
    expect(
      wrapper
        .find(DescriptorDetailsItemList)
        .last()
        .shallow()
        .find(DescriptorDetailsItem).length,
    ).toEqual(
      testClusterServiceVersion.spec.customresourcedefinitions.owned[0].specDescriptors.length,
    );
  });

  xit('[CONSOLE-2336] renders spec descriptor fields if the custom resource is `required`', () => {
    const csv = _.cloneDeep(testClusterServiceVersion);
    csv.spec.customresourcedefinitions.required = _.cloneDeep(
      csv.spec.customresourcedefinitions.owned,
    );
    csv.spec.customresourcedefinitions.owned = [];
    wrapper = wrapper.setProps({ csv });

    expect(
      wrapper
        .find(DescriptorDetailsItemList)
        .last()
        .shallow()
        .find(DescriptorDetailsItem).length,
    ).toEqual(csv.spec.customresourcedefinitions.required[0].specDescriptors.length);
  });

  it('renders a Condtions table', () => {
    expect(
      wrapper
        .find('SectionHeading')
        .at(1)
        .prop('text'),
    ).toEqual('Conditions');

    expect(wrapper.find('Conditions').prop('conditions')).toEqual(
      testResourceInstance.status.conditions,
    );
  });

  it('renders a DescriptorConditions component for conditions descriptor', () => {
    expect(wrapper.find('DescriptorConditions').prop('descriptor')).toEqual(
      testConditionsDescriptor,
    );
    expect(wrapper.find('DescriptorConditions').prop('obj')).toEqual(testResourceInstance);
    expect(wrapper.find('DescriptorConditions').prop('schema')).toEqual({});
  });
});

describe('ResourcesList', () => {
  const currentURL = `/k8s/ns/default/${
    ClusterServiceVersionModel.plural
  }/etcd/${k8sModels.referenceFor(testResourceInstance)}/my-etcd`;
  const routePath = `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/:name`;
  it('uses the resources defined in the CSV', () => {
    const wrapper = mountWithRoute(
      <Resources csv={testClusterServiceVersion} obj={testResourceInstance} />,
      currentURL,
      routePath,
    );
    const multiListPage = wrapper.find(MultiListPage);
    expect(multiListPage.props().resources).toEqual(
      testClusterServiceVersion.spec.customresourcedefinitions.owned[0].resources.map(
        (resource) => ({ kind: resource.kind, namespaced: true, prop: 'Pod' }),
      ),
    );
  });

  it('uses the default resources if the kind is not found in the CSV', () => {
    const wrapper = mountWithRoute(
      <Resources csv={null} obj={testResourceInstance} />,
      currentURL,
      routePath,
    );
    const multiListPage = wrapper.find(MultiListPage);
    expect(multiListPage.props().resources.length > 5).toEqual(true);
  });
});

describe(OperandDetailsPage.displayName, () => {
  const currentURL = `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com~v1alpha1~TestResource/my-test-resource`;
  const routePath = `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/:name`;
  window.SERVER_FLAGS.copiedCSVsDisabled = { 'local-cluster': false };

  it('renders a `DetailsPage` with the correct subpages', () => {
    const wrapper = mountWithRoute(<OperandDetailsPage />, currentURL, routePath);
    const detailsPage = wrapper.find(DetailsPage);
    expect(detailsPage.props().pages[0].nameKey).toEqual(`${i18nNS}~Details`);
    expect(detailsPage.props().pages[0].href).toEqual('');
    expect(detailsPage.props().pages[1].nameKey).toEqual(`${i18nNS}~YAML`);
    expect(detailsPage.props().pages[1].href).toEqual('yaml');
    expect(detailsPage.props().pages[2].name).toEqual('Resources');
    expect(detailsPage.props().pages[2].href).toEqual('resources');
  });

  it('renders a `DetailsPage` which also watches the parent CSV', () => {
    const wrapper = mountWithRoute(<OperandDetailsPage />, currentURL, routePath);
    expect(wrapper.find(DetailsPage).prop('resources')[0]).toEqual({
      kind: 'CustomResourceDefinition',
      name: 'testresources.testapp.coreos.com',
      isList: false,
      prop: 'crd',
    });
  });

  it('menu actions to `DetailsPage`', () => {
    const wrapper = mountWithRoute(<OperandDetailsPage />, currentURL, routePath);
    expect(wrapper.find(DetailsPage).prop('customActionMenu')).toBeTruthy();
  });

  it('passes function to create breadcrumbs for resource to `DetailsPage`', () => {
    const wrapper = mountWithRoute(<OperandDetailsPage />, currentURL, routePath);
    expect(
      wrapper
        .find(DetailsPage)
        .props()
        .breadcrumbsFor(null),
    ).toEqual([
      {
        name: 'Installed Operators',
        path: `/k8s/ns/default/${ClusterServiceVersionModel.plural}`,
      },
      {
        name: 'testapp',
        path: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com~v1alpha1~TestResource`,
      },
      {
        name: `TestResource details`,
        path: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com~v1alpha1~TestResource/my-test-resource`,
      },
    ]);
  });

  it('creates correct breadcrumbs even if `namespace`, `plural`, `appName`, and `name` URL parameters are the same', () => {
    const wrapper = mountWithRoute(
      <OperandDetailsPage />,
      `/k8s/ns/example/${ClusterServiceVersionModel.plural}/example/example/example`,
      routePath,
    );

    expect(
      wrapper
        .find(DetailsPage)
        .props()
        .breadcrumbsFor(null),
    ).toEqual([
      {
        name: 'Installed Operators',
        path: `/k8s/ns/example/${ClusterServiceVersionModel.plural}`,
      },
      {
        name: 'example',
        path: `/k8s/ns/example/${ClusterServiceVersionModel.plural}/example/example`,
      },
      {
        name: `example details`,
        path: `/k8s/ns/example/${ClusterServiceVersionModel.plural}/example/example/example`,
      },
    ]);
  });

  it('passes `flatten` function to Resources component which returns only objects with `ownerReferences` to each other or parent object', () => {
    const wrapper = mountWithRoute(
      <Resources csv={testClusterServiceVersion} obj={testResourceInstance} />,
      currentURL,
      routePath,
    );
    const { flatten } = wrapper.find(MultiListPage).props();
    const pod = {
      kind: 'Pod',
      metadata: {
        uid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        ownerReferences: [
          {
            uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            name: 'foo',
            kind: 'fooKind',
            apiVersion: 'fooVersion',
          },
        ],
      },
    };
    const deployment = {
      kind: 'Deployment',
      metadata: {
        uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        ownerReferences: [
          {
            uid: testResourceInstance.metadata.uid,
            name: 'foo',
            kind: 'fooKind',
            apiVersion: 'fooVersion',
          },
        ],
      },
    };
    const secret = {
      kind: 'Secret',
      metadata: { uid: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
    };
    const resources: FirehoseResourcesResult = {
      Deployment: { data: [deployment], loaded: true, loadError: undefined },
      Secret: { data: [secret], loaded: true, loadError: undefined },
      Pod: { data: [pod], loaded: true, loadError: undefined },
    };
    const data = flatten(resources);

    expect(data.map((obj) => obj.metadata.uid)).not.toContain(secret.metadata.uid);
    expect(data.map((obj) => obj.metadata.uid)).toContain(pod.metadata.uid);
    expect(data.map((obj) => obj.metadata.uid)).toContain(deployment.metadata.uid);
  });
});

describe(ProvidedAPIsPage.displayName, () => {
  let wrapper: ReactWrapper<ProvidedAPIsPageProps>;

  beforeAll(() => {
    // Since crd models have not been loaded into redux state, just force return of the correct model type
    spyOn(k8sModels, 'modelFor').and.returnValue(testModel);
  });

  beforeEach(() => {
    wrapper = mountWithRoute<ProvidedAPIsPageProps>(
      <ProvidedAPIsPage obj={testClusterServiceVersion} />,
      `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/instances`,
      `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/instances`,
    );
  });
  it('render listpage components', () => {
    expect(wrapper.find(ListPageHeader).exists()).toBe(true);
    expect(wrapper.find(ListPageCreateDropdown).exists()).toBe(true);
    expect(wrapper.find(ListPageBody).exists()).toBe(true);
    expect(wrapper.find(ListPageFilter).exists()).toBe(true);
  });
  it('render ListPageCreateDropdown with the correct text', () => {
    expect(
      wrapper
        .find(ListPageCreateDropdown)
        .children()
        .text(),
    ).toEqual('Create new');
  });
  it('passes `items` props and render ListPageCreateDropdown create button if app has multiple owned CRDs', () => {
    const obj = _.cloneDeep(testClusterServiceVersion);
    obj.spec.customresourcedefinitions.owned.push({
      name: 'foobars.testapp.coreos.com',
      displayName: 'Foo Bars',
      version: 'v1',
      kind: 'FooBar',
    });
    wrapper.setProps({ obj });
    const listPageCreateDropdown = wrapper.find(ListPageCreateDropdown);

    expect(listPageCreateDropdown.props().items).toEqual({
      'testapp.coreos.com~v1alpha1~TestResource': 'Test Resource',
      'testapp.coreos.com~v1~FooBar': 'Foo Bars',
    });
  });
  it('check if ListPageBody component renders the correct children', () => {
    expect(
      wrapper
        .find(ListPageBody)
        .children()
        .children().length,
    ).toBe(2);
  });
});

describe(ProvidedAPIPage.displayName, () => {
  let wrapper: ReactWrapper<ProvidedAPIPageProps>;

  beforeEach(() => {
    wrapper = mountWithRoute(
      <ProvidedAPIPage kind="TestResourceRO" csv={testClusterServiceVersion} />,
      `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/TestResourceRO`,
      `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural`,
    );
  });

  it('render listpage components', () => {
    expect(wrapper.find(ListPageHeader).exists()).toBe(true);
    expect(wrapper.find(ListPageCreateLink).exists()).toBe(true);
    expect(wrapper.find(ListPageBody).exists()).toBe(true);
    expect(wrapper.find(ListPageFilter).exists()).toBe(true);
  });
  it('render ListPageCreateLink with the correct props for create button if app has single owned CRDs', () => {
    expect(wrapper.find(ListPageCreateLink).props().to).toEqual(
      `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/TestResourceRO/~new`,
    );
  });
  it('render ListPageCreateLink with the correct text', () => {
    expect(
      wrapper
        .find(ListPageCreateLink)
        .children()
        .text(),
    ).toEqual('Create Test Resource');
  });
  it('check if ListPageBody component renders the correct children', () => {
    expect(
      wrapper
        .find(ListPageBody)
        .children()
        .children().length,
    ).toBe(2);
  });
});

describe('OperandStatus', () => {
  let wrapper: ShallowWrapper<OperandStatusProps>;

  it('displays the correct status for a `status` value of `Running`', () => {
    const obj = {
      status: {
        status: 'Running',
        state: 'Degraded',
        conditions: [
          {
            type: 'Failed',
            status: 'True',
          },
        ],
      },
    };
    wrapper = shallow(<OperandStatus operand={obj} />);
    expect(wrapper.childAt(0).text()).toEqual('Status');
    expect(wrapper.childAt(2).props().title).toEqual('Running');
  });

  it('displays the correct status for a `phase` value of `Running`', () => {
    const obj = {
      status: {
        phase: 'Running',
        status: 'Installed',
        state: 'Degraded',
        conditions: [
          {
            type: 'Failed',
            status: 'True',
          },
        ],
      },
    };
    wrapper = shallow(<OperandStatus operand={obj} />);
    expect(wrapper.childAt(0).text()).toEqual('Phase');
    expect(wrapper.childAt(2).props().title).toEqual('Running');
  });

  it('displays the correct status for a `phase` value of `Running`', () => {
    const obj = {
      status: {
        phase: 'Running',
        status: 'Installed',
        state: 'Degraded',
        conditions: [
          {
            type: 'Failed',
            status: 'True',
          },
        ],
      },
    };
    wrapper = shallow(<OperandStatus operand={obj} />);
    expect(wrapper.childAt(0).text()).toEqual('Phase');
    expect(wrapper.childAt(2).props().title).toEqual('Running');
  });

  it('displays the correct status for a `state` value of `Running`', () => {
    const obj = {
      status: {
        state: 'Running',
        conditions: [
          {
            type: 'Failed',
            status: 'True',
          },
        ],
      },
    };
    wrapper = shallow(<OperandStatus operand={obj} />);
    expect(wrapper.childAt(0).text()).toEqual('State');
    expect(wrapper.childAt(2).props().title).toEqual('Running');
  });

  it('displays the correct status for a condition status of `True`', () => {
    const obj = {
      status: {
        conditions: [
          {
            type: 'Failed',
            status: 'False',
          },
          {
            type: 'Running',
            status: 'True',
          },
        ],
      },
    };
    wrapper = shallow(<OperandStatus operand={obj} />);
    expect(wrapper.childAt(0).text()).toEqual('Condition');
    expect(wrapper.childAt(2).props().title).toEqual('Running');
  });

  it('displays the `-` status when no conditions are `True`', () => {
    const obj = {
      status: {
        conditions: [
          {
            type: 'Failed',
            status: 'False',
          },
          {
            type: 'Installed',
            status: 'False',
          },
        ],
      },
    };
    wrapper = shallow(<OperandStatus operand={obj} />);
    expect(wrapper.text()).toEqual('-');
  });

  it('displays the `-` for a missing status stanza', () => {
    const obj = {};
    wrapper = shallow(<OperandStatus operand={obj} />);
    expect(wrapper.text()).toEqual('-');
  });
});

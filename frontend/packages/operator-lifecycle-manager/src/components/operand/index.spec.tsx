import * as React from 'react';
import { shallow, ShallowWrapper, mount, ReactWrapper } from 'enzyme';
import * as _ from 'lodash';
import { Provider } from 'react-redux';
import { match as RouterMatch } from 'react-router-dom';
import { Table, DetailsPage, MultiListPage, ListPage } from '@console/internal/components/factory';
import {
  Timestamp,
  LabelList,
  StatusBox,
  ResourceKebab,
  FirehoseResourcesResult,
} from '@console/internal/components/utils';
import * as k8sModels from '@console/internal/module/k8s';
import store from '@console/internal/redux';
import * as extensionHooks from '@console/plugin-sdk';
import { referenceForProvidedAPI } from '..';
import {
  testCRD,
  testResourceInstance,
  testClusterServiceVersion,
  testOwnedResourceInstance,
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
  OperandDetailsPageProps,
  OperandDetailsProps,
  OperandDetailsPage,
  ProvidedAPIPage,
  ProvidedAPIPageProps,
  OperandStatus,
  OperandStatusProps,
} from '.';

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

const i18nNS = 'public';

describe(OperandTableRow.displayName, () => {
  let wrapper: ShallowWrapper<OperandTableRowProps>;

  beforeEach(() => {
    spyOn(extensionHooks, 'useExtensions').and.returnValue([]);
    wrapper = shallow(<OperandTableRow obj={testResourceInstance} columns={[]} />);
  });

  it('renders column for resource name', () => {
    const col = wrapper.childAt(0);
    const link = col.find(OperandLink);

    expect(link.props().obj).toEqual(testResourceInstance);
  });

  it('renders column for resource type', () => {
    const col = wrapper.childAt(1);

    expect(col.shallow().text()).toEqual(testResourceInstance.kind);
  });

  it('renders column for resource status', () => {
    const col = wrapper.childAt(2);

    expect(col.find(OperandStatus).props().operand).toEqual(testResourceInstance);
  });

  it('renders column for resource labels', () => {
    const col = wrapper.childAt(3);
    const labelList = col.find(LabelList);

    expect(labelList.props().kind).toEqual(testResourceInstance.kind);
    expect(labelList.props().labels).toEqual(testResourceInstance.metadata.labels);
  });

  it('renders column for last updated timestamp', () => {
    const col = wrapper.childAt(4);
    const timestamp = col.find(Timestamp);

    expect(timestamp.props().timestamp).toEqual(testResourceInstance.metadata.creationTimestamp);
  });

  it('renders a `ResourceKebab` for resource actions', () => {
    const kebab = wrapper.find(ResourceKebab);

    expect(kebab.props().actions[0](testModel, testOwnedResourceInstance).labelKey).toEqual(
      `olm~Edit {{item}}`,
    );
    expect(kebab.props().actions[1](testModel, testOwnedResourceInstance).labelKey).toEqual(
      `olm~Delete {{item}}`,
    );
    expect(kebab.props().kind).toEqual(k8sModels.referenceFor(testResourceInstance));
    expect(kebab.props().resource).toEqual(testResourceInstance);
  });
});

describe(OperandList.displayName, () => {
  let wrapper: ShallowWrapper<OperandListProps>;
  let resources: k8sModels.K8sResourceKind[];

  beforeEach(() => {
    resources = [testResourceInstance];
    spyOn(extensionHooks, 'useExtensions').and.returnValue([]);
    // eslint-disable-next-line react/jsx-pascal-case
    wrapper = shallow(<OperandList loaded data={resources} />);
  });

  it('renders a `Table` of the custom resource instances of the given kind', () => {
    const table: ShallowWrapper<any> = wrapper.find(Table);
    expect(
      Object.keys(wrapper.props()).reduce(
        (k, prop) => table.prop(prop) === wrapper.prop(prop),
        false,
      ),
    ).toBe(true);
    expect(table.props().Header().length).toEqual(6);
    expect(table.props().Header()[0].title).toEqual('Name');
    expect(table.props().Header()[1].title).toEqual('Kind');
    expect(table.props().Header()[2].title).toEqual('Status');
    expect(table.props().Header()[3].title).toEqual('Labels');
    expect(table.props().Header()[4].title).toEqual('Last updated');
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
  let match: RouterMatch<any>;

  beforeEach(() => {
    match = {
      params: {
        appName: 'etcd',
        plural: k8sModels.referenceFor(testResourceInstance),
        name: 'my-etcd',
        ns: 'default',
      },
      isExact: false,
      url: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/etcd/etcdclusters/my-etcd`,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/:name`,
    };
  });

  it('uses the resources defined in the CSV', () => {
    const resourceComponent = shallow(
      <Resources
        match={match}
        clusterServiceVersion={testClusterServiceVersion}
        obj={testResourceInstance}
      />,
    );

    expect(resourceComponent.props().resources).toEqual(
      testClusterServiceVersion.spec.customresourcedefinitions.owned[0].resources.map(
        (resource) => ({ kind: resource.kind, namespaced: true, prop: 'Pod' }),
      ),
    );
  });

  it('uses the default resources if the kind is not found in the CSV', () => {
    const resourceComponent = shallow(
      <Resources match={match} clusterServiceVersion={null} obj={testResourceInstance} />,
    );
    expect(resourceComponent.props().resources.length > 5).toEqual(true);
  });
});

describe(OperandDetailsPage.displayName, () => {
  let wrapper: ReactWrapper<OperandDetailsPageProps>;
  let match: RouterMatch<any>;

  beforeEach(() => {
    match = {
      params: {
        appName: 'testapp',
        plural: 'testapp.coreos.com~v1alpha1~TestResource',
        name: 'my-test-resource',
        ns: 'default',
      },
      isExact: false,
      url: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com~v1alpha1~TestResource/my-test-resource`,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/:name`,
    };

    wrapper = mount(<OperandDetailsPage match={match} />, {
      wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  });

  it('renders a `DetailsPage` with the correct subpages', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.props().pages[0].nameKey).toEqual(`${i18nNS}~Details`);
    expect(detailsPage.props().pages[0].href).toEqual('');
    expect(detailsPage.props().pages[1].nameKey).toEqual(`${i18nNS}~YAML`);
    expect(detailsPage.props().pages[1].href).toEqual('yaml');
    expect(detailsPage.props().pages[2].name).toEqual('Resources');
    expect(detailsPage.props().pages[2].href).toEqual('resources');
  });

  it('renders a `DetailsPage` which also watches the parent CSV', () => {
    expect(wrapper.find(DetailsPage).prop('resources')[0]).toEqual({
      kind: k8sModels.referenceForModel(ClusterServiceVersionModel),
      name: match.params.appName,
      namespace: match.params.ns,
      isList: false,
      prop: 'csv',
    });
  });

  it('menu actions to `DetailsPage`', () => {
    expect(
      wrapper
        .find(DetailsPage)
        .props()
        .menuActions[0](testModel, testOwnedResourceInstance).labelKey,
    ).toEqual('olm~Edit {{item}}');
    expect(
      wrapper
        .find(DetailsPage)
        .props()
        .menuActions[1](testModel, testOwnedResourceInstance).labelKey,
    ).toEqual('olm~Delete {{item}}');
  });

  it('passes function to create breadcrumbs for resource to `DetailsPage`', () => {
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
    match.params = Object.keys(match.params).reduce(
      (params, name) => Object.assign(params, { [name]: 'example' }),
      {},
    );
    match.url = `/k8s/ns/${ClusterServiceVersionModel.plural}/example/example/example`;
    wrapper.setProps({ match });

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
      { name: 'example', path: `/k8s/ns/${ClusterServiceVersionModel.plural}/example/example` },
      {
        name: `example details`,
        path: `/k8s/ns/${ClusterServiceVersionModel.plural}/example/example/example`,
      },
    ]);
  });

  it('passes `flatten` function to Resources component which returns only objects with `ownerReferences` to each other or parent object', () => {
    const resourceComponent = shallow(
      <Resources
        clusterServiceVersion={testClusterServiceVersion}
        obj={testResourceInstance}
        match={match}
      />,
    );
    const { flatten } = resourceComponent.find(MultiListPage).props();
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
  let wrapper: ShallowWrapper<ProvidedAPIsPageProps>;

  beforeAll(() => {
    // Since crd models have not been loaded into redux state, just force return of the correct model type
    spyOn(k8sModels, 'modelFor').and.returnValue(testModel);
  });

  beforeEach(() => {
    wrapper = shallow(<ProvidedAPIsPage obj={testClusterServiceVersion} />);
  });

  it('renders a `StatusBox` if given app has no owned or required custom resources', () => {
    const obj = _.cloneDeep(testClusterServiceVersion);
    obj.spec.customresourcedefinitions = {};
    wrapper.setProps({ obj });

    expect(wrapper.find(MultiListPage).exists()).toBe(false);
    expect(wrapper.find(StatusBox).props().loaded).toBe(true);
    expect(wrapper.find(StatusBox).props().EmptyMsg).toBeDefined();
  });

  it('renders a `MultiListPage` with correct props', () => {
    const { owned = [], required = [] } = testClusterServiceVersion.spec.customresourcedefinitions;
    const listPage = wrapper.find(MultiListPage);

    expect(listPage.props().ListComponent).toEqual(OperandList);
    expect(listPage.props().filterLabel).toEqual('Resources by name');
    expect(listPage.props().canCreate).toBe(true);
    expect(listPage.props().resources).toEqual(
      owned.concat(required).map((crdDesc) => ({
        kind: referenceForProvidedAPI(crdDesc),
        namespaced: true,
        prop: crdDesc.kind,
      })),
    );
    expect(listPage.props().namespace).toEqual(testClusterServiceVersion.metadata.namespace);
  });

  it('passes `createProps` for dropdown create button if app has multiple owned CRDs', () => {
    const obj = _.cloneDeep(testClusterServiceVersion);
    obj.spec.customresourcedefinitions.owned.push({
      name: 'foobars.testapp.coreos.com',
      displayName: 'Foo Bars',
      version: 'v1',
      kind: 'FooBar',
    });
    wrapper.setProps({ obj });
    const listPage = wrapper.find(MultiListPage);

    expect(listPage.props().createButtonText).toEqual('Create new');
    expect(listPage.props().createProps.to).not.toBeDefined();
    expect(listPage.props().createProps.items).toEqual({
      'testresources.testapp.coreos.com': 'Test Resource',
      'foobars.testapp.coreos.com': 'Foo Bars',
    });
    expect(
      listPage.props().createProps.createLink(obj.spec.customresourcedefinitions.owned[0].name),
    ).toEqual(
      `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com~v1alpha1~TestResource/~new`,
    );
  });

  it('passes `createProps` for single create button if app has only one owned CRD', () => {
    const listPage = wrapper.find(MultiListPage);

    expect(listPage.props().createButtonText).toEqual('Create Test Resource');
    expect(listPage.props().createProps.items).not.toBeDefined();
    expect(listPage.props().createProps.createLink).not.toBeDefined();
    expect(listPage.props().createProps.to).toEqual(
      `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com~v1alpha1~TestResource/~new`,
    );
  });

  it('passes `flatten` function which removes `required` resources with owner references to items not in the same list', () => {
    const otherResourceInstance = _.cloneDeep(testOwnedResourceInstance);
    otherResourceInstance.metadata.ownerReferences[0].uid = 'abfcd938-b991-11e7-845d-0eb774f2814a';
    const resources: FirehoseResourcesResult = {
      TestOwnedResource: {
        data: [testOwnedResourceInstance, otherResourceInstance],
        loaded: true,
        loadError: undefined,
      },
      TestResource: {
        data: [testResourceInstance],
        loaded: true,
        loadError: undefined,
      },
    };

    const { flatten } = wrapper.find(MultiListPage).props();
    const data = flatten(resources);

    expect(data.length).toEqual(2);
  });
});

describe(ProvidedAPIPage.displayName, () => {
  let wrapper: ShallowWrapper<ProvidedAPIPageProps>;

  it('does not allow creation if "create" not included in the verbs for the model', () => {
    wrapper = shallow(
      <ProvidedAPIPage kind="TestResourceRO" csv={testClusterServiceVersion} namespace="foo" />,
    );

    expect(wrapper.find(ListPage).props().canCreate).toBe(false);
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

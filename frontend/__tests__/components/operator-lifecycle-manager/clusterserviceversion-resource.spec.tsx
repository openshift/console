import * as React from 'react';
import { match as RouterMatch } from 'react-router-dom';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash-es';
import { ClusterServiceVersionResourceList, ClusterServiceVersionResourceListProps, ProvidedAPIsPage, ProvidedAPIsPageProps, CSVRTableRowProps, CSVRTableHeader, CSVRTableRow, ClusterServiceVersionResourceDetails, ClusterServiceVersionResourcesDetailsPageProps, ClusterServiceVersionResourcesDetailsProps, ClusterServiceVersionResourcesDetailsPage, ClusterServiceVersionResourceLink, ProvidedAPIPage, ProvidedAPIPageProps } from '../../../public/components/operator-lifecycle-manager/clusterserviceversion-resource';
import { Resources } from '../../../public/components/operator-lifecycle-manager/k8s-resource';
import { ClusterServiceVersionResourceKind, referenceForProvidedAPI } from '../../../public/components/operator-lifecycle-manager';
import { StatusDescriptor } from '../../../public/components/operator-lifecycle-manager/descriptors/status';
import { SpecDescriptor } from '../../../public/components/operator-lifecycle-manager/descriptors/spec';
import { testCRD, testResourceInstance, testClusterServiceVersion, testOwnedResourceInstance, testModel } from '../../../__mocks__/k8sResourcesMocks';
import { Table, DetailsPage, MultiListPage, ListPage } from '../../../public/components/factory';
import { Timestamp, LabelList, StatusBox, ResourceKebab } from '../../../public/components/utils';
import { referenceFor, K8sKind, referenceForModel } from '../../../public/module/k8s';
import { ClusterServiceVersionModel } from '../../../public/models';

describe(CSVRTableHeader.displayName, () => {
  it('returns column header definition for resource', () => {
    expect(Array.isArray(CSVRTableHeader()));
  });
});

describe(CSVRTableRow.displayName, () => {
  let wrapper: ShallowWrapper<CSVRTableRowProps>;

  beforeEach(() => {
    wrapper = shallow(<CSVRTableRow obj={testResourceInstance} index={0} style={{}} />);
  });

  it('renders column for resource name', () => {
    const col = wrapper.childAt(0);
    const link = col.find(ClusterServiceVersionResourceLink);

    expect(link.props().obj).toEqual(testResourceInstance);
  });

  it('renders a `ResourceKebab` for resource actions', () => {
    const kebab = wrapper.find(ResourceKebab);

    expect(kebab.props().actions[0](testModel, testOwnedResourceInstance).label).toEqual(`Edit ${testModel.label}`);
    expect(kebab.props().actions[1](testModel, testOwnedResourceInstance).label).toEqual(`Delete ${testModel.label}`);
    expect(kebab.props().kind).toEqual(referenceFor(testResourceInstance));
    expect(kebab.props().resource).toEqual(testResourceInstance);
  });

  it('renders column for resource labels', () => {
    const col = wrapper.childAt(1);
    const labelList = col.find(LabelList);

    expect(labelList.props().kind).toEqual(testResourceInstance.kind);
    expect(labelList.props().labels).toEqual(testResourceInstance.metadata.labels);
  });

  it('renders column for resource type', () => {
    const col = wrapper.childAt(2);

    expect(col.shallow().text()).toEqual(testResourceInstance.kind);
  });

  it('renders column for resource status', () => {
    const col = wrapper.childAt(3);

    expect(col.shallow().text()).toEqual('Unknown');
  });

  it('renders column for resource status if unknown', () => {
    const obj = _.cloneDeep(testResourceInstance);
    obj.status = null;
    wrapper.setProps({obj});
    const col = wrapper.childAt(3);

    expect(col.shallow().text()).toEqual('Unknown');
  });

  it('renders column for resource version', () => {
    const col = wrapper.childAt(4);

    expect(col.shallow().text()).toEqual(testResourceInstance.spec.version || 'Unknown');
  });

  it('renders column for last updated timestamp', () => {
    const col = wrapper.childAt(5);
    const timestamp = col.find(Timestamp);

    expect(timestamp.props().timestamp).toEqual(testResourceInstance.metadata.creationTimestamp);
  });
});

describe(ClusterServiceVersionResourceList.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionResourceListProps>;
  let resources: ClusterServiceVersionResourceKind[];

  beforeEach(() => {
    resources = [testResourceInstance];
    wrapper = shallow(<ClusterServiceVersionResourceList loaded={true} data={resources} filters={{}} />);
  });

  it('renders a `Table` of the custom resource instances of the given kind', () => {
    const table: ShallowWrapper<any> = wrapper.find(Table);
    expect(Object.keys(wrapper.props()).reduce((k, prop) => table.prop(prop) === wrapper.prop(prop), false)).toBe(true);
    expect(table.props().Header).toEqual(CSVRTableHeader);
    expect(table.props().Row).toEqual(CSVRTableRow);
  });
});

describe(ClusterServiceVersionResourceDetails.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionResourcesDetailsProps>;
  let resourceDefinition: any;

  beforeEach(() => {
    resourceDefinition = {
      path: testCRD.metadata.name.split('.')[0],
      annotations: testCRD.metadata.annotations,
    };
    wrapper = shallow(<ClusterServiceVersionResourceDetails.WrappedComponent clusterServiceVersion={testClusterServiceVersion} obj={testResourceInstance} kindObj={resourceDefinition} appName={testClusterServiceVersion.metadata.name} />);
  });

  it('renders description title', () => {
    const title = wrapper.find('.co-section-heading');
    expect(title.text()).toEqual('Test Resource Overview');
  });

  it('renders info section', () => {
    const section = wrapper.find('.co-clusterserviceversion-resource-details__section--info');

    expect(section.exists()).toBe(true);
  });

  it('does not render filtered status fields', () => {
    const crd = testClusterServiceVersion.spec.customresourcedefinitions.owned.find(c => c.name === 'testresource.testapp.coreos.com');
    const filteredDescriptor = crd.statusDescriptors.find((sd) => sd.path === 'importantMetrics');
    const statusView = wrapper.find(StatusDescriptor).filterWhere(node => node.props().descriptor === filteredDescriptor);

    expect(statusView.exists()).toBe(false);
  });

  it('does not render any spec descriptor fields if there are none defined on the `ClusterServiceVersion`', () => {
    const clusterServiceVersion = _.cloneDeep(testClusterServiceVersion);
    clusterServiceVersion.spec.customresourcedefinitions.owned = [];
    wrapper = wrapper.setProps({clusterServiceVersion});

    expect(wrapper.find(SpecDescriptor).length).toEqual(0);
  });

  it('renders spec descriptor fields if the custom resource is `owned`', () => {
    expect(wrapper.find(SpecDescriptor).length).toEqual(1);
  });

  it('renders spec descriptor fields if the custom resource is `required`', () => {
    const clusterServiceVersion = _.cloneDeep(testClusterServiceVersion);
    clusterServiceVersion.spec.customresourcedefinitions.required = _.cloneDeep(clusterServiceVersion.spec.customresourcedefinitions.owned);
    clusterServiceVersion.spec.customresourcedefinitions.owned = [];
    wrapper = wrapper.setProps({clusterServiceVersion});

    expect(wrapper.find(SpecDescriptor).length).toEqual(1);
  });
});

describe('ResourcesList', () => {
  it('uses the resources defined in the CSV', () => {
    const kindObj: K8sKind = {
      abbr: '',
      apiVersion: 'v1',
      kind: testClusterServiceVersion.spec.customresourcedefinitions.owned[0].kind,
      path: testClusterServiceVersion.spec.customresourcedefinitions.owned[0].name.split('.')[0],
      label: '',
      labelPlural: '',
      plural: '',
    };

    const resourceComponent = shallow(<Resources.WrappedComponent clusterServiceVersion={testClusterServiceVersion} kindObj={kindObj} obj={testResourceInstance} />);
    expect(resourceComponent.props().resources).toEqual(testClusterServiceVersion.spec.customresourcedefinitions.owned[0].resources.map((resource) => ({ kind: resource.kind, namespaced: true })));
  });

  it('uses the default resources if the kind is not found in the CSV', () => {
    const resourceComponent = shallow(<Resources.WrappedComponent clusterServiceVersion={null} kindObj={null} obj={testResourceInstance} />);
    expect(resourceComponent.props().resources.length > 5).toEqual(true);
  });
});

describe(ClusterServiceVersionResourcesDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionResourcesDetailsPageProps>;
  let match: RouterMatch<any>;

  beforeEach(() => {
    match = {
      params: {appName: 'etcd', plural: 'etcdclusters', name: 'my-etcd', ns: 'default'},
      isExact: false,
      url: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/etcd/etcdclusters/my-etcd`,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/:name`,
    };

    wrapper = shallow(<ClusterServiceVersionResourcesDetailsPage kind={referenceFor(testResourceInstance)} namespace="default" name={testResourceInstance.metadata.name} match={match} />);
  });

  it('renders a `DetailsPage` with the correct subpages', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.props().pages[0].name).toEqual('Overview');
    expect(detailsPage.props().pages[0].href).toEqual('');
    expect(detailsPage.props().pages[1].name).toEqual('YAML');
    expect(detailsPage.props().pages[1].href).toEqual('yaml');
    expect(detailsPage.props().pages[2].name).toEqual('Resources');
    expect(detailsPage.props().pages[2].href).toEqual('resources');
  });

  it('renders a `DetailsPage` which also watches the parent CSV', () => {
    expect(wrapper.find(DetailsPage).props().resources).toEqual([
      {kind: referenceForModel(ClusterServiceVersionModel), name: match.params.appName, namespace: match.params.ns, isList: false, prop: 'csv'},
    ]);
  });

  it('menu actions to `DetailsPage`', () => {
    expect(wrapper.find(DetailsPage).props().menuActions[0](testModel, testOwnedResourceInstance).label).toEqual(`Edit ${testModel.label}`);
    expect(wrapper.find(DetailsPage).props().menuActions[1](testModel, testOwnedResourceInstance).label).toEqual(`Delete ${testModel.label}`);
  });

  it('passes function to create breadcrumbs for resource to `DetailsPage`', () => {
    expect(wrapper.find(DetailsPage).props().breadcrumbsFor(null)).toEqual([
      {name: 'etcd', path: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/etcd/etcdclusters`},
      {name: `${testResourceInstance.kind} Details`, path: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/etcd/etcdclusters/my-etcd`},
    ]);
  });

  it('creates correct breadcrumbs even if `namespace`, `plural`, `appName`, and `name` URL parameters are the same', () => {
    match.params = Object.keys(match.params).reduce((params, name) => Object.assign(params, {[name]: 'example'}), {});
    match.url = `/k8s/ns/${ClusterServiceVersionModel.plural}/example/example/example`;
    wrapper.setProps({match});

    expect(wrapper.find(DetailsPage).props().breadcrumbsFor(null)).toEqual([
      {name: 'example', path: `/k8s/ns/${ClusterServiceVersionModel.plural}/example/example`},
      {name: `${testResourceInstance.kind} Details`, path: `/k8s/ns/${ClusterServiceVersionModel.plural}/example/example/example`},
    ]);
  });

  it('passes `flatten` function to Resources component which returns only objects with `ownerReferences` to each other or parent object', () => {
    const resourceComponent = shallow(<Resources.WrappedComponent clusterServiceVersion={testClusterServiceVersion} kindObj={null} obj={testResourceInstance} />);
    const flatten = resourceComponent.find(MultiListPage).props().flatten;
    const pod = {
      kind: 'Pod',
      metadata: {
        uid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        ownerReferences: [{uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}],
      },
    };
    const deployment = {
      kind: 'Deployment',
      metadata: {
        uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        ownerReferences: [{uid: testResourceInstance.metadata.uid}],
      },
    };
    const secret = {
      kind: 'Secret',
      metadata: {uid: 'cccccccc-cccc-cccc-cccc-cccccccccccc'},
    };
    const resources = {
      Deployment: {data: [deployment]},
      Secret: {data: [secret]},
      Pod: {data: [pod]},
    };
    const data = flatten(resources);

    expect(data.map(obj => obj.metadata.uid)).not.toContain(secret.metadata.uid);
    expect(data.map(obj => obj.metadata.uid)).toContain(pod.metadata.uid);
    expect(data.map(obj => obj.metadata.uid)).toContain(deployment.metadata.uid);
  });
});

describe(ProvidedAPIsPage.displayName, () => {
  let wrapper: ShallowWrapper<ProvidedAPIsPageProps>;

  beforeEach(() => {
    wrapper = shallow(<ProvidedAPIsPage.WrappedComponent obj={testClusterServiceVersion} />);
  });

  it('renders a `StatusBox` if given app has no owned or required custom resources', () => {
    const obj = _.cloneDeep(testClusterServiceVersion);
    obj.spec.customresourcedefinitions = {};
    wrapper.setProps({obj});

    expect(wrapper.find(MultiListPage).exists()).toBe(false);
    expect(wrapper.find(StatusBox).props().loaded).toBe(true);
    expect(wrapper.find(StatusBox).props().EmptyMsg).toBeDefined();
  });

  it('renders a `MultiListPage` with correct props', () => {
    const {owned = [], required = []} = testClusterServiceVersion.spec.customresourcedefinitions;
    const listPage = wrapper.find(MultiListPage);

    expect(listPage.props().ListComponent).toEqual(ClusterServiceVersionResourceList);
    expect(listPage.props().filterLabel).toEqual('Resources by name');
    expect(listPage.props().canCreate).toBe(true);
    expect(listPage.props().resources).toEqual(owned.concat(required).map((crdDesc) => ({
      kind: referenceForProvidedAPI(crdDesc),
      namespaced: true,
      prop: crdDesc.kind,
    })));
    expect(listPage.props().namespace).toEqual(testClusterServiceVersion.metadata.namespace);
  });

  it('passes `createProps` for dropdown create button if app has multiple owned CRDs', () => {
    const obj = _.cloneDeep(testClusterServiceVersion);
    obj.spec.customresourcedefinitions.owned.push({name: 'foobars.testapp.coreos.com', displayName: 'Foo Bars', version: 'v1', kind: 'FooBar'});
    wrapper.setProps({obj});
    const listPage = wrapper.find(MultiListPage);

    expect(listPage.props().createButtonText).toEqual('Create New');
    expect(listPage.props().createProps.to).not.toBeDefined();
    expect(listPage.props().createProps.items).toEqual({'testresource.testapp.coreos.com': 'Test Resource', 'foobars.testapp.coreos.com': 'Foo Bars'});
    expect(listPage.props().createProps.createLink(obj.spec.customresourcedefinitions.owned[0].name)).toEqual(`/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com~v1~TestResource/~new`);
  });

  it('passes `createProps` for single create button if app has only one owned CRD', () => {
    const listPage = wrapper.find(MultiListPage);

    expect(listPage.props().createButtonText).toEqual(`Create ${testClusterServiceVersion.spec.customresourcedefinitions.owned[0].displayName}`);
    expect(listPage.props().createProps.items).not.toBeDefined();
    expect(listPage.props().createProps.createLink).not.toBeDefined();
    expect(listPage.props().createProps.to).toEqual(`/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com~v1~TestResource/~new`);
  });

  it('passes `flatten` function which removes `required` resources with owner references to items not in the same list', () => {
    const otherResourceInstance = _.cloneDeep(testOwnedResourceInstance);
    otherResourceInstance.metadata.ownerReferences[0].uid = 'abfcd938-b991-11e7-845d-0eb774f2814a';
    const resources = {
      TestOwnedResource: {
        data: [testOwnedResourceInstance, otherResourceInstance],
      },
      TestResource: {
        data: [testResourceInstance],
      },
    };

    const flatten = wrapper.find(MultiListPage).props().flatten;
    const data = flatten(resources);

    expect(data.length).toEqual(2);
  });
});

describe(ProvidedAPIPage.displayName, () => {
  let wrapper: ShallowWrapper<ProvidedAPIPageProps>;

  it('does not allow creation if "create" not included in the verbs for the model', () => {
    const readonlyModel = _.cloneDeep(testModel);
    readonlyModel.verbs = ['get'];
    wrapper = shallow(<ProvidedAPIPage.WrappedComponent kindObj={readonlyModel} kind={referenceForModel(readonlyModel)} csv={testClusterServiceVersion} />);

    expect(wrapper.find(ListPage).props().canCreate).toBe(false);
  });
});

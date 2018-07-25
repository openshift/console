/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { match as RouterMatch } from 'react-router-dom';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash-es';

import { ClusterServiceVersionResourceList, ClusterServiceVersionResourceListProps, ClusterServiceVersionResourcesPage, ClusterServiceVersionResourcesPageProps, ClusterServiceVersionResourceHeaderProps, ClusterServiceVersionResourcesDetailsState, ClusterServiceVersionResourceRowProps, ClusterServiceVersionResourceHeader, ClusterServiceVersionResourceRow, ClusterServiceVersionResourceDetails, ClusterServiceVersionPrometheusGraph, ClusterServiceVersionResourcesDetailsPageProps, ClusterServiceVersionResourcesDetailsProps, ClusterServiceVersionResourcesDetailsPage, PrometheusQueryTypes, ClusterServiceVersionResourceLink } from '../../../public/components/cloud-services/clusterserviceversion-resource';
import { Resources } from '../../../public/components/cloud-services/k8s-resource';
import { ClusterServiceVersionResourceKind } from '../../../public/components/cloud-services';
import { ClusterServiceVersionResourceStatus } from '../../../public/components/cloud-services/status-descriptors';
import { ClusterServiceVersionResourceSpec } from '../../../public/components/cloud-services/spec-descriptors';
import { testClusterServiceVersionResource, testResourceInstance, testClusterServiceVersion, testOwnedResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import { List, ColHead, ListHeader, DetailsPage, MultiListPage } from '../../../public/components/factory';
import { Timestamp, LabelList, ResourceSummary, StatusBox, ResourceCog, Cog } from '../../../public/components/utils';
import { Gauge, Scalar, Line, Bar } from '../../../public/components/graphs';
import { referenceFor, K8sKind, referenceForModel } from '../../../public/module/k8s';
import { ClusterServiceVersionModel } from '../../../public/models';

describe(ClusterServiceVersionResourceHeader.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionResourceHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionResourceHeader data={[]} />);
  });

  it('renders column header for resource name', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(0);

    expect(colHeader.props().sortField).toEqual('metadata.name');
    expect(colHeader.childAt(0).text()).toEqual('Name');
  });

  it('renders column header for resource labels', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(1);

    expect(colHeader.props().sortField).toEqual('metadata.labels');
    expect(colHeader.childAt(0).text()).toEqual('Labels');
  });

  it('renders column header for resource type', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(2);

    expect(colHeader.props().sortField).toEqual('kind');
    expect(colHeader.childAt(0).text()).toEqual('Type');
  });

  it('renders column header for resource status', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(3);

    expect(colHeader.childAt(0).text()).toEqual('Status');
  });

  it('renders column header for resource version', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(4);

    expect(colHeader.childAt(0).text()).toEqual('Version');
  });

  it('renders column header for last updated timestamp', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(5);

    expect(colHeader.childAt(0).text()).toEqual('Last Updated');
  });
});

describe(ClusterServiceVersionResourceRow.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionResourceRowProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionResourceRow obj={testResourceInstance} />);
  });

  it('renders column for resource name', () => {
    const col = wrapper.childAt(0);
    const link = col.find(ClusterServiceVersionResourceLink);

    expect(link.props().obj).toEqual(testResourceInstance);
  });

  it('renders a `ResourceCog` for common actions', () => {
    const col = wrapper.childAt(0);
    const cog = col.find(ResourceCog);

    expect(cog.props().actions).toEqual(Cog.factory.common);
    expect(cog.props().kind).toEqual(referenceFor(testResourceInstance));
    expect(cog.props().resource).toEqual(testResourceInstance);
  });

  it('renders column for resource labels', () => {
    const col = wrapper.childAt(1);
    const labelList = col.find(LabelList);

    expect(labelList.props().kind).toEqual(testResourceInstance.kind);
    expect(labelList.props().labels).toEqual(testResourceInstance.metadata.labels);
  });

  it('renders column for resource type', () => {
    const col = wrapper.childAt(2);

    expect(col.text()).toEqual(testResourceInstance.kind);
  });

  it('renders column for resource status', () => {
    const col = wrapper.childAt(3);

    expect(col.text()).toEqual('Unknown');
  });

  it('renders column for resource status if unknown', () => {
    let obj = _.cloneDeep(testResourceInstance);
    obj.status = null;
    wrapper.setProps({obj});
    const col = wrapper.childAt(3);

    expect(col.text()).toEqual('Unknown');
  });

  it('renders column for resource version', () => {
    const col = wrapper.childAt(4);

    expect(col.text()).toEqual(testResourceInstance.spec.version || 'Unknown');
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

  it('renders a `List` of the custom resource instances of the given kind', () => {
    const list: ShallowWrapper<any> = wrapper.find(List);

    expect(Object.keys(wrapper.props()).reduce((k, prop) => list.prop(prop) === wrapper.prop(prop), false)).toBe(true);
    expect(list.props().Header).toEqual(ClusterServiceVersionResourceHeader);
    expect(list.props().Row).toEqual(ClusterServiceVersionResourceRow);
  });
});

describe(ClusterServiceVersionResourceDetails.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionResourcesDetailsProps, ClusterServiceVersionResourcesDetailsState>;
  let resourceDefinition: any;

  beforeEach(() => {
    resourceDefinition = {
      path: testClusterServiceVersionResource.metadata.name.split('.')[0],
      annotations: testClusterServiceVersionResource.metadata.annotations,
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

  it('renders creation date from CRD metadata', () => {
    expect(wrapper.find(Timestamp).props().timestamp).toEqual(testResourceInstance.metadata.creationTimestamp);
  });

  it('does not render filtered status fields', () => {
    const crd = testClusterServiceVersion.spec.customresourcedefinitions.owned.find(c => c.name === 'testresource.testapp.coreos.com');
    const filteredDescriptor = crd.statusDescriptors.find((sd) => sd.path === 'importantMetrics');

    wrapper.setState({expanded: false});
    const statusView = wrapper.find(ClusterServiceVersionResourceStatus).filterWhere(node => node.props().statusDescriptor === filteredDescriptor);

    expect(statusView.exists()).toBe(false);
  });

  it('renders the specified important prometheus metrics as graphs', () => {
    wrapper.setState({expanded: false});
    const metric = wrapper.find('.co-clusterserviceversion-resource-details__section__metric');

    expect(metric.exists()).toBe(true);
  });

  it('does not render the extended information unless in expanded mode', () => {
    expect(wrapper.find(ResourceSummary).exists()).toBe(false);
  });

  it('renders the extended information when in expanded mode', () => {
    wrapper.setState({expanded: true});

    expect(wrapper.find(ResourceSummary).exists()).toBe(true);
  });

  it('does not render the non-filled in status field when in expanded mode', () => {
    const crd = testClusterServiceVersion.spec.customresourcedefinitions.owned.find(c => c.name === 'testresource.testapp.coreos.com');
    const unfilledDescriptor = crd.statusDescriptors.find((sd) => sd.path === 'some-unfilled-path');
    const statusView = wrapper.find(ClusterServiceVersionResourceStatus).filterWhere(node => node.props().statusDescriptor === unfilledDescriptor);

    expect(statusView.exists()).toBe(false);
  });

  it('renders the non-filled in status field when in expanded mode', () => {
    const crd = testClusterServiceVersion.spec.customresourcedefinitions.owned.find(c => c.name === 'testresource.testapp.coreos.com');
    const unfilledDescriptor = crd.statusDescriptors.find((sd) => sd.path === 'some-unfilled-path');

    wrapper.setState({expanded: true});
    const statusView = wrapper.find(ClusterServiceVersionResourceStatus).filterWhere(node => node.props().statusDescriptor === unfilledDescriptor);

    expect(statusView.exists()).toBe(true);
  });

  it('does not render any spec descriptor fields if there are none defined on the `ClusterServiceVersion`', () => {
    let clusterServiceVersion = _.cloneDeep(testClusterServiceVersion);
    clusterServiceVersion.spec.customresourcedefinitions.owned = [];
    wrapper = wrapper.setProps({clusterServiceVersion});

    expect(wrapper.find(ClusterServiceVersionResourceSpec).length).toEqual(0);
  });

  it('renders spec descriptor fields if the custom resource is `owned`', () => {
    expect(wrapper.find(ClusterServiceVersionResourceSpec).length).toEqual(1);
  });

  it('renders spec descriptor fields if the custom resource is `required`', () => {
    let clusterServiceVersion = _.cloneDeep(testClusterServiceVersion);
    clusterServiceVersion.spec.customresourcedefinitions.required = _.cloneDeep(clusterServiceVersion.spec.customresourcedefinitions.owned);
    clusterServiceVersion.spec.customresourcedefinitions.owned = [];
    wrapper = wrapper.setProps({clusterServiceVersion});

    expect(wrapper.find(ClusterServiceVersionResourceSpec).length).toEqual(1);
  });
});

describe(ClusterServiceVersionPrometheusGraph.displayName, () => {

  it('renders a counter', () => {
    const query = {
      'name': 'foo',
      'unit': 'blargs',
      'query': 'somequery',
      'type': PrometheusQueryTypes.Counter,
    };
    const wrapper = shallow(<ClusterServiceVersionPrometheusGraph query={query} />);

    expect(wrapper.is(Scalar)).toBe(true);
  });

  it('renders a gauge', () => {
    const query = {
      'name': 'foo',
      'query': 'somequery',
      'type': PrometheusQueryTypes.Gauge,
    };
    const wrapper = shallow(<ClusterServiceVersionPrometheusGraph query={query} />);

    expect(wrapper.is(Gauge)).toBe(true);
  });

  it('renders a line', () => {
    const query = {
      'name': 'foo',
      'query': 'somequery',
      'type': PrometheusQueryTypes.Line,
    };
    const wrapper = shallow(<ClusterServiceVersionPrometheusGraph query={query} />);

    expect(wrapper.is(Line)).toBe(true);
  });

  it('renders a bar', () => {
    const query = {
      'name': 'foo',
      'query': 'somequery',
      'type': PrometheusQueryTypes.Bar,
    };
    const wrapper = shallow(<ClusterServiceVersionPrometheusGraph query={query} />);

    expect(wrapper.is(Bar)).toBe(true);
  });

  it('handles unknown kinds of metrics', () => {
    const query: any = {
      'name': 'foo',
      'query': 'somequery',
      'type': 'unknown',
    };
    const wrapper = shallow(<ClusterServiceVersionPrometheusGraph query={query} />);

    expect(wrapper.html()).toBe('<span>Unknown graph type: unknown</span>');
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
      {kind: referenceForModel(ClusterServiceVersionModel), name: match.params.appName, namespace: match.params.ns, isList: false, prop: 'csv'}
    ]);
  });

  it('passes common menu actions to `DetailsPage`', () => {
    expect(wrapper.find(DetailsPage).props().menuActions).toEqual(Cog.factory.common);
  });

  it('passes function to create breadcrumbs for resource to `DetailsPage`', () => {
    expect(wrapper.find(DetailsPage).props().breadcrumbsFor(null)).toEqual([
      {name: 'etcd', path: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/etcd/instances`},
      {name: `${testResourceInstance.kind} Details`, path: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/etcd/etcdclusters/my-etcd`},
    ]);
  });

  it('creates correct breadcrumbs even if `namespace`, `plural`, `appName`, and `name` URL parameters are the same', () => {
    match.params = Object.keys(match.params).reduce((params, name) => Object.assign(params, {[name]: 'example'}), {});
    match.url = `/k8s/ns/${ClusterServiceVersionModel.plural}/example/example/example`;
    wrapper.setProps({match});

    expect(wrapper.find(DetailsPage).props().breadcrumbsFor(null)).toEqual([
      {name: 'example', path: `/k8s/ns/${ClusterServiceVersionModel.plural}/example/example/instances`},
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
        ownerReferences: [{uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}]
      }
    };
    const deployment = {
      kind: 'Deployment',
      metadata: {
        uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        ownerReferences: [{uid: testResourceInstance.metadata.uid}]
      }
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

describe(ClusterServiceVersionResourcesPage.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionResourcesPageProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionResourcesPage.WrappedComponent obj={testClusterServiceVersion} />);
  });

  it('renders a `StatusBox` if given app has no owned or required custom resources', () => {
    let obj = _.cloneDeep(testClusterServiceVersion);
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
      kind: `${crdDesc.name.slice(crdDesc.name.indexOf('.') + 1)}:${crdDesc.version}:${crdDesc.kind}`,
      namespaced: true,
      prop: crdDesc.kind,
    })));
    expect(listPage.props().namespace).toEqual(testClusterServiceVersion.metadata.namespace);
  });

  it('passes `createProps` for dropdown create button if app has multiple owned CRDs', () => {
    let obj = _.cloneDeep(testClusterServiceVersion);
    obj.spec.customresourcedefinitions.owned.push({name: 'foobars.testapp.coreos.com', displayName: 'Foo Bars', version: 'v1', kind: 'FooBar'});
    wrapper.setProps({obj});
    const listPage = wrapper.find(MultiListPage);

    expect(listPage.props().createButtonText).toEqual('Create New');
    expect(listPage.props().createProps.to).not.toBeDefined();
    expect(listPage.props().createProps.items).toEqual({'testresource.testapp.coreos.com': 'Test Resource', 'foobars.testapp.coreos.com': 'Foo Bars'});
    expect(listPage.props().createProps.createLink(obj.spec.customresourcedefinitions.owned[0].name)).toEqual(`/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com:v1:TestResource/new`);
  });

  it('passes `createProps` for single create button if app has only one owned CRD', () => {
    const listPage = wrapper.find(MultiListPage);

    expect(listPage.props().createButtonText).toEqual(`Create ${testClusterServiceVersion.spec.customresourcedefinitions.owned[0].displayName}`);
    expect(listPage.props().createProps.items).not.toBeDefined();
    expect(listPage.props().createProps.createLink).not.toBeDefined();
    expect(listPage.props().createProps.to).toEqual(`/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com:v1:TestResource/new`);
  });

  it('passes `flatten` function which removes `required` resources with owner references to items not in the same list', () => {
    let otherResourceInstance = _.cloneDeep(testOwnedResourceInstance);
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

/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';

import { AppTypeResourceList, AppTypeResourceListProps, AppTypeResourceHeaderProps, AppTypeResourcesDetailsState, AppTypeResourceRowProps, AppTypeResourceHeader, AppTypeResourceRow, AppTypeResourceDetails, AppTypePrometheusGraph, AppTypeResourcesDetailsPageProps, AppTypeResourcesDetailsProps, AppTypeResourceStatus, AppTypeResourcesDetailsPage, PrometheusQueryTypes } from '../../../public/components/cloud-services/apptype-resource';
import { AppTypeResourceKind, ALMStatusDescriptors } from '../../../public/components/cloud-services';
import { testAppTypeResource, testResourceInstance, testAppType } from '../../../__mocks__/k8sResourcesMocks';
import { List, ColHead, ListHeader, DetailsPage } from '../../../public/components/factory';
import { ResourceLink, Timestamp, LabelList, ResourceSummary } from '../../../public/components/utils';
import { Gauge, Scalar, Line, Bar } from '../../../public/components/graphs';

describe('AppTypeResourceHeader', () => {
  let wrapper: ShallowWrapper<AppTypeResourceHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<AppTypeResourceHeader data={[]} />);
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

describe('AppTypeResourceRow', () => {
  let wrapper: ShallowWrapper<AppTypeResourceRowProps>;

  beforeEach(() => {
    wrapper = shallow(<AppTypeResourceRow obj={testResourceInstance} />);
  });

  it('renders column for resource name', () => {
    const col = wrapper.childAt(0);
    const link = col.find(ResourceLink);

    expect(link.props().name).toEqual(testResourceInstance.metadata.name);
    expect(link.props().title).toEqual(testResourceInstance.metadata.name);
    expect(link.props().kind).toEqual(testResourceInstance.kind);
    expect(link.props().namespace).toEqual(testResourceInstance.metadata.namespace);
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

    expect(col.text()).toEqual('Running');
  });

  it('renders column for resource version', () => {
    const col = wrapper.childAt(4);

    expect(col.text()).toEqual(testResourceInstance.spec.version || 'None');
  });

  it('renders column for last updated timestamp', () => {
    const col = wrapper.childAt(5);
    const timestamp = col.find(Timestamp);

    expect(timestamp.props().timestamp).toEqual(testResourceInstance.metadata.creationTimestamp);
  });
});

describe('AppTypeResourceList', () => {
  let wrapper: ShallowWrapper<AppTypeResourceListProps>;
  let resources: AppTypeResourceKind[];

  beforeEach(() => {
    resources = [testResourceInstance];
    wrapper = shallow(<AppTypeResourceList loaded={true} data={resources} filters={{}} />);
  });

  it('renders a `List` of the custom resource instances of the given kind', () => {
    const list: ShallowWrapper<any> = wrapper.find(List);

    expect(list.exists()).toBe(true);
    expect(Object.keys(wrapper.props()).reduce((_, prop) => list.prop(prop) === wrapper.prop(prop), false)).toBe(true);
    expect(list.props().Header).toEqual(AppTypeResourceHeader);
    expect(list.props().Row).toEqual(AppTypeResourceRow);
  });
});

describe('AppTypeResourcesDetails', () => {
  let wrapper: ShallowWrapper<AppTypeResourcesDetailsProps, AppTypeResourcesDetailsState>;
  let resourceDefinition: any;

  beforeEach(() => {
    resourceDefinition = {
      path: testAppTypeResource.metadata.name.split('.')[0],
      annotations: testAppTypeResource.metadata.annotations,
    };
    // FIXME(alecmerdler): Remove this once https://github.com/DefinitelyTyped/DefinitelyTyped/pull/19672 is shipped
    const Component: React.StatelessComponent<AppTypeResourcesDetailsProps> = (AppTypeResourceDetails as any).WrappedComponent;
    wrapper = shallow(<Component obj={testResourceInstance} kindObj={resourceDefinition} kindsInFlight={false} />);
    wrapper.setState({
      'clusterServiceVersion': testAppType,
      'expanded': false,
    });
  });

  it('renders description title', () => {
    const title = wrapper.find('.co-section-title');
    expect(title.text()).toEqual('Test Resource Overview');
  });

  it('renders info section', () => {
    const section = wrapper.find('.co-apptype-resource-details__section--info');

    expect(section.exists()).toBe(true);
  });

  it('renders creation date from CRD metadata', () => {
    expect(wrapper.find(Timestamp).props().timestamp).toEqual(testResourceInstance.metadata.creationTimestamp);
  });

  it('renders link to search page with resource `spec.selector.matchLabels` in query parameter', () => {
    const matchLabels = testResourceInstance.spec.selector ? _.map(testResourceInstance.spec.selector.matchLabels, (val, key) => `${key}=${val}`) : [];
    const link: ShallowWrapper<any> = wrapper.findWhere(node => node.equals(<dt>Resources</dt>)).parent().find('dd').find(Link);

    expect(link.props().to).toEqual(`/ns/${testResourceInstance.metadata.namespace}/search?q=${matchLabels.map(pair => `${pair},`)}`);
    expect(link.props().title).toEqual('View resources');
  });

  it('renders the specified important prometheus metrics as graphs', () => {
    wrapper.setState({
      'clusterServiceVersion': testAppType,
      'expanded': false,
    });

    const metric = wrapper.find('.co-apptype-resource-details__section__metric');
    expect(metric.exists()).toBe(true);
  });

  it('does not render the extended information unless in expanded mode', () => {
    expect(wrapper.find(ResourceSummary).exists()).toBe(false);
  });

  it('renders the extended information when in expanded mode', () => {
    wrapper.setState({
      'clusterServiceVersion': null,
      'expanded': true,
    });

    expect(wrapper.find(ResourceSummary).exists()).toBe(true);
  });

  it('renders the filled in status field', () => {
    const value = testResourceInstance.status['some-filled-path'];
    const statusView = wrapper.find(AppTypeResourceStatus);
    expect(statusView.exists()).toBe(true);
    expect(statusView.props().statusValue).toEqual(value);
  });

  it('does not render the non-filled in status field when in expanded mode', () => {
    const crd = testAppType.spec.customresourcedefinitions.owned.find((crd) => {
      return crd.name === 'testresource.testapp.coreos.com';
    });

    const unfilledDescriptor = crd.statusDescriptors.find((sd) => {
      return sd.path === 'some-unfilled-path';
    });

    const statusView = wrapper.find(AppTypeResourceStatus).filterWhere(node => node.props().statusDescriptor === unfilledDescriptor);
    expect(statusView.exists()).toBe(false);
  });

  it('renders the non-filled in status field when in expanded mode', () => {
    wrapper.setState({
      'clusterServiceVersion': wrapper.state().clusterServiceVersion,
      'expanded': true,
    });

    const crd = testAppType.spec.customresourcedefinitions.owned.find((crd) => {
      return crd.name === 'testresource.testapp.coreos.com';
    });

    const unfilledDescriptor = crd.statusDescriptors.find((sd) => {
      return sd.path === 'some-unfilled-path';
    });

    const statusView = wrapper.find(AppTypeResourceStatus).filterWhere(node => node.props().statusDescriptor === unfilledDescriptor);
    expect(statusView.exists()).toBe(true);
  });

  it('does not render link to search page if `spec.selector.matchLabels` is not present on resource', () => {
    wrapper.setProps({obj: {...testResourceInstance, spec: {}}});

    expect(wrapper.findWhere(node => node.equals(<dt>Resources</dt>)).exists()).toBe(false);
  });
});

describe('AppTypePrometheusGraph', () => {
  it('renders a counter', () => {
    const query = {
      'name': 'foo',
      'unit': 'blargs',
      'query': 'somequery',
      'type': PrometheusQueryTypes.Counter,
    };

    const wrapper = shallow(<AppTypePrometheusGraph query={query} />);
    expect(wrapper.is(Scalar)).toBe(true);
  });

  it('renders a gauge', () => {
    const query = {
      'name': 'foo',
      'query': 'somequery',
      'type': PrometheusQueryTypes.Gauge,
    };

    const wrapper = shallow(<AppTypePrometheusGraph query={query} />);
    expect(wrapper.is(Gauge)).toBe(true);
  });

  it('renders a line', () => {
    const query = {
      'name': 'foo',
      'query': 'somequery',
      'type': PrometheusQueryTypes.Line,
    };

    const wrapper = shallow(<AppTypePrometheusGraph query={query} />);
    expect(wrapper.is(Line)).toBe(true);
  });

  it('renders a bar', () => {
    const query = {
      'name': 'foo',
      'query': 'somequery',
      'type': PrometheusQueryTypes.Bar,
    };

    const wrapper = shallow(<AppTypePrometheusGraph query={query} />);
    expect(wrapper.is(Bar)).toBe(true);
  });

  it('handles unknown kinds of metrics', () => {
    const query: any = {
      'name': 'foo',
      'query': 'somequery',
      'type': 'unknown',
    };

    const wrapper = shallow(<AppTypePrometheusGraph query={query} />);
    expect(wrapper.html()).toBe('<span>Unknown graph type: unknown</span>');
  });
});

describe('AppTypeResourceStatus', () => {
  it('renders a null value', () => {
    const statusDescriptor = {
      'path': '',
      'displayName': 'Some Thing',
      'description': '',
      'x-descriptors': [ALMStatusDescriptors.conditions]
    };

    const statusValue = null;
    const wrapper = shallow(<AppTypeResourceStatus statusDescriptor={statusDescriptor} statusValue={statusValue} />);
    expect(wrapper.html()).toBe('<dl><dt>Some Thing</dt><dd>None</dd></dl>');
  });

  it('renders a conditions status', () => {
    const statusDescriptor = {
      'path': '',
      'displayName': 'Some Thing',
      'description': '',
      'x-descriptors': [ALMStatusDescriptors.conditions]
    };

    const statusValue = [{
      'lastUpdateTime': '2017-10-16 12:00:00',
      'phase': 'somephase',
    }];

    const wrapper = shallow(<AppTypeResourceStatus statusDescriptor={statusDescriptor} statusValue={statusValue} />);
    expect(wrapper.html()).toBe('<dl><dt>Some Thing</dt><dd><span>somephase</span></dd></dl>');
  });

  it('renders a link status', () => {
    const statusDescriptor = {
      'path': '',
      'displayName': 'Some Link',
      'description': '',
      'x-descriptors': [ALMStatusDescriptors.w3Link]
    };

    const statusValue = 'https://example.com';
    const wrapper = shallow(<AppTypeResourceStatus statusDescriptor={statusDescriptor} statusValue={statusValue} />);
    expect(wrapper.html()).toBe('<dl><dt>Some Link</dt><dd><a href="https://example.com">example.com</a></dd></dl>');
  });
});

describe('AppTypeResourcesDetailsPage', () => {
  let wrapper: ShallowWrapper<AppTypeResourcesDetailsPageProps>;

  beforeEach(() => {
    wrapper = shallow(<AppTypeResourcesDetailsPage kind={testResourceInstance.kind} namespace="default" name={testResourceInstance.metadata.name} />);
  });

  it('renders a `DetailsPage` with the correct subpages', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.exists()).toBe(true);
    expect(detailsPage.props().pages[0].name).toEqual('Overview');
    expect(detailsPage.props().pages[0].href).toEqual('details');
    expect(detailsPage.props().pages[0].component).toEqual(AppTypeResourceDetails);
    expect(detailsPage.props().pages[1].name).toEqual('YAML');
    expect(detailsPage.props().pages[1].href).toEqual('yaml');
  });
});

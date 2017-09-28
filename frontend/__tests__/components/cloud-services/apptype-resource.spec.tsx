/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';

import { AppTypeResourceList, AppTypeResourceListProps, AppTypeResourceHeaderProps, AppTypeResourceRowProps, AppTypeResourceHeader, AppTypeResourceRow, AppTypeResourceOutput, AppTypeResourceOutputProps, AppTypeResourceDetails, AppTypeResourcesDetailsPage, AppTypeResourcesDetailsPageProps, AppTypeResourcesDetailsProps } from '../../../public/components/cloud-services/apptype-resource';
import { AppTypeResourceKind, ALMCapabilites } from '../../../public/components/cloud-services';
import { testAppTypeResource, testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import { List, ColHead, ListHeader, DetailsPage } from '../../../public/components/factory';
import { ResourceLink, Timestamp, LabelList } from '../../../public/components/utils';

describe('AppTypeResourceOutput', () => {
  let wrapper: ShallowWrapper<AppTypeResourceOutputProps>;
  let outputDefinition: AppTypeResourceOutputProps['outputDefinition'];
  let outputValue: any;

  beforeEach(() => {
    outputDefinition = JSON.parse(testAppTypeResource.metadata.annotations.outputs)['testapp-dashboard'];
    outputValue = testResourceInstance.outputs['testapp-dashboard'];
    wrapper = shallow(<AppTypeResourceOutput outputDefinition={outputDefinition} outputValue={outputValue} />);
  });

  it('renders output value as string', () => {
    expect(wrapper.text()).toEqual(outputValue.toString());
  });

  it('renders a formatted link if output definition capabilities contain `w3Link`', () => {
    wrapper.setProps({outputDefinition: Object.assign({}, outputDefinition, {'x-alm-capabilities': [ALMCapabilites.w3Link]})});
    const link = wrapper.find('a');

    expect(link.exists()).toBe(true);
    expect(link.text()).toEqual(outputValue.toString().replace(/https?:\/\//, ''));
  });

  it('renders a formatted link if output definition capabilities contain `tectonicLink`', () => {
    wrapper.setProps({outputDefinition: Object.assign({}, outputDefinition, {'x-alm-capabilities': [ALMCapabilites.tectonicLink]})});
    const link = wrapper.find('a');

    expect(link.exists()).toBe(true);
    expect(link.text()).toEqual(outputValue.toString().replace(/https?:\/\//, ''));
  });

  it('renders formatted link to each Prometheus query based on output value if output definition capabilites contain `metrics`', () => {
    outputDefinition = JSON.parse(testAppTypeResource.metadata.annotations.outputs)['testapp-metrics'];
    outputValue = testResourceInstance.outputs['testapp-metrics'];
    wrapper.setProps({outputDefinition, outputValue});

    const metricsData = JSON.parse(outputValue);
    metricsData.metrics.forEach((metrics, i) => {
      const link = wrapper.find('a').at(i);

      expect(link.exists()).toBe(true);
      expect(link.text()).toEqual(metrics.name);
      expect(link.props().href).toEqual(`${metricsData.endpoint}/graphs?g0.expr=${metrics.query}`);
    });
  });
});

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
  let wrapper: ShallowWrapper<AppTypeResourcesDetailsProps>;
  let resourceDefinition: any;

  beforeEach(() => {
    resourceDefinition = {
      annotations: testAppTypeResource.metadata.annotations,
    };
    // FIXME(alecmerdler): Remove this once https://github.com/DefinitelyTyped/DefinitelyTyped/pull/19672 is shipped
    const Component: React.StatelessComponent<AppTypeResourcesDetailsProps> = (AppTypeResourceDetails as any).WrappedComponent;
    wrapper = shallow(<Component obj={testResourceInstance} kindObj={resourceDefinition} kindsInFlight={false} />);
  });

  it('renders description title', () => {
    const title = wrapper.find('.co-section-title');

    expect(title.text()).toEqual(`${testResourceInstance.kind} Overview`);
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

  it('does not render link to search page if `spec.selector.matchLabels` is not present on resource', () => {
    wrapper.setProps({obj: {...testResourceInstance, spec: {}}});

    expect(wrapper.findWhere(node => node.equals(<dt>Resources</dt>)).exists()).toBe(false);
  });

  it('renders list of metrics links if resource contains metrics output(s)', () => {
    const outputs = JSON.parse(testAppTypeResource.metadata.annotations.outputs);
    const metricsOutputs = Object.keys(outputs)
      .filter(name => outputs[name]['x-alm-capabilities'].indexOf(ALMCapabilites.metrics) !== -1)
      .map(name => Object.assign({}, outputs[name], {value: testResourceInstance.outputs[name]}));
    const links = wrapper.findWhere(node => node.equals(<dt>Important Metrics</dt>)).parent().find('dd');

    expect(links.length).toEqual(metricsOutputs.length);

    metricsOutputs.forEach((output, i) => {
      const resourceOutput = links.at(i).find(AppTypeResourceOutput);
      
      expect(resourceOutput.exists()).toBe(true);
      expect(resourceOutput.props().outputDefinition).toEqual(output);
      expect(resourceOutput.props().outputValue).toEqual(output.value);
    });
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

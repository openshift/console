/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';

import { AppTypeResourceList, AppTypeResourceListProps, AppTypeResourceHeaderProps, AppTypeResourceRowProps, AppTypeResourceHeader, AppTypeResourceRow, AppTypeResources, AppTypeResourcesProps, AppTypeResourceOutput, AppTypeResourceOutputProps } from '../../../public/components/cloud-services/apptype-resource';
import { AppTypeResourceKind, CustomResourceDefinitionKind, ALMCapabilites } from '../../../public/components/cloud-services';
import { testAppTypeResource, testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import { List, ColHead, ListHeader } from '../../../public/components/factory';
import { FirehoseHoC, ResourceLink } from '../../../public/components/utils';

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
  let outputs: {[name: string]: any};

  beforeEach(() => {
    outputs = JSON.parse(testAppTypeResource.metadata.annotations.outputs);
    wrapper = shallow(<AppTypeResourceHeader kindObj={testAppTypeResource} data={[]} />);
  });

  it('renders first column header for resource name', () => {
    const nameColHeader = wrapper.find(ListHeader).find(ColHead).first();

    expect(nameColHeader.exists()).toBe(true);
    expect(nameColHeader.props().sortField).toEqual('metadata.name');
    expect(nameColHeader.childAt(0).text()).toEqual('Name');
  });

  it('renders column header for each defined output', () => {
    const outputColHeaders = wrapper.find(ListHeader).find(ColHead).slice(1);
    const outputNames: string[] = Object.keys(outputs)
      .map((name: string) => outputs[name].displayName);

    expect(outputColHeaders.length).toEqual(outputNames.length);

    outputColHeaders.forEach((header) => {
      expect(outputNames).toContain(header.childAt(0).text());
    });
  });

  it('handles resource definition with no `outputs` annotation', () => {
    let emptyAppTypeResource = _.cloneDeep(testAppTypeResource);
    emptyAppTypeResource.metadata.annotations.outputs = undefined;
    wrapper.setProps({kindObj: emptyAppTypeResource});
   
    expect(wrapper.find(ColHead).length).toEqual(1);
  });
});

describe('AppTypeResourceRow', () => {
  let wrapper: ShallowWrapper<AppTypeResourceRowProps>;
  let outputs: {[name: string]: any};

  beforeEach(() => {
    outputs = JSON.parse(testAppTypeResource.metadata.annotations.outputs);
    wrapper = shallow(<AppTypeResourceRow obj={testResourceInstance} kindObj={testAppTypeResource} />);
  });

  it('renders resource link as first column', () => {
    const nameRow = wrapper.find(ResourceLink);

    expect(nameRow.exists()).toBe(true);
    expect(nameRow.props().name).toEqual(testResourceInstance.metadata.name);
    expect(nameRow.props().title).toEqual(testResourceInstance.metadata.name);
    expect(nameRow.props().kind).toEqual(testResourceInstance.kind);
    expect(nameRow.props().namespace).toEqual(testResourceInstance.metadata.namespace);
  });

  it('renders column for each defined output', () => {
    const outputCols = wrapper.find(AppTypeResourceOutput);
    const outputNames: string[] = Object.keys(outputs)
      .map((name: string) => outputs[name].displayName);

    expect(outputCols.length).toEqual(outputNames.length);

    outputCols.forEach((output) => {
      expect(output.exists()).toBe(true);
      expect(Object.keys(outputs).map(name => outputs[name].displayName)).toContain(output.props().outputDefinition.displayName);
      expect(Object.keys(outputs).map(name => outputs[name].description)).toContain(output.props().outputDefinition.description);
      expect(Object.keys(testResourceInstance.outputs).map(name => testResourceInstance.outputs[name])).toContain(output.props().outputValue);
    });
  });

  it('handles resource instance with no `outputs`', () => {
    let emptyResourceInstance = _.cloneDeep(testResourceInstance);
    emptyResourceInstance.outputs = undefined;
    wrapper.setProps({obj: emptyResourceInstance});

    expect(wrapper.find(AppTypeResourceOutput).length).toEqual(0);
  });

  it('handles resource definition with no `outputs` annotation', () => {
    let emptyAppTypeResource = _.cloneDeep(testAppTypeResource);
    emptyAppTypeResource.metadata.annotations.outputs = undefined;
    wrapper.setProps({kindObj: emptyAppTypeResource});

    expect(wrapper.find(AppTypeResourceOutput).length).toEqual(0);
  });
});

describe('AppTypeResourceList', () => {
  let wrapper: ShallowWrapper<AppTypeResourceListProps>;
  let resources: AppTypeResourceKind[];

  beforeEach(() => {
    resources = [testResourceInstance];
    wrapper = shallow(<AppTypeResourceList loaded={true} data={resources} kindObj={testAppTypeResource} filters={{}} />);
  });

  it('renders a `List` of the custom resource instances of the given kind', () => {
    const list: ShallowWrapper<any> = wrapper.find(List);

    expect(list.exists()).toBe(true);
    expect(Object.keys(wrapper.props()).reduce((_, prop) => list.prop(prop) === wrapper.prop(prop), false)).toBe(true);
    expect(list.props().Header).toEqual(AppTypeResourceHeader);
    expect(list.props().Row).toEqual(AppTypeResourceRow);
  });
});

describe('AppTypeResources', () => {
  let wrapper: ShallowWrapper<AppTypeResourcesProps>;
  let appTypeResources: CustomResourceDefinitionKind[];

  beforeEach(() => {
    appTypeResources = [testAppTypeResource];
    wrapper = shallow(<AppTypeResources loaded={true} data={appTypeResources} />);
  });

  it('renders a list for each CustomResourceDefinition in `props.data`', () => {
    appTypeResources.forEach((resource, i) => {
      const list = wrapper.childAt(i);
      const firehose = list.find(FirehoseHoC);

      expect(list.exists()).toBe(true);
      expect(list.find('h4').text()).toEqual(resource.metadata.annotations.displayName);
      expect(firehose.exists()).toBe(true);
      expect(firehose.props().kind).toEqual(resource.spec.names.kind);
      // FIXME(alecmerdler): Test component
      expect(firehose.props().Component).toBeDefined();
      expect(firehose.props().isList).toBe(true);
    });
  });
});

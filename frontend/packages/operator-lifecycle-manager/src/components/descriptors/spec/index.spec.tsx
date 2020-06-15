import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink, Selector } from '@console/internal/components/utils';
import { DescriptorProps, SpecCapability, Descriptor } from '../types';
import { testResourceInstance, testModel } from '../../../../mocks';
import { EndpointList, Endpoint } from './endpoint';
import { ResourceRequirementsModalLink } from './resource-requirements';
import * as configureSize from './configure-size';
import { SpecDescriptor } from '.';
import { Button } from '@patternfly/react-core';

describe(SpecDescriptor.name, () => {
  let wrapper: ShallowWrapper<DescriptorProps>;
  let descriptor: Descriptor;

  beforeEach(() => {
    descriptor = {
      path: '',
      displayName: 'Some Spec Control',
      description: 'This is a description',
      'x-descriptors': [],
    };
    wrapper = shallow(
      <SpecDescriptor
        model={testModel}
        obj={testResourceInstance}
        namespace="foo"
        descriptor={descriptor}
        value={null}
      />,
    )
      .childAt(0)
      .shallow();
  });

  it('renders status value as text if no matching capability component', () => {
    expect(
      wrapper
        .find('dt')
        .render()
        .text(),
    ).toEqual(descriptor.displayName);
    // expect(wrapper.find('.olm-descriptor__title').text()).toEqual(descriptor.displayName);
    expect(
      wrapper
        .find('dd')
        .render()
        .text(),
    ).toEqual('None');
  });

  it('renders a pod count modal link', (done) => {
    const value = 3;
    descriptor['x-descriptors'] = [SpecCapability.podCount];
    wrapper = wrapper.setProps({ descriptor, value });

    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(Button)
        .render()
        .text(),
    ).toEqual(`${value} pods`);

    spyOn(configureSize, 'configureSizeModal').and.callFake((props) => {
      expect(props).toEqual({
        kindObj: testModel,
        resource: testResourceInstance,
        specDescriptor: descriptor,
        specValue: value,
      });
      done();
    });
    wrapper
      .find('dd')
      .childAt(0)
      .shallow()
      .find(Button)
      .props()
      .onClick(null);
  });

  it('renders an endpoints list', () => {
    const value: Endpoint[] = [{ targetPort: 80, scheme: 'TCP' }];
    descriptor['x-descriptors'] = [SpecCapability.endpointList];
    wrapper = wrapper.setProps({ descriptor, value });

    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(EndpointList)
        .props().endpoints,
    ).toEqual(value);
  });

  it('renders a label', () => {
    const value = 'app=foo';
    descriptor['x-descriptors'] = [SpecCapability.label];
    wrapper = wrapper.setProps({ descriptor, value });

    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .text(),
    ).toEqual(value);
  });

  it('renders a namespace selector', () => {
    const value = { matchNames: ['default'] };
    descriptor['x-descriptors'] = [SpecCapability.namespaceSelector];
    wrapper = wrapper.setProps({ descriptor, value });

    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(ResourceLink)
        .props().kind,
    ).toEqual('Namespace');
    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(ResourceLink)
        .props().name,
    ).toEqual('default');
    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(ResourceLink)
        .props().title,
    ).toEqual('default');
  });

  it('renders a resource requirements control', () => {
    descriptor['x-descriptors'] = [SpecCapability.resourceRequirements];
    wrapper = wrapper.setProps({ descriptor });

    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find('dt')
        .at(0)
        .text(),
    ).toEqual('Resource Limits');
    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(ResourceRequirementsModalLink)
        .at(0)
        .props().type,
    ).toEqual('limits');
    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find('dt')
        .at(1)
        .text(),
    ).toEqual('Resource Requests');
    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(ResourceRequirementsModalLink)
        .at(1)
        .props().type,
    ).toEqual('requests');
  });

  it('renders a resource link to a Kubernetes object', () => {
    const value = 'my-service';
    descriptor['x-descriptors'] = [
      `${SpecCapability.k8sResourcePrefix}core:v1:Service`,
    ] as SpecCapability[];
    wrapper = wrapper.setProps({ descriptor, value });

    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(ResourceLink)
        .props().kind,
    ).toEqual('Service');
    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(ResourceLink)
        .props().name,
    ).toEqual(value);
    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(ResourceLink)
        .props().namespace,
    ).toEqual('foo');
  });

  it('renders a basic selector', () => {
    const value = { matchNames: ['default'] };
    descriptor['x-descriptors'] = [`${SpecCapability.selector}core:v1:Service`] as SpecCapability[];
    wrapper = wrapper.setProps({ descriptor, value });

    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(Selector)
        .props().selector,
    ).toEqual(value);
    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(Selector)
        .props().kind,
    ).toEqual('core:v1:Service');
  });
});

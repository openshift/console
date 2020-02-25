import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink } from '@console/internal/components/utils';
import { Conditions } from '@console/internal/components/conditions';
import { DescriptorProps, StatusCapability, Descriptor, SpecCapability } from '../types';
import { testModel } from '../../../../mocks';
import { StatusDescriptor } from '.';

describe(StatusDescriptor.displayName, () => {
  let wrapper: ShallowWrapper<DescriptorProps>;
  let descriptor: Descriptor;

  beforeEach(() => {
    descriptor = {
      path: '',
      displayName: 'Some Thing',
      description: '',
      'x-descriptors': [],
    };
    wrapper = shallow(
      <StatusDescriptor
        descriptor={descriptor}
        value={null}
        obj={null}
        model={testModel}
        namespace="foo"
      />,
    )
      .childAt(0)
      .shallow();
  });

  it('renders status value as text if no matching capability component', () => {
    expect(wrapper.find('dt').text()).toEqual(descriptor.displayName);
    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find('.text-muted')
        .text(),
    ).toEqual('None');
  });

  it('renders a conditions status', () => {
    const value = [
      {
        lastUpdateTime: '2017-10-16 12:00:00',
        type: 'SomeType',
      },
    ];
    descriptor['x-descriptors'] = [StatusCapability.conditions];
    wrapper = wrapper.setProps({ descriptor, value });

    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .find(Conditions)
        .exists(),
    ).toBe(true);
  });

  it('renders a link status', () => {
    const value = 'https://example.com';
    descriptor['x-descriptors'] = [StatusCapability.w3Link];
    wrapper = wrapper.setProps({ descriptor, value });

    expect(
      wrapper
        .find('dd')
        .childAt(0)
        .shallow()
        .text(),
    ).toEqual('example.com');
  });

  it('renders a resource status', () => {
    const value = 'someservice';
    descriptor['x-descriptors'] = [
      `${StatusCapability.k8sResourcePrefix}Service`,
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
        .props().namespace,
    ).toEqual('foo');
  });
});

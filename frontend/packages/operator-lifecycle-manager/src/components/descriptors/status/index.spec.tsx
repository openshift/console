import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom-v5-compat';
import { ResourceLink } from '@console/internal/components/utils';
import store from '@console/internal/redux';
import { DescriptorDetailsItem, DescriptorDetailsItemProps } from '..';
import { testModel, testResourceInstance } from '../../../../mocks';
import { Descriptor, StatusCapability, DescriptorType } from '../types';

const OBJ = {
  ...testResourceInstance,
  status: {
    link: 'https://example.com',
    service: 'someservice',
  },
};

describe('Status descriptor details items', () => {
  let wrapper: ReactWrapper<DescriptorDetailsItemProps>;
  let descriptor: Descriptor;

  beforeEach(() => {
    descriptor = {
      path: 'test',
      displayName: 'Some Thing',
      description: '',
      'x-descriptors': [],
    };
    wrapper = mount(
      <DescriptorDetailsItem
        descriptor={descriptor}
        obj={OBJ}
        model={testModel}
        schema={{}}
        type={DescriptorType.status}
      />,
      {
        wrappingComponent: (props) => (
          <BrowserRouter>
            <Provider store={store} {...props} />,
          </BrowserRouter>
        ),
      },
    );
  });

  it('renders status value as text if no matching capability component', () => {
    expect(wrapper.find('dt').text()).toEqual(descriptor.displayName);
    expect(wrapper.find('dd .text-muted').text()).toEqual('None');
  });

  it('renders a link status', () => {
    descriptor['x-descriptors'] = [StatusCapability.w3Link];
    descriptor.path = 'link';
    wrapper = wrapper.setProps({ descriptor });

    expect(wrapper.find('dd').text()).toEqual('example.com');
  });

  it('renders a resource status', () => {
    descriptor['x-descriptors'] = [`${StatusCapability.k8sResourcePrefix}Service`];
    descriptor.path = 'service';
    wrapper = wrapper.setProps({ descriptor });
    const resourceLink = wrapper.find(ResourceLink);

    expect(resourceLink.prop('kind')).toEqual('Service');
    expect(resourceLink.prop('namespace')).toEqual('default');
  });
});

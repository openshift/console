import * as React from 'react';
import { Router } from 'react-router';
import { Provider } from 'react-redux';
import { mount, ReactWrapper } from 'enzyme';
import { DescriptorProps, StatusCapability, Descriptor, SpecCapability } from '../types';
import { testModel, testResourceInstance } from '../../../../mocks';
import { StatusDescriptor } from '.';
import store from '@console/internal/redux';
import { ResourceLink, history } from '@console/internal/components/utils';
import { Conditions } from '@console/internal/components/conditions';

const OBJ = {
  ...testResourceInstance,
  status: {
    link: 'https://example.com',
    service: 'someservice',
    conditions: [
      {
        lastUpdateTime: '2017-10-16 12:00:00',
        type: 'SomeType',
      },
    ],
  },
};

describe(StatusDescriptor.displayName, () => {
  let wrapper: ReactWrapper<DescriptorProps>;
  let descriptor: Descriptor;

  beforeEach(() => {
    descriptor = {
      path: '',
      displayName: 'Some Thing',
      description: '',
      'x-descriptors': [],
    };
    wrapper = mount(<StatusDescriptor descriptor={descriptor} obj={OBJ} model={testModel} />, {
      wrappingComponent: (props) => (
        <Router history={history}>
          <Provider store={store} {...props} />,
        </Router>
      ),
    });
  });

  it('renders status value as text if no matching capability component', () => {
    expect(wrapper.find('dt').text()).toEqual(descriptor.displayName);
    expect(wrapper.find('dd .text-muted').text()).toEqual('None');
  });

  it('renders a conditions status', () => {
    descriptor['x-descriptors'] = [StatusCapability.conditions];
    descriptor.path = 'conditions';
    wrapper.setProps({ descriptor });

    expect(wrapper.find(Conditions).exists()).toBe(true);
  });

  it('renders a link status', () => {
    descriptor['x-descriptors'] = [StatusCapability.w3Link];
    descriptor.path = 'link';
    wrapper = wrapper.setProps({ descriptor });

    expect(wrapper.find('dd').text()).toEqual('example.com');
  });

  it('renders a resource status', () => {
    descriptor['x-descriptors'] = [
      `${StatusCapability.k8sResourcePrefix}Service`,
    ] as SpecCapability[];
    descriptor.path = 'service';
    wrapper = wrapper.setProps({ descriptor });
    const resourceLink = wrapper.find(ResourceLink);

    expect(resourceLink.prop('kind')).toEqual('Service');
    expect(resourceLink.prop('namespace')).toEqual('default');
  });
});

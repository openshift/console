import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import { mount, ReactWrapper } from 'enzyme';
import store from '@console/internal/redux';
import { ResourceLink, Selector, history } from '@console/internal/components/utils';
import { SpecCapability, Descriptor, DescriptorType } from '../types';
import { testResourceInstance, testModel } from '../../../../mocks';
import { EndpointList } from './endpoint';
import { ResourceRequirementsModalLink } from './resource-requirements';
import * as configureSize from './configure-size';
import { DescriptorDetailsItem, DescriptorDetailsItemProps } from '..';

const OBJ = {
  ...testResourceInstance,
  spec: {
    ...testResourceInstance.spec,
    pods: 3,
    endpoints: [{ targetPort: 80, scheme: 'TCP' }],
    basicSelector: { matchNames: ['default'] },
    resourceLink: 'my-service',
  },
};

describe('Spec descriptors', () => {
  let wrapper: ReactWrapper<DescriptorDetailsItemProps>;
  let descriptor: Descriptor;

  beforeEach(() => {
    descriptor = {
      path: 'test',
      displayName: 'Some Spec Control',
      description: '',
      'x-descriptors': [],
    };
    wrapper = mount(
      <DescriptorDetailsItem
        descriptor={descriptor}
        model={testModel}
        obj={OBJ}
        type={DescriptorType.spec}
        schema={{}}
      />,
      {
        wrappingComponent: (props) => (
          <Router history={history}>
            <Provider store={store} {...props} />
          </Router>
        ),
      },
    );
  });

  it('renders spec value as text if no matching capability component', () => {
    expect(wrapper.find('dt').text()).toEqual(descriptor.displayName);
    expect(wrapper.find('dd').text()).toEqual('None');
  });

  it('renders a pod count modal link', (done) => {
    descriptor = {
      ...descriptor,
      path: 'pods',
      'x-descriptors': [SpecCapability.podCount],
    };
    wrapper.setProps({ descriptor });
    expect(
      wrapper
        .find('dd')
        .find(Button)
        .text(),
    ).toEqual(`${OBJ.spec.pods} pods`);

    spyOn(configureSize, 'configureSizeModal').and.callFake((props) => {
      expect(props).toEqual({
        kindObj: testModel,
        resource: OBJ,
        specDescriptor: descriptor,
        specValue: OBJ.spec.pods,
      });
      done();
    });
    wrapper
      .find('dd')
      .find(Button)
      .props()
      .onClick(null);
  });

  it('renders an endpoints list', () => {
    descriptor = {
      ...descriptor,
      path: 'endpoints',
      'x-descriptors': [SpecCapability.endpointList],
    };
    wrapper.setProps({ descriptor });
    expect(wrapper.find(EndpointList).prop('endpoints')).toEqual(OBJ.spec.endpoints);
  });

  it('renders a namespace selector', () => {
    descriptor = {
      ...descriptor,
      path: 'basicSelector',
      'x-descriptors': [SpecCapability.namespaceSelector],
    };
    wrapper.setProps({ descriptor });

    expect(wrapper.find(ResourceLink).prop('kind')).toEqual('Namespace');
    expect(wrapper.find(ResourceLink).prop('name')).toEqual('default');
    expect(wrapper.find(ResourceLink).prop('title')).toEqual('default');
  });

  it('renders a resource requirements control', () => {
    descriptor['x-descriptors'] = [SpecCapability.resourceRequirements];
    wrapper.setProps({ descriptor });

    expect(
      wrapper
        .find('dd')
        .find('dt')
        .at(0)
        .text(),
    ).toEqual('Resource Limits');
    expect(
      wrapper
        .find('dd')
        .find(ResourceRequirementsModalLink)
        .at(0)
        .prop('type'),
    ).toEqual('limits');
    expect(
      wrapper
        .find('dd')
        .find('dt')
        .at(1)
        .text(),
    ).toEqual('Resource Requests');
    expect(
      wrapper
        .find('dd')
        .find(ResourceRequirementsModalLink)
        .at(1)
        .prop('type'),
    ).toEqual('requests');
  });

  it('renders a resource link to a Kubernetes object', () => {
    descriptor = {
      ...descriptor,
      path: 'resourceLink',
      'x-descriptors': [`${SpecCapability.k8sResourcePrefix}core:v1:Service`],
    };
    wrapper.setProps({ descriptor });

    expect(wrapper.find(ResourceLink).prop('kind')).toEqual('Service');
    expect(wrapper.find(ResourceLink).prop('name')).toEqual(OBJ.spec.resourceLink);
    expect(wrapper.find(ResourceLink).prop('namespace')).toEqual('default');
  });

  it('renders a basic selector', () => {
    descriptor = {
      ...descriptor,
      path: 'basicSelector',
      'x-descriptors': [`${SpecCapability.selector}core:v1:Service`],
    };
    wrapper.setProps({ descriptor });
    expect(wrapper.find(Selector).prop('selector')).toEqual(OBJ.spec.basicSelector);
    expect(wrapper.find(Selector).prop('kind')).toEqual('core:v1:Service');
  });
});

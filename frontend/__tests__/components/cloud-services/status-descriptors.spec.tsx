/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { ClusterServiceVersionResourceStatus, ClusterServiceVersionResourceStatusProps, Phase, PhaseProps, StatusDescriptor } from '../../../public/components/cloud-services/status-descriptors';
import { ALMStatusDescriptors } from '../../../public/components/cloud-services';
import { ResourceLink } from '../../../public/components/utils';

describe(ClusterServiceVersionResourceStatus.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionResourceStatusProps>;
  let statusDescriptor: StatusDescriptor;

  beforeEach(() => {
    statusDescriptor = {
      path: '',
      displayName: 'Some Thing',
      description: '',
      'x-descriptors': [ALMStatusDescriptors.conditions]
    };
  });

  it('renders a null value', () => {
    wrapper = shallow(<ClusterServiceVersionResourceStatus statusDescriptor={statusDescriptor} statusValue={null} />);

    expect(wrapper.find('dt').text()).toEqual(statusDescriptor.displayName);
    expect(wrapper.find('dd.text-muted').text()).toEqual('None');
  });

  it('renders an empty object', () => {
    wrapper = shallow(<ClusterServiceVersionResourceStatus statusDescriptor={statusDescriptor} statusValue={{}} />);

    expect(wrapper.find('dt').text()).toEqual(statusDescriptor.displayName);
    expect(wrapper.find('dd').text()).toEqual('None');
  });

  it('renders a conditions status', () => {
    const statusValue = [{
      lastUpdateTime: '2017-10-16 12:00:00',
      phase: 'somephase',
    }];
    wrapper = shallow(<ClusterServiceVersionResourceStatus statusDescriptor={statusDescriptor} statusValue={statusValue} />);

    expect(wrapper.find('dt').text()).toEqual(statusDescriptor.displayName);
    expect(wrapper.find('dd').text()).toEqual('somephase');
  });

  it('renders a link status', () => {
    const statusValue = 'https://example.com';
    statusDescriptor['x-descriptors'] = [ALMStatusDescriptors.tectonicLink];
    wrapper = shallow(<ClusterServiceVersionResourceStatus statusDescriptor={statusDescriptor} statusValue={statusValue} />);

    expect(wrapper.find('dt').text()).toEqual(statusDescriptor.displayName);
    expect(wrapper.find('dd').text()).toEqual('example.com');
  });

  it('renders a phase status', () => {
    const statusValue = 'someservice';
    statusDescriptor['x-descriptors'] = [ALMStatusDescriptors.k8sPhase];
    wrapper = shallow(<ClusterServiceVersionResourceStatus namespace="foo" statusDescriptor={statusDescriptor} statusValue={statusValue} />);

    expect(wrapper.find(Phase).exists()).toBe(true);
    expect(wrapper.find(Phase).props().status).toEqual(statusValue);
  });

  it('renders a resource status', () => {
    const statusValue = 'someservice';
    statusDescriptor['x-descriptors'] = [`${ALMStatusDescriptors.k8sResourcePrefix}Service`];
    wrapper = shallow(<ClusterServiceVersionResourceStatus namespace="foo" statusDescriptor={statusDescriptor} statusValue={statusValue} />);

    expect(wrapper.find(ResourceLink).props().kind).toEqual('Service');
    expect(wrapper.find(ResourceLink).props().namespace).toEqual('foo');
  });
});

describe(Phase.displayName, () => {
  let wrapper: ShallowWrapper<PhaseProps>;

  beforeEach(() => {
    wrapper = shallow(<Phase status={null} />);
  });

  it('renders icon for failed status', () => {
    const status = 'Failed';
    wrapper.setProps({status});

    expect(wrapper.find('.co-error').exists()).toBe(true);
    expect(wrapper.find('.fa.fa-ban').exists()).toBe(true);
  });

  it('renders status text', () => {
    const status = 'Running';
    wrapper.setProps({status});

    expect(wrapper.find('.co-error').exists()).toBe(false);
    expect(wrapper.text()).toContain(status);
    expect(wrapper.find('.fa.fa-ban').exists()).toBe(false);
  });
});

import * as React from 'react';
// eslint-disable-next-line no-unused-vars
import { shallow, ShallowWrapper } from 'enzyme';

// eslint-disable-next-line no-unused-vars
import { ClusterServiceVersionResourceStatus, ClusterServiceVersionResourceStatusProps, Phase, PhaseProps } from '../../../public/components/cloud-services/status-descriptors';
import { ALMStatusDescriptors } from '../../../public/components/cloud-services';
import { ResourceLink } from '../../../public/components/utils';

describe(ClusterServiceVersionResourceStatus.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionResourceStatusProps>;

  it('renders a null value', () => {
    const statusDescriptor = {
      'path': '',
      'displayName': 'Some Thing',
      'description': '',
      'x-descriptors': [ALMStatusDescriptors.conditions]
    };
    const statusValue = null;
    wrapper = shallow(<ClusterServiceVersionResourceStatus statusDescriptor={statusDescriptor} statusValue={statusValue} />);

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
    wrapper = shallow(<ClusterServiceVersionResourceStatus statusDescriptor={statusDescriptor} statusValue={statusValue} />);

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
    wrapper = shallow(<ClusterServiceVersionResourceStatus statusDescriptor={statusDescriptor} statusValue={statusValue} />);

    expect(wrapper.html()).toBe('<dl><dt>Some Link</dt><dd><a href="https://example.com">example.com</a></dd></dl>');
  });

  it('renders a phase status', () => {
    const statusDescriptor = {
      'path': '',
      'displayName': 'Some Service',
      'description': '',
      'x-descriptors': [ALMStatusDescriptors.k8sPhase]
    };

    const statusValue = 'someservice';
    wrapper = shallow(<ClusterServiceVersionResourceStatus namespace="foo" statusDescriptor={statusDescriptor} statusValue={statusValue} />);
    const phase = wrapper.find(Phase);
    expect(phase.exists()).toBe(true);
    expect(phase.props().status).toBe(statusValue);
  });

  it('renders a resource status', () => {
    const statusDescriptor = {
      'path': '',
      'displayName': 'Some Service',
      'description': '',
      'x-descriptors': [`${ALMStatusDescriptors.k8sResourcePrefix}Service`]
    };

    const statusValue = 'someservice';
    wrapper = shallow(<ClusterServiceVersionResourceStatus namespace="foo" statusDescriptor={statusDescriptor} statusValue={statusValue} />);
    const link = wrapper.find(ResourceLink);

    expect(link.props().kind).toBe('Service');
    expect(link.props().namespace).toBe('foo');
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

    expect(wrapper.find('.fa.fa-ban.phase-failed-icon').exists()).toBe(true);
  });

  it('renders status text', () => {
    const status = 'Running';
    wrapper.setProps({status});

    expect(wrapper.text()).toContain(status);
  });
});

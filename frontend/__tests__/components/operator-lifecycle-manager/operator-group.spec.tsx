/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { shallow } from 'enzyme';

import { requireOperatorGroup, NoOperatorGroupMsg } from '../../../public/components/operator-lifecycle-manager/operator-group';
import { testOperatorGroup } from '../../../__mocks__/k8sResourcesMocks';

describe('requireOperatorGroup', () => {
  const SomeComponent = () => <div>Requires OperatorGroup</div>;

  it('renders given component if `OperatorGroups` has not loaded yet', () => {
    const WrappedComponent = requireOperatorGroup(SomeComponent);
    const wrapper = shallow(<WrappedComponent operatorGroup={{loaded: false}} />);

    expect(wrapper.find(SomeComponent).exists()).toBe(true);
    expect(wrapper.find(NoOperatorGroupMsg).exists()).toBe(false);
  });

  it('renders message if no `OperatorGroups` loaded', () => {
    const WrappedComponent = requireOperatorGroup(SomeComponent);
    const wrapper = shallow(<WrappedComponent operatorGroup={{loaded: true, data: []}} />);

    expect(wrapper.find(NoOperatorGroupMsg).exists()).toBe(true);
    expect(wrapper.find(SomeComponent).exists()).toBe(false);
  });

  it('renders given component if `OperatorGroups` loaded and present', () => {
    const WrappedComponent = requireOperatorGroup(SomeComponent);
    const wrapper = shallow(<WrappedComponent operatorGroup={{loaded: true, data: [testOperatorGroup]}} />);

    expect(wrapper.find(SomeComponent).exists()).toBe(true);
    expect(wrapper.find(NoOperatorGroupMsg).exists()).toBe(false);
  });
});

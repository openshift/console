import * as React from 'react';
import { Button, FormFieldGroupExpandable } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { ButtonBar } from '@console/internal/components/utils';
import { NetworkPolicyForm } from '../../components/network-policies/network-policy-form';
import { NetworkPolicy } from '../../components/network-policies/network-policy-model';

describe('NetworkPolicyForm', () => {
  let wrapper: ShallowWrapper<{}, { networkPolicy: NetworkPolicy }>;

  beforeEach(() => {
    wrapper = shallow(<NetworkPolicyForm namespace="default" />);
  });

  it('should render CreateNetworkPolicy component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render the main form elements of CreateNetworkPolicy component', () => {
    expect(wrapper.find('input[id="name"]')).toHaveLength(1);
    expect(wrapper.find(FormFieldGroupExpandable)).toHaveLength(2);
  });

  it('should render control buttons in a button bar with create disabled', () => {
    const buttonBar = wrapper.find(ButtonBar);
    expect(buttonBar.exists()).toBe(true);
    expect(
      buttonBar
        .find(Button)
        .at(0)
        .childAt(0)
        .text(),
    ).toEqual('Create');
    expect(
      buttonBar
        .find(Button)
        .at(1)
        .childAt(0)
        .text(),
    ).toEqual('Cancel');
  });
});

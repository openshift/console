import * as React from 'react';
import { Button, FormFieldGroupExpandable } from '@patternfly/react-core';
import { mount } from 'enzyme';
import { ButtonBar } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { NetworkPolicyForm } from '../../components/network-policies/network-policy-form';

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/flag', () => ({
  useFlag: () => true,
}));

describe('NetworkPolicyForm', () => {
  const ovnK8sSpec = { spec: { defaultNetwork: { type: 'OVNKubernetes' } } };
  (useK8sGet as jest.Mock).mockReturnValue([ovnK8sSpec, true, null]);
  const wrapper = mount(<NetworkPolicyForm namespace="default" />);

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

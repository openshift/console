import * as React from 'react';
import { Button, FormFieldGroupExpandable } from '@patternfly/react-core';
import { mount } from 'enzyme';
import { ButtonBar } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { NetworkPolicyKind } from '@console/internal/module/k8s';
import { NetworkPolicyForm } from '../../components/network-policies/network-policy-form';
import { NetworkPolicyRuleConfigPanel } from '../../components/network-policies/network-policy-rule-config';

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/flag', () => ({
  useFlag: () => true,
}));

jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => ({
  useUserSettingsCompatibility: () => ['', () => {}],
}));

const emptyPolicy: NetworkPolicyKind = {
  metadata: {
    name: '',
    namespace: 'default',
  },
  spec: {
    podSelector: {},
    ingress: [{}],
    egress: [{}],
    policyTypes: ['Ingress', 'Egress'],
  },
};

describe('NetworkPolicyForm', () => {
  const ovnK8sSpec = { spec: { defaultNetwork: { type: 'OVNKubernetes' } } };
  (useK8sGet as jest.Mock).mockReturnValue([ovnK8sSpec, true, null]);
  const wrapper = mount(<NetworkPolicyForm formData={emptyPolicy} onChange={jest.fn()} />);

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

  it('should render multiple rules', () => {
    const formData = { ...emptyPolicy };
    formData.spec.ingress = [
      {
        from: [],
        ports: [{}],
      },
    ];
    formData.spec.egress = [
      {
        to: [],
        ports: [{}],
      },
    ];
    wrapper.setProps({ formData });
    expect(wrapper.find(NetworkPolicyRuleConfigPanel)).toHaveLength(2);
  });
});

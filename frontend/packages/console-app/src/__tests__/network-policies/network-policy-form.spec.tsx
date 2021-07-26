import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { mount } from 'enzyme';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { NetworkPolicyForm } from '../../components/network-policies/network-policy-form';

const i18nNS = 'public';
jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
    withTranslation: () => (Component) => {
      Component.defaultProps = { ...Component.defaultProps, t: (s) => s };
      return Component;
    },
  };
});

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

describe('NetworkPolicyForm with Unknown CNI type', () => {
  (useK8sGet as jest.Mock).mockReturnValue([null, true, 'error fetching CNI']);
  const wrapper = mount(<NetworkPolicyForm namespace="default" />);

  it('should render a warning in case the customer is using Openshift SDN', () => {
    const alert = wrapper.find(Alert);
    expect(alert.exists()).toBe(true);
    expect(alert.props().title).toEqual(
      `${i18nNS}~When using the OpenShift SDN cluster network provider, egress network policy is not supported.`,
    );
  });
  it('should render a checkbox to deny all egress', () => {
    expect(wrapper.find(`[name="denyAllEgress"]`).exists()).toBe(true);
  });
});

describe('NetworkPolicyForm with Openshift SDN CNI type', () => {
  const openShiftSDNSpec = { spec: { defaultNetwork: { type: 'OpenShiftSDN' } } };
  (useK8sGet as jest.Mock).mockReturnValue([openShiftSDNSpec, true, null]);
  const wrapper = mount(<NetworkPolicyForm namespace="default" />);

  it('should not render any warning', () => {
    const alert = wrapper.find(Alert);
    expect(alert.exists()).toBe(false);
  });
  it('should not render any checkbox to deny all egress', () => {
    expect(wrapper.find(`[name="denyAllEgress"]`).exists()).toBe(false);
  });
});

describe('NetworkPolicyForm with OVN Kubernetes CNI type', () => {
  const ovnK8sSpec = { spec: { defaultNetwork: { type: 'OVNKubernetes' } } };
  (useK8sGet as jest.Mock).mockReturnValue([ovnK8sSpec, true, null]);
  const wrapper = mount(<NetworkPolicyForm namespace="default" />);

  it('should not render any warning', () => {
    const alert = wrapper.find(Alert);
    expect(alert.exists()).toBe(false);
  });
  it('should render the checkbox to deny all egress', () => {
    expect(wrapper.find(`[name="denyAllEgress"]`).exists()).toBe(true);
  });
});

import * as React from 'react';
import { Alert, FormFieldGroupExpandable } from '@patternfly/react-core';
import { mount } from 'enzyme';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { NetworkPolicyForm } from '../../components/network-policies/network-policy-form';

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

const NetworkPolicyFormComponent = NetworkPolicyForm.WrappedComponent;

describe('NetworkPolicyForm without permissions to fetch CNI type', () => {
  (useK8sGet as jest.Mock).mockReturnValue([null, true, 'error fetching CNI']);
  const wrapper = mount(<NetworkPolicyFormComponent flags={{ OPENSHIFT: true }} />);

  it('should render a warning in case the customer is using Openshift SDN', () => {
    const alert = wrapper.find(Alert);
    expect(alert.exists()).toBe(true);
    expect(
      alert.findWhere((p) => p.text().includes('When using the OpenShift SDN cluster')).exists(),
    ).toBe(true);
  });
  it('should render a checkbox to deny all egress', () => {
    expect(wrapper.find(`[name="denyAllEgress"]`).exists()).toBe(true);
  });
  it('should render the Egress policies section', () => {
    expect(
      wrapper
        .find(FormFieldGroupExpandable)
        .findWhere((b) => b.props().toggleAriaLabel === 'Egress')
        .exists(),
    ).toBe(true);
  });
});

describe('NetworkPolicyForm with Unknown CNI type', () => {
  const unknownSDNSpec = { spec: { defaultNetwork: { type: 'Calico' } } };
  (useK8sGet as jest.Mock).mockReturnValue([unknownSDNSpec, true, null]);
  const wrapper = mount(<NetworkPolicyFormComponent flags={{ OPENSHIFT: true }} />);

  it('should render a warning in case the customer is using Openshift SDN', () => {
    const alert = wrapper.find(Alert);
    expect(alert.exists()).toBe(true);
    expect(
      alert.findWhere((p) => p.text().includes('When using the OpenShift SDN cluster')).exists(),
    ).toBe(true);
  });
  it('should render a checkbox to deny all egress', () => {
    expect(wrapper.find(`[name="denyAllEgress"]`).exists()).toBe(true);
  });
  it('should render the Egress policies section', () => {
    expect(
      wrapper
        .find(FormFieldGroupExpandable)
        .findWhere((b) => b.props().toggleAriaLabel === 'Egress')
        .exists(),
    ).toBe(true);
  });
});

describe('NetworkPolicyForm with Openshift SDN CNI type', () => {
  const openShiftSDNSpec = { spec: { defaultNetwork: { type: 'OpenShiftSDN' } } };
  (useK8sGet as jest.Mock).mockReturnValue([openShiftSDNSpec, true, null]);
  const wrapper = mount(<NetworkPolicyFormComponent flags={{ OPENSHIFT: true }} />);

  it('should not render any warning', () => {
    const alert = wrapper.find(Alert);
    expect(alert.exists()).toBe(false);
  });
  it('should not render any checkbox to deny all egress', () => {
    expect(wrapper.find(`[name="denyAllEgress"]`).exists()).toBe(false);
  });
  it('should not render the Egress policies section', () => {
    expect(
      wrapper
        .find(FormFieldGroupExpandable)
        .findWhere((b) => b.props().toggleAriaLabel === 'Egress')
        .exists(),
    ).toBe(false);
  });
});

describe('NetworkPolicyForm with OVN Kubernetes CNI type', () => {
  const ovnK8sSpec = { spec: { defaultNetwork: { type: 'OVNKubernetes' } } };
  (useK8sGet as jest.Mock).mockReturnValue([ovnK8sSpec, true, null]);
  const wrapper = mount(<NetworkPolicyFormComponent flags={{ OPENSHIFT: true }} />);

  it('should not render any warning', () => {
    const alert = wrapper.find(Alert);
    expect(alert.exists()).toBe(false);
  });
  it('should render the checkbox to deny all egress', () => {
    expect(wrapper.find(`[name="denyAllEgress"]`).exists()).toBe(true);
  });
  it('should render the Egress policies section', () => {
    expect(
      wrapper
        .find(FormFieldGroupExpandable)
        .findWhere((b) => b.props().toggleAriaLabel === 'Egress')
        .exists(),
    ).toBe(true);
  });
});

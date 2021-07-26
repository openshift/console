import * as React from 'react';
import { Alert, Button } from '@patternfly/react-core';
import { mount } from 'enzyme';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { NetworkPolicyPeerIPBlock } from '../../components/network-policies/network-policy-peer-ipblock';

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

const networkPolicyPeerIPBlock = (
  <NetworkPolicyPeerIPBlock
    ipBlock={{ cidr: '0.0.0.0/0', except: [{ key: 'foo', value: 'bar' }] }}
    onChange={() => {}}
    direction={'egress'}
  />
);

describe('NetworkPolicyPeerIPBlock with Unknown CNI type', () => {
  (useK8sGet as jest.Mock).mockReturnValue([null, true, 'error fetching CNI']);
  const wrapper = mount(networkPolicyPeerIPBlock);

  it('should render a warning in case the customer is using Openshift SDN', () => {
    const alert = wrapper.find(Alert);
    expect(alert.exists()).toBe(true);
    expect(alert.props().title).toEqual(
      `${i18nNS}~When using the OpenShift SDN cluster network provider, exceptions are not supported and would cause the entire IP block section to be ignored.`,
    );
  });
  it('should render the current exceptions list', () => {
    expect(wrapper.find('input[value="bar"]').exists()).toBe(true);
  });
  it('should render a button to add an exception', () => {
    const btn = wrapper.find(Button).findWhere((b) => b.text().includes(`${i18nNS}~Add exception`));
    expect(btn.exists()).toBe(true);
  });
});

describe('NetworkPolicyPeerIPBlock with OpenShift SDN CNI type', () => {
  (useK8sGet as jest.Mock).mockReturnValue([
    { spec: { defaultNetwork: { type: 'OpenShiftSDN' } } },
    true,
    null,
  ]);
  const wrapper = mount(networkPolicyPeerIPBlock);

  it('should not render any warning', () => {
    const alert = wrapper.find(Alert);
    expect(alert.exists()).toBe(false);
  });
  it('should not render the current exceptions list', () => {
    expect(wrapper.find('input[value="bar"]').exists()).toBe(false);
  });
  it('should not render a button to add any exception', () => {
    const btn = wrapper.find(Button).findWhere((b) => b.text().includes(`${i18nNS}~Add exception`));
    expect(btn.exists()).toBe(false);
  });
});

describe('NetworkPolicyPeerIPBlock with OVN Kubernetes CNI type', () => {
  (useK8sGet as jest.Mock).mockReturnValue([
    { spec: { defaultNetwork: { type: 'OVNKubernetes' } } },
    true,
    null,
  ]);
  const wrapper = mount(networkPolicyPeerIPBlock);

  it('should not render any warning', () => {
    const alert = wrapper.find(Alert);
    expect(alert.exists()).toBe(false);
  });
  it('should render the current exceptions list', () => {
    expect(wrapper.find('input[value="bar"]').exists()).toBe(true);
  });
  it('should render a button to add an exception', () => {
    const btn = wrapper.find(Button).findWhere((b) => b.text().includes(`${i18nNS}~Add exception`));
    expect(btn.exists()).toBe(true);
  });
});

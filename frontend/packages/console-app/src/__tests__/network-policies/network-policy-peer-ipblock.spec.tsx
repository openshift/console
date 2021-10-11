import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { mount } from 'enzyme';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { t } from '../../../../../__mocks__/i18next';
import { NetworkPolicyPeerIPBlock } from '../../components/network-policies/network-policy-peer-ipblock';

const i18nNS = 'public';

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

describe('NetworkPolicyPeerIPBlock without permissions to fetch CNI type', () => {
  (useK8sGet as jest.Mock).mockReturnValue([null, true, 'error fetching CNI']);
  const wrapper = mount(networkPolicyPeerIPBlock);

  it('should render the exceptions section', () => {
    expect(
      wrapper
        .find('label')
        .findWhere((b) => b.text().includes(t(`${i18nNS}~Exceptions`)))
        .exists(),
    ).toBe(true);
    expect(wrapper.find('input[value="bar"]').exists()).toBe(true);
  });
  it('should render a button to add an exception', () => {
    const btn = wrapper
      .find(Button)
      .findWhere((b) => b.text().includes(t(`${i18nNS}~Add exception`)));
    expect(btn.exists()).toBe(true);
  });
});

describe('NetworkPolicyPeerIPBlock with Unknown CNI type', () => {
  const unknownSDNSpec = { spec: { networkType: 'Calico' } };
  (useK8sGet as jest.Mock).mockReturnValue([unknownSDNSpec, true, null]);
  const wrapper = mount(networkPolicyPeerIPBlock);

  it('should render the exceptions section', () => {
    expect(
      wrapper
        .find('label')
        .findWhere((b) => b.text().includes(t(`${i18nNS}~Exceptions`)))
        .exists(),
    ).toBe(true);
    expect(wrapper.find('input[value="bar"]').exists()).toBe(true);
  });
  it('should render a button to add an exception', () => {
    const btn = wrapper
      .find(Button)
      .findWhere((b) => b.text().includes(t(`${i18nNS}~Add exception`)));
    expect(btn.exists()).toBe(true);
  });
});

describe('NetworkPolicyPeerIPBlock with OpenShift SDN CNI type', () => {
  (useK8sGet as jest.Mock).mockReturnValue([{ spec: { networkType: 'OpenShiftSDN' } }, true, null]);
  const wrapper = mount(networkPolicyPeerIPBlock);

  it('should not render the exceptions section', () => {
    expect(
      wrapper
        .find('label')
        .findWhere((b) => b.text().includes(t(`${i18nNS}~Exceptions`)))
        .exists(),
    ).toBe(false);
  });
  it('should not render a button to add any exception', () => {
    const btn = wrapper
      .find(Button)
      .findWhere((b) => b.text().includes(t(`${i18nNS}~Add exception`)));
    expect(btn.exists()).toBe(false);
  });
});

describe('NetworkPolicyPeerIPBlock with OVN Kubernetes CNI type', () => {
  (useK8sGet as jest.Mock).mockReturnValue([
    { spec: { networkType: 'OVNKubernetes' } },
    true,
    null,
  ]);
  const wrapper = mount(networkPolicyPeerIPBlock);

  it('should render the exceptions section', () => {
    expect(
      wrapper
        .find('label')
        .findWhere((b) => b.text().includes(t(`${i18nNS}~Exceptions`)))
        .exists(),
    ).toBe(true);
    expect(wrapper.find('input[value="bar"]').exists()).toBe(true);
  });
  it('should render a button to add an exception', () => {
    const btn = wrapper
      .find(Button)
      .findWhere((b) => b.text().includes(t(`${i18nNS}~Add exception`)));
    expect(btn.exists()).toBe(true);
  });
});

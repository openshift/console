import * as React from 'react';
import { Button, DataListItem } from '@patternfly/react-core';
import { mount } from 'enzyme';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { PodModel } from '@console/internal/models';
import { NetworkPolicySelectorPreview } from '../../components/network-policies/network-policy-selector-preview';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockK8sWatchResource = useK8sWatchResource as jest.Mock;

const allNamespaces = [
  { kind: 'Namespace', metadata: { name: 'ns1' } },
  { kind: 'Namespace', metadata: { name: 'ns2' } },
];

const ns1Pods = [
  {
    kind: PodModel.kind,
    metadata: { namespace: 'ns1', name: 'pod1', labels: { foo: 'bar', baz: 'bae' } },
  },
  {
    kind: PodModel.kind,
    metadata: { namespace: 'ns1', name: 'pod2', labels: { foo: 'bar', baz: 'bae', tiki: 'taka' } },
  },
];
const ns2Pods = [
  {
    kind: PodModel.kind,
    metadata: { namespace: 'ns2', name: 'pod3', labels: { foo: 'bar', baz: 'bae' } },
  },
  {
    kind: PodModel.kind,
    metadata: { namespace: 'ns2', name: 'pod4', labels: { oh: 'yeah' } },
  },
];
const podSelector = [
  ['foo', 'bar'],
  ['baz', 'bae'],
];
const namespaceSelector = [
  ['nfoo', 'nbar'],
  ['nbaz', 'nbae'],
];
describe('NetworkPolicySelector', () => {
  const policyNamespace = 'ns1';

  beforeEach(() => {
    mockK8sWatchResource.mockClear();
  });

  it('should render only the selected pods', () => {
    // The useK8sWatchResource function returns 2 pods that fulfills the labels selector and
    // another 2 pods that don't
    mockK8sWatchResource.mockReturnValue([ns1Pods, true, null]);
    const wrapper = mount(
      <NetworkPolicySelectorPreview podSelector={podSelector} policyNamespace={policyNamespace} />,
    );
    // Make pods preview visible
    wrapper.find(Button).simulate('click');

    const pods = wrapper.find(DataListItem);
    const expectedPods = [
      { name: 'pod1', namespace: 'ns1' },
      { name: 'pod2', namespace: 'ns1' },
    ];

    expect(pods.length).toBe(expectedPods.length);
    for (let i = 0; i < expectedPods.length; i++) {
      const pod = pods.at(i);
      const expected = expectedPods[i];
      expect(pod.key()).toBe(`${expected.name}.${expected.namespace}`);
      expect(
        pod
          .findWhere((o) => o.key() === 'ns')
          .text()
          .includes(expected.namespace),
      ).toBe(true);
      expect(
        pod
          .findWhere((o) => o.key() === 'pod')
          .text()
          .includes(expected.name),
      ).toBe(true);
    }
    // verify that useK8sWatchResource has been invoked with the correct namespace
    expect(mockK8sWatchResource.mock.calls[0][0]).toEqual({
      isList: true,
      kind: 'Pod',
      namespace: 'ns1',
      selector: { matchLabels: { baz: 'bae', foo: 'bar' } },
    });
  });

  it('should render only the selected pods of the selected namespaces, if any', (done) => {
    mockK8sWatchResource.mockImplementation((res: WatchK8sResource) => {
      if (res.kind === 'Namespace') {
        return [allNamespaces, true, null];
      }
      if (res.kind === 'Pod' && res.namespace === 'ns1') {
        return [ns1Pods, true, null];
      }
      if (res.kind === 'Pod' && res.namespace === 'ns2') {
        return [ns2Pods, true, null];
      }
      done.fail(`Unexpected invocation to useK8sWatchResource: ${JSON.stringify(res)}`);
      return [null, false, 'error'];
    });

    const wrapper = mount(
      <NetworkPolicySelectorPreview
        podSelector={podSelector}
        policyNamespace={policyNamespace}
        namespaceSelector={namespaceSelector}
      />,
    );
    // Makes pods preview visible
    wrapper.find(Button).simulate('click');
    const pods = wrapper.find(DataListItem);

    const expectedPods = [
      { name: 'pod1', namespace: 'ns1' },
      { name: 'pod2', namespace: 'ns1' },
      { name: 'pod3', namespace: 'ns2' },
      { name: 'pod4', namespace: 'ns2' },
    ];

    expect(pods.length).toBe(expectedPods.length);
    for (let i = 0; i < expectedPods.length; i++) {
      const pod = pods.at(i);
      const expected = expectedPods[i];
      expect(pod.key()).toBe(`${expected.name}.${expected.namespace}`);
      expect(
        pod
          .findWhere((o) => o.key() === 'ns')
          .text()
          .includes(expected.namespace),
      ).toBe(true);
      expect(
        pod
          .findWhere((o) => o.key() === 'pod')
          .text()
          .includes(expected.name),
      ).toBe(true);
    }

    // verifies that the K8s resources have been properly fetched
    expect(mockK8sWatchResource.mock.calls[0][0]).toEqual({
      isList: true,
      kind: 'Namespace',
      selector: { matchLabels: { nbaz: 'nbae', nfoo: 'nbar' } },
    });
    expect(mockK8sWatchResource.mock.calls[1][0]).toEqual({
      isList: true,
      kind: 'Pod',
      namespace: 'ns1',
      selector: { matchLabels: { baz: 'bae', foo: 'bar' } },
    });
    expect(mockK8sWatchResource.mock.calls[2][0]).toEqual({
      isList: true,
      kind: 'Pod',
      namespace: 'ns2',
      selector: { matchLabels: { baz: 'bae', foo: 'bar' } },
    });
    done();
  });
});

import * as React from 'react';
import { mount } from 'enzyme';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NamespaceModel, PodModel } from '@console/internal/models';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { PodsPreview } from '../../components/network-policies/network-policy-selector-preview';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockK8sWatchResource = useK8sWatchResource as jest.Mock;
// - mocks returned namespaces to be `ns1`, `ns2`...
// - mocks returned pods to be `pod1`, `pod2`, `pod3`... alternating the above namespaces, with the
//   given labels
// - configures `mockK8sWatchResource` to accordingly return namespaces
const setMockK8sWatchResource = (
  numPods: number,
  numNs: number,
  labels: { [key: string]: string },
) => {
  const pods: K8sResourceCommon[] = [];
  const namespaces: K8sResourceCommon[] = [];
  for (let i = 0; i < numNs; i++) {
    namespaces.push({ kind: NamespaceModel.kind, metadata: { name: `ns${i + 1}` } });
  }
  for (let i = 0; i < numPods; i++) {
    pods.push({
      kind: PodModel.kind,
      metadata: { labels, namespace: namespaces[i % numNs].metadata?.name, name: `pod${i + 1}` },
    });
  }
  mockK8sWatchResource.mockImplementation((res) => {
    switch (res.kind) {
      case PodModel.kind:
        return [
          pods.filter((p) => !res.namespace || p.metadata.namespace === res.namespace),
          true,
          null,
        ];
      case NamespaceModel.kind:
        return [namespaces, true, null];
      default: {
        const errMsg = `k8sWatchResource invoked with unexpected type: ${res.kind}`;
        fail(errMsg);
        return [null, true, errMsg];
      }
    }
  });
};

describe('PodsPreview', () => {
  const policyNamespace = 'ns1';

  beforeEach(() => {
    mockK8sWatchResource.mockClear();
  });

  test('render pods from one namespace', () => {
    setMockK8sWatchResource(2, 1, { foo: 'bar', baz: 'bae' });
    const wrapper = mount(
      <PodsPreview
        podSelector={[
          ['foo', 'bar'],
          ['baz', 'bae'],
        ]}
        namespace={policyNamespace}
      />,
    );

    // Verify that the header with the label list is properly shown
    const header = wrapper.children().findWhere((i) => i.text().includes('List of pods matching'));
    expect(header.length).toBeGreaterThan(1);
    expect(
      header
        .first()
        .render()
        .text(),
    ).toMatch(/^List of pods matching foo=bar\s*baz=bae$/);

    // Verify that there is a first entry for the namespace, with 5 subchildren: the maximum pods
    const ns = wrapper.find('TreeViewListItem[name="ns1"]');
    expect(ns.length).toBe(1);
    const pods = ns.children().find('TreeViewListItem');
    expect(pods.length).toBe(2);
    expect(pods.at(0).prop('name')).toBe('pod1');
    expect(pods.at(1).prop('name')).toBe('pod2');
  });

  test('render pods from selected namespaces', () => {
    setMockK8sWatchResource(6, 2, {});
    const wrapper = mount(<PodsPreview podSelector={[]} namespaceSelector={[['a', 'b']]} />); // show multiple namespaces
    // It should show the first namespace with 3 children
    const ns1 = wrapper.find('TreeViewListItem[name="ns1"]');
    expect(ns1.length).toBe(1);
    const pods1 = ns1.children().find('TreeViewListItem');
    expect(pods1.length).toBe(3);
    expect(pods1.at(0).prop('name')).toBe('pod1');
    expect(pods1.at(1).prop('name')).toBe('pod3');
    expect(pods1.at(2).prop('name')).toBe('pod5');
    // It should show the second namespace only with 2 children (due to space limitation)
    const ns2 = wrapper.find('TreeViewListItem[name="ns2"]');
    expect(ns2.length).toBe(1);
    const pods2 = ns2.children().find('TreeViewListItem');
    expect(pods2.length).toBe(2);
    expect(pods2.at(0).prop('name')).toBe('pod2');
    expect(pods2.at(1).prop('name')).toBe('pod4');

    // It should not show any link but just an informative message
    const msg = wrapper.findWhere((w) => w.text() === 'Showing 5 from 6 results');
    expect(msg.length).not.toBe('a');
  });

  test('limits the number of previewed pods and shows a link to the complete list', () => {
    setMockK8sWatchResource(33, 1, { foo: 'bar' });
    const wrapper = mount(
      <PodsPreview podSelector={[['foo', 'bar']]} namespace={policyNamespace} />,
    );

    // Verify that there is a first entry for the namespace, with only 5 pods
    const ns = wrapper.find('TreeViewListItem[name="ns1"]');
    expect(ns.length).toBe(1);
    expect(ns.prop('name')).toBe('ns1');
    const pods = ns.children().find('TreeViewListItem');
    expect(pods.length).toBe(5);

    // Verify that there is a correct link to a list of filtered pods
    const link = wrapper
      .find('a')
      .findWhere((w) => w.render().prop('href') === '/k8s/ns/ns1/pods?labels=foo%3Dbar');
    expect(link.text()).toBe('View all 33 results');
  });

  test('when the pod selector is empty, the "View all" link does not attach labels', () => {
    setMockK8sWatchResource(77, 1, { foo: 'bar', baz: 'bae' });
    const wrapper = mount(<PodsPreview podSelector={[]} namespace={policyNamespace} />);
    const link = wrapper.find('a').findWhere((w) => w.render().prop('href') === '/k8s/ns/ns1/pods');
    expect(link.text()).toBe('View all 77 results');
  });

  test('when both namespace and namespaceSelctor are undefined, the link leads to all the namespaces', () => {
    setMockK8sWatchResource(12, 4, { foo: 'bar' });
    const wrapper = mount(
      <PodsPreview
        podSelector={[
          ['foo', 'bar'],
          ['baz', 'bae'],
        ]}
      />,
    );
    const link = wrapper
      .find('a')
      .findWhere(
        (w) => w.render().prop('href') === '/k8s/all-namespaces/pods?labels=foo%3Dbar%2Cbaz%3Dbae',
      );
    expect(link.text()).toBe('View all 12 results');
  });

  test('useK8sWatchResource functions are invoked correctly (only podSelector set)', () => {
    mount(
      <PodsPreview
        podSelector={[
          ['foo', 'bar'],
          ['baz', 'bae'],
        ]}
      />,
    );
    // verify that useK8sWatchResource has been invoked with the correct namespace and selector
    expect(mockK8sWatchResource.mock.calls.length).toBeGreaterThan(0);
    expect(mockK8sWatchResource.mock.calls[0].length).toBeGreaterThan(0);
    expect(mockK8sWatchResource.mock.calls[0][0]).toEqual({
      isList: true,
      kind: 'Pod',
      selector: { matchLabels: { baz: 'bae', foo: 'bar' } },
    });
  });

  test('useK8sWatchResource functions are invoked correctly (podSelector+namespace)', () => {
    mount(
      <PodsPreview
        podSelector={[
          ['foo', 'bar'],
          ['baz', 'bae'],
        ]}
        namespace={'ns1'}
      />,
    );
    // verify that useK8sWatchResource has been invoked with the correct namespace and selector
    expect(mockK8sWatchResource.mock.calls.length).toBeGreaterThan(0);
    expect(mockK8sWatchResource.mock.calls[0].length).toBeGreaterThan(0);
    expect(mockK8sWatchResource.mock.calls[0][0]).toEqual({
      isList: true,
      kind: 'Pod',
      namespace: 'ns1',
      selector: { matchLabels: { baz: 'bae', foo: 'bar' } },
    });
  });

  test('useK8sWatchResource functions are invoked correctly (podSelector+namespaceSelector)', () => {
    mount(
      <PodsPreview
        podSelector={[
          ['foo', 'bar'],
          ['baz', 'bae'],
        ]}
        namespaceSelector={[
          ['a', 'b'],
          ['c', 'd'],
        ]}
      />,
    );
    // verify that useK8sWatchResource has been invoked with the correct namespace and selector
    expect(mockK8sWatchResource.mock.calls.length).toBeGreaterThan(0);
    expect(mockK8sWatchResource.mock.calls[0].length).toBeGreaterThan(0);
    expect(mockK8sWatchResource.mock.calls[0][0]).toEqual({
      isList: true,
      kind: 'Pod',
      selector: { matchLabels: { baz: 'bae', foo: 'bar' } },
    });
    expect(mockK8sWatchResource.mock.calls[1].length).toBeGreaterThan(0);
    expect(mockK8sWatchResource.mock.calls[1][0]).toEqual({
      isList: true,
      kind: 'Namespace',
      selector: { matchLabels: { a: 'b', c: 'd' } },
    });
  });

  test('error on k8s api', () => {
    mockK8sWatchResource.mockReturnValue([null, true, 'K8s api ERROR']);
    const wrapper = mount(<PodsPreview podSelector={[]} />);
    expect(wrapper.find('Alert').text()).toContain('K8s api ERROR');
  });

  test('error on selector labels', () => {
    setMockK8sWatchResource(0, 1, {});
    const wrapper = mount(
      <PodsPreview
        podSelector={[
          ['foo-', 'bar'],
          ['baz', 'bae'],
        ]}
        namespaceSelector={[
          ['foo', 'bar'],
          ['baz', '-bae'],
        ]}
      />,
    );
    expect(wrapper.find('Alert').text()).toContain('Input error');

    // verify that the conflicting labels have been filtered in the useK8sWatchResource call
    expect(mockK8sWatchResource.mock.calls.length).toBeGreaterThan(0);
    expect(mockK8sWatchResource.mock.calls[0].length).toBeGreaterThan(0);
    expect(mockK8sWatchResource.mock.calls[0][0]).toEqual({
      isList: true,
      kind: 'Pod',
      selector: { matchLabels: {} },
    });
    expect(mockK8sWatchResource.mock.calls[1].length).toBeGreaterThan(0);
    expect(mockK8sWatchResource.mock.calls[1][0]).toEqual({
      isList: true,
      kind: 'Namespace',
      selector: { matchLabels: {} },
    });
  });

  test('no pod matches', () => {
    setMockK8sWatchResource(0, 1, {});
    const wrapper = mount(<PodsPreview podSelector={[]} />);

    // Verify that a message is shown
    const message = wrapper
      .children()
      .findWhere((i) => i.text().includes('No pods matching the provided labels'));
    expect(message.length).toBeGreaterThan(1);

    // Verify that there are no entries in the tree viw
    expect(wrapper.find('TreeView').length).toBe(0);
  });
});

import {
  getInventoryCountQuery,
  getNodePodInventoryQuery,
  getPodInventoryQuery,
} from '../prometheus-utils';

it('does not run a cluster-wide status query while node identities are still loading', () => {
  expect(getPodInventoryQuery(undefined, 'worker')).toBe('');
});
it('bounds every node status selector by unique pod UIDs', () => {
  const query = getPodInventoryQuery(undefined, 'worker', ['b', 'a', 'a']);
  const selectors = [
    ...query.matchAll(
      /kube_pod_(?:status_phase|deletion_timestamp|(?:init_)?container_status_waiting_reason)\{([^}]+)\}/g,
    ),
  ];
  expect(selectors).toHaveLength(5);
  selectors.forEach(([, labels]) => expect(labels).toContain('uid=~"a|b"'));
  expect(getNodePodInventoryQuery('worker')).toContain('node="worker"');
});
it('selects each distinct status expression once before ranking pods', () => {
  const query = getPodInventoryQuery('example');
  expect(query.match(/kube_pod_status_phase\{/g)).toHaveLength(1);
  expect(query.match(/kube_pod_deletion_timestamp\{/g)).toHaveLength(1);
  expect(query.match(/kube_pod_init_container_status_waiting_reason\{/g)).toHaveLength(1);
  expect(query).toContain('topk by (namespace, pod, uid) (1,');
});
it.each([
  ['openshift_route_info', 'route'],
  ['openshift_deploymentconfig_spec_replicas', 'deploymentconfig'],
])('returns zero for an empty OpenShift count query (%s)', (metric, identity) => {
  const query = getInventoryCountQuery(metric, identity, 'example', 'openshift-state-metrics');
  expect(query).not.toContain('kube-state-metrics');
  expect(query).toContain(`${metric}{job="openshift-state-metrics",namespace="example"}`);
  expect(query).toMatch(/or on \(\) vector\(0\)$/);
});
it('uses only exporter health to represent a node known to have no pods', () => {
  expect(getPodInventoryQuery(undefined, 'worker', [])).toBe(
    '0 * count(kube_node_info{job="kube-state-metrics",node="worker"})',
  );
});
it('rejects invalid identity values instead of broadening a selector', () => {
  expect(() => getPodInventoryQuery(undefined, 'worker', ['a|.*'])).toThrow('Invalid pod UID');
});

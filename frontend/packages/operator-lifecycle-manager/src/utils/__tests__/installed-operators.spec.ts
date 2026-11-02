import type { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import { mergeInstalledOperators } from '../installed-operators';

const csv = (name: string, namespace = 'ns-a'): ClusterServiceVersionKind =>
  ({
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'ClusterServiceVersion',
    metadata: { name, namespace, uid: `uid-${name}` },
    spec: { displayName: name },
    status: {},
  }) as unknown as ClusterServiceVersionKind;

const sub = (
  name: string,
  status: Partial<SubscriptionKind['status']> = {},
  spec: Record<string, string> = {},
  namespace = 'ns-a',
): SubscriptionKind =>
  ({
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'Subscription',
    metadata: { name, namespace, uid: `uid-sub-${name}` },
    spec: { name, ...spec },
    status,
  }) as unknown as SubscriptionKind;

const names = (items: (ClusterServiceVersionKind | SubscriptionKind)[]) =>
  items.map((i) => i.metadata.name);

describe('mergeInstalledOperators', () => {
  it('should return a CSV when only a CSV exists', () => {
    expect(names(mergeInstalledOperators([], [csv('example.v1')], [], 'ns-a'))).toEqual([
      'example.v1',
    ]);
  });

  it('should return a Subscription when no CSV exists yet', () => {
    expect(names(mergeInstalledOperators([], [], [sub('example')], 'ns-a'))).toEqual(['example']);
  });

  it('should drop a Subscription whose installedCSV is set', () => {
    const result = mergeInstalledOperators(
      [],
      [],
      [sub('example', { installedCSV: 'example.v1' })],
      'ns-a',
    );
    expect(result).toEqual([]);
  });

  it('should drop a Subscription matched by status.currentCSV', () => {
    const result = mergeInstalledOperators(
      [],
      [csv('example.v1')],
      [sub('example', { currentCSV: 'example.v1' })],
      'ns-a',
    );
    expect(names(result)).toEqual(['example.v1']);
  });

  it('should drop a Subscription matched by spec.startingCSV', () => {
    const result = mergeInstalledOperators(
      [],
      [csv('example.v1')],
      [sub('example', {}, { startingCSV: 'example.v1' })],
      'ns-a',
    );
    expect(names(result)).toEqual(['example.v1']);
  });

  it('should keep an unrelated Subscription alongside a CSV', () => {
    const result = mergeInstalledOperators([], [csv('example.v1')], [sub('other')], 'ns-a');
    expect(names(result).sort()).toEqual(['example.v1', 'other']);
  });

  it('should exclude Subscriptions from other namespaces when a namespace is selected', () => {
    const result = mergeInstalledOperators([], [], [sub('example', {}, {}, 'ns-b')], 'ns-a');
    expect(result).toEqual([]);
  });

  it('should include Subscriptions from all namespaces when no namespace is selected', () => {
    const result = mergeInstalledOperators([], [], [sub('example', {}, {}, 'ns-b')], '');
    expect(names(result)).toEqual(['example']);
  });

  it('should include global CSVs', () => {
    const result = mergeInstalledOperators(
      [csv('global.v1', 'openshift-operators')],
      [],
      [],
      'ns-a',
    );
    expect(names(result)).toEqual(['global.v1']);
  });

  it('should drop a Subscription whose installedCSV is an empty string (Critical #1 regression)', () => {
    const result = mergeInstalledOperators([], [], [sub('example', { installedCSV: '' })], 'ns-a');
    expect(result).toEqual([]);
  });

  it('should drop a Subscription whose currentCSV matches another Subscription name (Critical #2 regression)', () => {
    const subA = sub('sub-a');
    const subB = sub('sub-b', { currentCSV: 'sub-a' });
    const result = mergeInstalledOperators([], [], [subA, subB], 'ns-a');
    expect(names(result)).toEqual(['sub-a']);
  });
});

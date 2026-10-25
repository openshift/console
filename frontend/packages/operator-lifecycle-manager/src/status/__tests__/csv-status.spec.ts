import type { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import { ClusterServiceVersionPhase, CSVConditionReason } from '../../types';
import { subscriptionForCSV } from '../csv-status';

describe('subscriptionForCSV', () => {
  const csvNamespace = 'test-namespace';
  const csvName = 'test-operator.v1.0.0';

  const createCSV = (
    name: string,
    namespace: string,
    operatorNamespace?: string,
  ): ClusterServiceVersionKind => ({
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'ClusterServiceVersion',
    metadata: {
      name,
      namespace,
      ...(operatorNamespace && {
        annotations: { 'olm.operatorNamespace': operatorNamespace },
      }),
    },
    spec: {
      install: {
        strategy: 'Deployment',
        spec: {
          permissions: [],
          deployments: [],
        },
      },
    },
    status: {
      phase: ClusterServiceVersionPhase.CSVPhaseSucceeded,
      reason: CSVConditionReason.CSVReasonInstallSuccessful,
    },
  });

  const createSubscription = (
    name: string,
    namespace: string,
    installedCSV: string,
  ): SubscriptionKind => ({
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'Subscription',
    metadata: {
      name,
      namespace,
    },
    spec: {
      source: 'test-catalog',
      name: 'test-package',
    },
    status: {
      installedCSV,
    },
  });

  it('should match subscription when operator namespace annotation present', () => {
    const csv = createCSV(csvName, csvNamespace, csvNamespace);
    const subscription = createSubscription('test-sub', csvNamespace, csvName);
    const subscriptions = [subscription];

    const result = subscriptionForCSV(subscriptions, csv);

    expect(result).toBe(subscription);
  });

  it('should match subscription when operator namespace annotation missing', () => {
    const csv = createCSV(csvName, csvNamespace);
    const subscription = createSubscription('test-sub', csvNamespace, csvName);
    const subscriptions = [subscription];

    const result = subscriptionForCSV(subscriptions, csv);

    expect(result).toBe(subscription);
  });

  it('should not match subscription with different namespace', () => {
    const csv = createCSV(csvName, csvNamespace);
    const subscription = createSubscription('test-sub', 'other-namespace', csvName);
    const subscriptions = [subscription];

    const result = subscriptionForCSV(subscriptions, csv);

    expect(result).toBeUndefined();
  });

  it('should not match subscription with different installedCSV', () => {
    const csv = createCSV(csvName, csvNamespace);
    const subscription = createSubscription('test-sub', csvNamespace, 'other-operator.v1.0.0');
    const subscriptions = [subscription];

    const result = subscriptionForCSV(subscriptions, csv);

    expect(result).toBeUndefined();
  });

  it('should match subscription when operator namespace annotation differs from CSV namespace', () => {
    const operatorNs = 'operator-namespace';
    const csv = createCSV(csvName, csvNamespace, operatorNs);
    const subscription = createSubscription('test-sub', operatorNs, csvName);
    const subscriptions = [subscription];

    const result = subscriptionForCSV(subscriptions, csv);

    expect(result).toBe(subscription);
  });

  it('should return undefined when subscriptions array is empty', () => {
    const csv = createCSV(csvName, csvNamespace);
    const subscriptions: SubscriptionKind[] = [];

    const result = subscriptionForCSV(subscriptions, csv);

    expect(result).toBeUndefined();
  });

  it('should return undefined when subscription status missing installedCSV', () => {
    const csv = createCSV(csvName, csvNamespace);
    const subscription = {
      metadata: {
        name: 'test-sub',
        namespace: csvNamespace,
      },
      spec: {},
      status: {},
    } as SubscriptionKind;
    const subscriptions = [subscription];

    const result = subscriptionForCSV(subscriptions, csv);

    expect(result).toBeUndefined();
  });

  it('should match subscription when CSV has empty namespace but subscription exists', () => {
    // Edge case: CSV with empty namespace string
    const csv = createCSV(csvName, '');
    const subscription = createSubscription('test-sub', '', csvName);
    const subscriptions = [subscription];

    const result = subscriptionForCSV(subscriptions, csv);

    expect(result).toBe(subscription);
  });
});

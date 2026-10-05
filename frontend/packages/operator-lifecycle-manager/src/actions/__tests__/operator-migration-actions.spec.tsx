import { act, renderHook } from '@testing-library/react';
import { OperatorMigrationConfirmModalOverlay } from '../../components/modals/operator-migration-confirm-modal';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import type { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import {
  useOperatorMigrationBulkActions,
  useOperatorMigrationResourceActions,
} from '../operator-migration-actions';

const mockLaunchOverlay = jest.fn();
const mockMonitorMigration = jest.fn();

jest.mock('../../components/operator-migration-notifications', () => ({
  useMigrationNotifications: () => ({ monitorMigration: mockMonitorMigration }),
}));

jest.mock('@console/dynamic-plugin-sdk/src/lib-core', () => ({
  useOverlay: () => mockLaunchOverlay,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../hooks/useSubscriptions', () => ({
  useSubscriptions: jest.fn(),
}));

const makeCSV = (name: string): ClusterServiceVersionKind =>
  ({
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'ClusterServiceVersion',
    metadata: { name: `${name}.v1.0.0`, namespace: 'operators' },
    spec: { displayName: `${name} display name` },
  }) as ClusterServiceVersionKind;

const makeSubscription = (name: string, csvName: string): SubscriptionKind =>
  ({
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'Subscription',
    metadata: { name, namespace: 'operators' },
    spec: { name },
    status: { installedCSV: csvName },
  }) as SubscriptionKind;

describe('operator migration action providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the dry-run confirmation for a single CSV action', async () => {
    const csv = makeCSV('demo');
    const subscription = makeSubscription('demo-subscription', csv.metadata.name);
    (useSubscriptions as jest.Mock).mockReturnValue([[subscription], true, undefined]);

    const { result } = renderHook(() => useOperatorMigrationResourceActions(csv));
    const [actions] = result.current;
    expect(actions).toHaveLength(1);

    await act(async () => {
      (actions[0].cta as () => void)();
    });

    expect(mockLaunchOverlay).toHaveBeenCalledWith(OperatorMigrationConfirmModalOverlay, {
      operators: [
        {
          subscriptionName: 'demo-subscription',
          subscriptionNamespace: 'operators',
          displayName: 'demo display name',
        },
      ],
      isBulk: false,
      monitorMigration: mockMonitorMigration,
    });
  });

  it('opens one bulk dry-run confirmation for selected CSVs with Subscriptions', async () => {
    const firstCSV = makeCSV('first');
    const secondCSV = makeCSV('second');
    const orphanCSV = makeCSV('orphan');
    const subscriptions = [
      makeSubscription('first-subscription', firstCSV.metadata.name),
      makeSubscription('second-subscription', secondCSV.metadata.name),
    ];
    const clearSelection = jest.fn();
    (useSubscriptions as jest.Mock).mockReturnValue([subscriptions, true, undefined]);

    const { result } = renderHook(() =>
      useOperatorMigrationBulkActions({
        resources: [firstCSV, secondCSV, orphanCSV],
        getResourceId: (resource) => resource.metadata.name,
        clearSelection,
        deselect: jest.fn(),
      }),
    );
    const [actions] = result.current;
    expect(actions).toHaveLength(1);

    await act(async () => {
      (actions[0].cta as () => void)();
    });

    expect(mockLaunchOverlay).toHaveBeenCalledWith(OperatorMigrationConfirmModalOverlay, {
      operators: [
        {
          subscriptionName: 'first-subscription',
          subscriptionNamespace: 'operators',
          displayName: 'first display name',
        },
        {
          subscriptionName: 'second-subscription',
          subscriptionNamespace: 'operators',
          displayName: 'second display name',
        },
      ],
      isBulk: true,
      monitorMigration: mockMonitorMigration,
      onMigrationStarted: clearSelection,
    });
  });
});

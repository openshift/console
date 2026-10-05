import { useMemo } from 'react';
import type { K8sResourceCommon } from '@openshift/api-types';
import { useTranslation } from 'react-i18next';
import type { ExtensionHook } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type {
  Action,
  BulkResourceActionHook,
} from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { OperatorMigrationConfirmModalOverlay } from '../components/modals/operator-migration-confirm-modal';
import { useMigrationNotifications } from '../components/operator-migration-notifications';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { subscriptionForCSV } from '../status/csv-status';
import type { ClusterServiceVersionKind, SubscriptionKind } from '../types';
import type { OperatorMigrationRequest } from '../utils/operator-migration-api';

type OperatorMigrationTarget = OperatorMigrationRequest & {
  displayName: string;
};

const migrationRequestFor = (
  resource: ClusterServiceVersionKind,
  subscription: SubscriptionKind,
): OperatorMigrationTarget => ({
  subscriptionName: subscription.metadata.name,
  subscriptionNamespace: subscription.metadata.namespace,
  displayName: resource.spec?.displayName || subscription.spec?.name || subscription.metadata.name,
});

export const useOperatorMigrationResourceActions: ExtensionHook<
  Action[],
  ClusterServiceVersionKind
> = (resource) => {
  const { t } = useTranslation('olm');
  const launchOverlay = useOverlay();
  const { monitorMigration } = useMigrationNotifications();
  const [subscriptions, subscriptionsLoaded, subscriptionsLoadError] = useSubscriptions();

  const actions = useMemo(() => {
    if (
      !subscriptionsLoaded ||
      subscriptionsLoadError ||
      resource?.kind !== 'ClusterServiceVersion'
    ) {
      return [];
    }
    const subscription = subscriptionForCSV(subscriptions ?? [], resource);
    if (!subscription?.metadata?.name) {
      return [];
    }
    const target = migrationRequestFor(resource, subscription);
    return [
      {
        id: 'migrate-operator-to-olmv1',
        label: t('Migrate to Next-Gen Operators'),
        cta: () =>
          launchOverlay(OperatorMigrationConfirmModalOverlay, {
            operators: [target],
            isBulk: false,
            monitorMigration,
          }),
      },
    ];
  }, [
    launchOverlay,
    monitorMigration,
    resource,
    subscriptions,
    subscriptionsLoaded,
    subscriptionsLoadError,
    t,
  ]);

  return [actions, subscriptionsLoaded || Boolean(subscriptionsLoadError), subscriptionsLoadError];
};

export const useOperatorMigrationBulkActions: BulkResourceActionHook = ({
  resources,
  clearSelection,
}) => {
  const { t } = useTranslation('olm');
  const launchOverlay = useOverlay();
  const { monitorMigration } = useMigrationNotifications();
  const [subscriptions, subscriptionsLoaded, subscriptionsLoadError] = useSubscriptions();

  const targets = useMemo(() => {
    if (!subscriptionsLoaded || subscriptionsLoadError) {
      return [];
    }
    return resources.flatMap((resource: K8sResourceCommon) => {
      if (resource.kind !== 'ClusterServiceVersion') {
        return [];
      }
      const csv = resource as ClusterServiceVersionKind;
      const subscription = subscriptionForCSV(subscriptions ?? [], csv);
      return subscription ? [migrationRequestFor(csv, subscription)] : [];
    });
  }, [resources, subscriptions, subscriptionsLoaded, subscriptionsLoadError]);

  const actions = useMemo(() => {
    if (targets.length === 0) {
      return [];
    }
    return [
      {
        id: 'bulk-migrate-operators-to-olmv1',
        label: t('Migrate to Next-Gen Operators ({{operators}})', { operators: targets.length }),
        cta: () =>
          launchOverlay(OperatorMigrationConfirmModalOverlay, {
            operators: targets,
            isBulk: true,
            monitorMigration,
            onMigrationStarted: clearSelection,
          }),
      },
    ];
  }, [clearSelection, launchOverlay, monitorMigration, t, targets]);

  return [actions, subscriptionsLoaded || Boolean(subscriptionsLoadError), subscriptionsLoadError];
};

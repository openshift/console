import i18n from '@console/internal/i18n';
import { getName } from '@console/shared/src/selectors/common';
import { operatorNamespaceFor } from '../components/operator-group';
import type { ClusterServiceVersionKind, SubscriptionKind } from '../types';
import {
  SubscriptionState,
  ClusterServiceVersionPhase,
  ClusterServiceVersionStatus,
} from '../types';
import { upgradeRequiresApproval } from '../utils';

const pendingPhases = [
  ClusterServiceVersionPhase.CSVPhasePending,
  ClusterServiceVersionPhase.CSVPhaseInstalling,
  ClusterServiceVersionPhase.CSVPhaseReplacing,
  ClusterServiceVersionPhase.CSVPhaseDeleting,
];

export const subscriptionForCSV = (
  subscriptions: SubscriptionKind[],
  csv: ClusterServiceVersionKind,
): SubscriptionKind => {
  const csvName = getName(csv);
  const operatorNamespace = operatorNamespaceFor(csv);
  return (subscriptions ?? []).find((subscription) => {
    const subscriptionNamespace = subscription.metadata?.namespace || '';
    const installedCSV = subscription.status?.installedCSV || '';
    return (
      operatorNamespace &&
      csvName &&
      subscriptionNamespace === operatorNamespace &&
      installedCSV === csvName
    );
  });
};

export const getCSVStatus = (
  csv: ClusterServiceVersionKind,
): { status: ClusterServiceVersionStatus; title: string } => {
  const statusPhase = csv?.status?.phase ?? ClusterServiceVersionPhase.CSVPhaseUnknown;
  // TODO Get rid of let.
  let status: ClusterServiceVersionStatus;
  if (pendingPhases.includes(statusPhase)) {
    status = ClusterServiceVersionStatus.Pending;
  } else {
    switch (statusPhase) {
      case ClusterServiceVersionPhase.CSVPhaseSucceeded:
        status = ClusterServiceVersionStatus.OK;
        break;
      case ClusterServiceVersionPhase.CSVPhaseFailed:
        status = ClusterServiceVersionStatus.Failed;
        break;
      default:
        return {
          status: ClusterServiceVersionStatus.Unknown,
          title: statusPhase,
        };
    }
  }
  return {
    status,
    title: statusPhase,
  };
};

export const getSubscriptionStatus = (subscription: SubscriptionKind): SubscriptionStatus => {
  const status = subscription?.status?.state ?? SubscriptionState.SubscriptionStateNone;
  switch (status) {
    case SubscriptionState.SubscriptionStateUpgradeAvailable:
      return {
        status,
        title: i18n.t('olm~Upgrade available'),
      };
    case SubscriptionState.SubscriptionStateUpgradePending:
      return upgradeRequiresApproval(subscription)
        ? {
            status: SubscriptionState.SubscriptionStateUpgradeAvailable,
            title: i18n.t('olm~Upgrade available'),
          }
        : {
            status,
            title: i18n.t('olm~Upgrading'),
          };
    case SubscriptionState.SubscriptionStateAtLatest:
      return {
        status,
        title: i18n.t('olm~Up to date'),
      };
    default:
      return {
        status,
        title: '',
      };
  }
};

type SubscriptionStatus = { status: SubscriptionState; title?: string };

import * as _ from 'lodash';
import i18n from '@console/internal/i18n';
import { getName } from '@console/shared/src/selectors/common';
import {
  ClusterServiceVersionKind,
  SubscriptionKind,
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
): SubscriptionKind =>
  // TODO Replace _.find with Array.prototype.find
  _.find(subscriptions, {
    metadata: {
      // FIXME Magic string. Make a constant.
      namespace: csv?.metadata?.annotations?.['olm.operatorNamespace'],
    },
    status: {
      installedCSV: getName(csv),
    },
    // TODO Imporove this type def
  } as any); // 'as any' to supress typescript error caused by lodash;

export const getCSVStatus = (
  csv: ClusterServiceVersionKind,
): { status: ClusterServiceVersionStatus; title: string } => {
  const statusPhase = csv?.status?.phase ?? ClusterServiceVersionPhase.CSVPhaseUnknown;
  // TODO Get rid of let.
  let status: ClusterServiceVersionStatus;
  if (pendingPhases.includes(statusPhase)) {
    status = i18n.t('olm~Pending');
  } else {
    switch (statusPhase) {
      case ClusterServiceVersionPhase.CSVPhaseSucceeded:
        status = i18n.t('olm~OK');
        break;
      case ClusterServiceVersionPhase.CSVPhaseFailed:
        status = i18n.t('olm~Failed');
        break;
      default:
        return {
          status: i18n.t('olm~Unknown'),
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

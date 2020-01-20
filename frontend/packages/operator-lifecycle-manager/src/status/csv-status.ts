import * as _ from 'lodash';
import { getName } from '@console/shared/src/selectors/common';
import {
  ClusterServiceVersionKind,
  SubscriptionKind,
  SubscriptionState,
  ClusterServiceVersionPhase,
  ClusterServiceVersionStatus,
} from '../types';

const pedingPhases = [
  ClusterServiceVersionPhase.CSVPhasePending,
  ClusterServiceVersionPhase.CSVPhaseInstalling,
  ClusterServiceVersionPhase.CSVPhaseReplacing,
  ClusterServiceVersionPhase.CSVPhaseDeleting,
];

export const subscriptionForCSV = (
  subscriptions: SubscriptionKind[],
  csv: ClusterServiceVersionKind,
): SubscriptionKind =>
  _.find(subscriptions, {
    metadata: {
      namespace: _.get(csv, ['metadata', 'annotations', 'olm.operatorNamespace']),
    },
    status: {
      installedCSV: getName(csv),
    },
  } as any); // 'as any' to supress typescript error caused by lodash;

export const getCSVStatus = (
  csv: ClusterServiceVersionKind,
): { status: ClusterServiceVersionStatus; title: string } => {
  const statusPhase = _.get(csv, 'status.phase', ClusterServiceVersionPhase.CSVPhaseUnknown);
  let status: ClusterServiceVersionStatus;
  if (pedingPhases.includes(statusPhase)) {
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

export const getSubscriptionStatus = (
  subscription: SubscriptionKind,
): { status: SubscriptionState; title?: string } => {
  const state = _.get(subscription, 'status.state', SubscriptionState.SubscriptionStateNone);
  let title: string;
  switch (state) {
    case SubscriptionState.SubscriptionStateUpgradeAvailable:
      title = 'Upgrade available';
      break;
    case SubscriptionState.SubscriptionStateUpgradePending:
      title = 'Upgrading';
      break;
    case SubscriptionState.SubscriptionStateAtLatest:
      title = 'Up to date';
      break;
    default:
      title = '';
  }
  return { status: state, title };
};

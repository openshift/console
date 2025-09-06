import * as _ from 'lodash';
import { OperatorStatusPriority, GetOperatorsWithStatuses } from '@console/plugin-sdk';
import { getOperatorsStatus } from '@console/shared/src/components/dashboard/status-card/state-utils';
import {
  HealthState,
  healthStateMapping,
} from '@console/shared/src/components/dashboard/status-card/states';
import { getSubscriptionStatus, getCSVStatus, subscriptionForCSV } from '../../status/csv-status';
import {
  ClusterServiceVersionKind,
  SubscriptionKind,
  SubscriptionState,
  ClusterServiceVersionStatus,
} from '../../types';

const getOperatorStatus = (
  subscriptionStatus: { status: SubscriptionState; title?: string },
  csvStatus: { status: ClusterServiceVersionStatus; title?: string },
): OperatorStatusPriority => {
  let operatorHealth: HealthState;
  switch (csvStatus.status) {
    case ClusterServiceVersionStatus.Failed:
      operatorHealth = HealthState.ERROR;
      break;
    case ClusterServiceVersionStatus.Pending:
      operatorHealth = HealthState.PROGRESS;
      break;
    case ClusterServiceVersionStatus.Unknown:
      operatorHealth = HealthState.UNKNOWN;
      break;
    default:
      operatorHealth = HealthState.OK;
  }
  if (
    operatorHealth !== HealthState.ERROR &&
    subscriptionStatus.status === SubscriptionState.SubscriptionStateUpgradePending
  ) {
    const subscriptionTitle = subscriptionStatus.title || '';
    return {
      ...healthStateMapping[HealthState.UPDATING],
      title: subscriptionTitle,
    };
  }
  if (
    operatorHealth !== HealthState.ERROR &&
    subscriptionStatus.status === SubscriptionState.SubscriptionStateUpgradeAvailable
  ) {
    const subscriptionTitle = subscriptionStatus.title || '';
    return {
      ...healthStateMapping[HealthState.UPGRADABLE],
      title: subscriptionTitle,
    };
  }
  const csvTitle = csvStatus.title || '';
  return {
    ...healthStateMapping[operatorHealth],
    title: csvTitle,
  };
};

const getCSVPriorityStatus = (
  csv: ClusterServiceVersionKind,
  subscriptions: SubscriptionKind[],
): OperatorStatusPriority => {
  const subscriptionStatus = getSubscriptionStatus(subscriptionForCSV(subscriptions, csv));
  const csvStatus = getCSVStatus(csv);
  return getOperatorStatus(subscriptionStatus, csvStatus);
};

export const getClusterServiceVersionsWithStatuses: GetOperatorsWithStatuses<ClusterServiceVersionKind> = (
  resources,
) => {
  const grouppedOperators = _.groupBy(
    resources.clusterServiceVersions.data as ClusterServiceVersionKind[],
    (o) => o.metadata?.name || '',
  );
  return _.values(grouppedOperators).map((operators) =>
    getOperatorsStatus<ClusterServiceVersionKind>(operators, (csv) =>
      getCSVPriorityStatus(csv, resources.subscriptions.data as SubscriptionKind[]),
    ),
  );
};

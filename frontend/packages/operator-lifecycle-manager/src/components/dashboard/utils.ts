import * as _ from 'lodash';
import { getNamespace } from '@console/shared/src/selectors/common';
import { SubscriptionKind, SubscriptionState, ClusterServiceVersionKind } from '../../types';
import { subscriptionForCSV } from '..';

export const isClusterServiceVersionUpgradeActivity: ClusterServiceVersionUpgradeActivity = (
  csv,
  additionalResources,
) => {
  const csvSubscription = subscriptionForCSV(additionalResources.subscriptions, csv);
  return (
    _.get(csvSubscription, 'status.state') === SubscriptionState.SubscriptionStateUpgradePending &&
    getNamespace(csvSubscription) === csv.metadata.namespace
  );
};

type ClusterServiceVersionUpgradeActivity = (
  csv: ClusterServiceVersionKind,
  additionalResources: { subscriptions: SubscriptionKind[] },
) => boolean;

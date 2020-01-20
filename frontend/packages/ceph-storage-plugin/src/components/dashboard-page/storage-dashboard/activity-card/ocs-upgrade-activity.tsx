import * as React from 'react';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { SubscriptionState, SubscriptionKind } from '@console/operator-lifecycle-manager';
import { getSubscriptionStatus } from '@console/operator-lifecycle-manager/src/status/csv-status';

export const isOCSUpgradeActivity = (subscription: SubscriptionKind): boolean =>
  getSubscriptionStatus(subscription).status === SubscriptionState.SubscriptionStateUpgradePending;

export const OCSUpgradeActivity: React.FC = () => (
  <ActivityItem>Upgrading OCS Operator</ActivityItem>
);

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { SubscriptionState, SubscriptionKind } from '@console/operator-lifecycle-manager';
import { getSubscriptionStatus } from '@console/operator-lifecycle-manager/src/status/csv-status';

export const isOCSUpgradeActivity = (subscription: SubscriptionKind): boolean =>
  getSubscriptionStatus(subscription).status === SubscriptionState.SubscriptionStateUpgradePending;

export const OCSUpgradeActivity: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ActivityItem>
      {t("ceph-storage-plugin~Upgrading OpenShift Container Storage's Operator")}
    </ActivityItem>
  );
};

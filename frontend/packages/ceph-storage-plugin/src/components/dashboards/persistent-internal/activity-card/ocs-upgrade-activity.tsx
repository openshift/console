import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  SubscriptionKind,
  SubscriptionState,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { getSubscriptionStatus } from '@console/operator-lifecycle-manager/src/status/csv-status';

export const isOCSUpgradeActivity = (subscription: SubscriptionKind): boolean =>
  getSubscriptionStatus(subscription).status === SubscriptionState.SubscriptionStateUpgradePending;

export const OCSUpgradeActivity: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ActivityItem>
      {t("ceph-storage-plugin~Upgrading OpenShift Data Foundation's Operator")}
    </ActivityItem>
  );
};

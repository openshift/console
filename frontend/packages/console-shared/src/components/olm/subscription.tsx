import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Kebab, resourcePathFromModel } from '@console/internal/components/utils';
import {
  SubscriptionKind,
  SubscriptionState,
} from 'packages/console-dynamic-plugin-sdk/src/api/internal-types';
import {
  BlueArrowCircleUpIcon,
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
} from '../status';
import { InstallPlanModel } from './models';

export const subscriptionTableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  Kebab.columnClass,
];

export const UpgradeApprovalLink: React.FC<{ subscription: SubscriptionKind }> = ({
  subscription,
}) => {
  const { t } = useTranslation();
  const to = resourcePathFromModel(
    InstallPlanModel,
    subscription.status.installPlanRef.name,
    subscription.metadata.namespace,
  );
  return (
    <span className="co-icon-and-text">
      <Link to={to}>
        <BlueArrowCircleUpIcon /> {t('console-shared~Upgrade available')}
      </Link>
    </span>
  );
};

export const upgradeRequiresApproval = (subscription: SubscriptionKind): boolean =>
  subscription?.status?.state === SubscriptionState.SubscriptionStateUpgradePending &&
  (subscription.status?.conditions ?? []).filter(
    ({ status, reason }) => status === 'True' && reason === 'RequiresApproval',
  ).length > 0;

export const SubscriptionStatus: React.FC<{ subscription: SubscriptionKind }> = ({
  subscription,
}) => {
  const { t } = useTranslation();
  switch (subscription.status.state) {
    case SubscriptionState.SubscriptionStateUpgradeAvailable:
      return (
        <span>
          <YellowExclamationTriangleIcon /> {t('console-shared~Upgrade available')}
        </span>
      );
    case SubscriptionState.SubscriptionStateUpgradePending:
      return upgradeRequiresApproval(subscription) && subscription.status.installPlanRef ? (
        <UpgradeApprovalLink subscription={subscription} />
      ) : (
        <span>
          <InProgressIcon className="text-primary" /> {t('console-shared~Upgrading')}
        </span>
      );
    case SubscriptionState.SubscriptionStateAtLatest:
      return (
        <span>
          <GreenCheckCircleIcon /> {t('console-shared~Up to date')}
        </span>
      );
    default:
      return (
        <span className={_.isEmpty(subscription.status.state) ? 'text-muted' : ''}>
          {subscription.status.state || t('console-shared~Unknown failure')}
        </span>
      );
  }
};

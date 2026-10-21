import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk/src';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { usePubSubModalLauncher } from '../components/pub-sub/PubSubController';
import { EventingSubscriptionModel } from '../models';

export const SUBSCRIPTION_ACTION_ID = 'eventing-subscription-action';

export const useAddSubscriptionAction = (source?: K8sResourceKind): Action => {
  const { t } = useTranslation('knative-plugin');
  const pubSubModalLauncher = usePubSubModalLauncher({ source });
  return useMemo(
    () => ({
      id: SUBSCRIPTION_ACTION_ID,
      label: t('Add Subscription'),
      cta: pubSubModalLauncher,
      accessReview: asAccessReview(EventingSubscriptionModel, source, 'create'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  );
};

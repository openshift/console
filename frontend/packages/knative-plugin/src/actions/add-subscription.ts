import * as React from 'react';
import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { usePubSubModalLauncher } from '../components/pub-sub/PubSubController';
import { EventingSubscriptionModel } from '../models';

export const SUBSCRIPTION_ACTION_ID = 'eventing-subscription-action';

export const useAddSubscriptionAction = (source?: K8sResourceKind): Action => {
  const pubSubModalLauncher = usePubSubModalLauncher({ source });
  return React.useMemo(
    () => ({
      id: SUBSCRIPTION_ACTION_ID,
      label: i18next.t('knative-plugin~Add Subscription'),
      cta: pubSubModalLauncher,
      accessReview: {
        group: EventingSubscriptionModel.apiGroup,
        resource: EventingSubscriptionModel.plural,
        name: source?.metadata?.name,
        namespace: source?.metadata?.namespace,
        verb: 'create',
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  );
};

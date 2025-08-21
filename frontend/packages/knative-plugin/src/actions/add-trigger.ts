import * as React from 'react';
import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { usePubSubModalLauncher } from '../components/pub-sub/PubSubController';
import { EventingTriggerModel } from '../models';

export const TRIGGER_ACTION_ID = 'eventing-trigger-add';

export const useAddTriggerAction = (source?: K8sResourceKind): Action => {
  const pubSubModalLauncher = usePubSubModalLauncher({ source });
  return React.useMemo<Action>(
    () => ({
      id: TRIGGER_ACTION_ID,
      label: i18next.t('knative-plugin~Add Trigger'),
      cta: pubSubModalLauncher,
      accessReview: {
        group: EventingTriggerModel.apiGroup,
        resource: EventingTriggerModel.plural,
        name: source?.metadata?.name,
        namespace: source?.metadata?.namespace,
        verb: 'create',
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  );
};

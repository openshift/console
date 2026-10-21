import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk/src';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { usePubSubModalLauncher } from '../components/pub-sub/PubSubController';
import { EventingTriggerModel } from '../models';

export const TRIGGER_ACTION_ID = 'eventing-trigger-add';

export const useAddTriggerAction = (source?: K8sResourceKind): Action => {
  const { t } = useTranslation('knative-plugin');
  const pubSubModalLauncher = usePubSubModalLauncher({ source });
  return useMemo<Action>(
    () => ({
      id: TRIGGER_ACTION_ID,
      label: t('Add Trigger'),
      cta: pubSubModalLauncher,
      accessReview: asAccessReview(EventingTriggerModel, source, 'create'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  );
};

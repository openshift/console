import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { addPubSubConnectionModal } from '../components/pub-sub/PubSubModalLauncher';
import { EventingTriggerModel } from '../models';

export const TRIGGER_ACTION_ID = 'eventing-trigger-add';

export const addTrigger = (model: K8sKind, source: K8sResourceKind): KebabOption => {
  return {
    // t('knative-plugin~Add Trigger')
    labelKey: 'knative-plugin~Add Trigger',
    callback: () =>
      addPubSubConnectionModal({
        source,
      }),
    accessReview: {
      group: EventingTriggerModel.apiGroup,
      resource: EventingTriggerModel.plural,
      name: source.metadata.name,
      namespace: source.metadata.namespace,
      verb: 'create',
    },
  };
};

export const AddTriggerAction = (source: K8sResourceKind): Action => {
  return {
    id: TRIGGER_ACTION_ID,
    label: i18next.t('knative-plugin~Add Trigger'),
    cta: () =>
      addPubSubConnectionModal({
        source,
      }),
    accessReview: {
      group: EventingTriggerModel.apiGroup,
      resource: EventingTriggerModel.plural,
      name: source.metadata.name,
      namespace: source.metadata.namespace,
      verb: 'create',
    },
  };
};

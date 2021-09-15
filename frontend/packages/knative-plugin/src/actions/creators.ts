import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { setSinkPubsubModal } from '../components/modals';
import { addPubSubConnectionModal } from '../components/pub-sub/PubSubModalLauncher';
import { EventingSubscriptionModel, EventingTriggerModel } from '../models';

export const moveSinkPubsub = (model: K8sKind, source: K8sResourceKind): Action => ({
  id: 'move-sink-pubsub',
  label: i18next.t('knative-plugin~Move {{kind}}', {
    kind: model.label,
  }),
  cta: () =>
    setSinkPubsubModal({
      source,
      resourceType: model.labelKey ? i18next.t(model.labelKey) : model.label,
    }),
  accessReview: {
    group: model.apiGroup,
    resource: model.plural,
    name: source.metadata.name,
    namespace: source.metadata.namespace,
    verb: 'update',
  },
});

export const addTriggerBroker = (model: K8sKind, source: K8sResourceKind): Action => ({
  id: 'add-tigger-broker',
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
});

export const addSubscriptionChannel = (model: K8sKind, source: K8sResourceKind): Action => ({
  id: 'add-subscription-channel',
  label: i18next.t('knative-plugin~Add Subscription'),
  cta: () =>
    addPubSubConnectionModal({
      source,
    }),
  accessReview: {
    group: EventingSubscriptionModel.apiGroup,
    resource: EventingSubscriptionModel.plural,
    name: source.metadata.name,
    namespace: source.metadata.namespace,
    verb: 'create',
  },
});

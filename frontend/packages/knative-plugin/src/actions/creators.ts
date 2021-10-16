import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { truncateMiddle } from '@console/internal/components/utils/truncate-middle';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '@console/shared/src/constants';
import {
  setSinkPubsubModal,
  deleteRevisionModal,
  setTrafficDistributionModal,
  editSinkUriModal,
  setSinkSourceModal,
} from '../components/modals';
import { addPubSubConnectionModal } from '../components/pub-sub/PubSubModalLauncher';
import { EventingSubscriptionModel, EventingTriggerModel } from '../models';

export const setTrafficDistribution = (kind: K8sKind, obj: K8sResourceKind): Action => ({
  id: 'set-traffic-distribution',
  label: i18next.t('knative-plugin~Set traffic distribution'),
  cta: () =>
    setTrafficDistributionModal({
      obj,
    }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'update',
  },
});

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

export const editKnativeService = (kind: K8sKind, obj: K8sResourceKind): Action => ({
  id: 'edit-knative-service',
  label: i18next.t('knative-plugin~Edit {{applicationName}}', {
    applicationName: truncateMiddle(obj.metadata.name, { length: RESOURCE_NAME_TRUNCATE_LENGTH }),
  }),
  cta: {
    href: `/edit/ns/${obj.metadata.namespace}?name=${obj.metadata.name}&kind=${obj.kind ||
      kind.kind}`,
  },
  insertAfter: 'edit-resource-limits',
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'update',
  },
});

export const moveSinkSource = (model: K8sKind, source: K8sResourceKind): Action => ({
  id: 'move-sink-source',
  label: i18next.t('knative-plugin~Move sink'),
  cta: () =>
    setSinkSourceModal({
      source,
    }),
  accessReview: {
    group: model.apiGroup,
    resource: model.plural,
    name: source.metadata.name,
    namespace: source.metadata.namespace,
    verb: 'update',
  },
});

export const deleteRevision = (model: K8sKind, revision: K8sResourceKind): Action => ({
  id: 'delete-revision',
  label: i18next.t('knative-plugin~Delete Revision'),
  cta: () =>
    deleteRevisionModal({
      revision,
    }),
  accessReview: {
    group: model.apiGroup,
    resource: model.plural,
    name: revision.metadata.name,
    namespace: revision.metadata.namespace,
    verb: 'delete',
  },
});

export const editSinkUri = (
  model: K8sKind,
  source: K8sResourceKind,
  resources: K8sResourceKind[],
): Action => ({
  id: 'edit-sink-uri',
  label: i18next.t('knative-plugin~Edit URI'),
  cta: () =>
    editSinkUriModal({
      source,
      eventSourceList: resources,
    }),
  accessReview: {
    group: model.apiGroup,
    resource: model.plural,
    name: resources[0].metadata.name,
    namespace: resources[0].metadata.namespace,
    verb: 'update',
  },
});

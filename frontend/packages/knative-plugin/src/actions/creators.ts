import { useMemo } from 'react';
import i18next from 'i18next';
import type { Action } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { LazyDeleteModalOverlay } from '@console/internal/components/modals';
import { asAccessReview, resourceObjPath } from '@console/internal/components/utils';
import { truncateMiddle } from '@console/internal/components/utils/truncate-middle';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '@console/shared/src/constants';
import { cleanUpWorkload } from '@console/topology/src/utils';
import { usePubSubModalLauncher } from '../components/pub-sub/PubSubController';
import { useDeleteRevisionModalLauncher } from '../components/revisions/DeleteRevisionModalController';
import { useSinkPubsubModalLauncher } from '../components/sink-pubsub/SinkPubsubController';
import { useSinkUriModalLauncher } from '../components/sink-uri/SinkUriController';
import { useTestFunctionModalLauncher } from '../components/test-function/TestFunctionController';
import { useTrafficSplittingModalLauncher } from '../components/traffic-splitting/TrafficSplittingController';
import { EventingSubscriptionModel, EventingTriggerModel } from '../models';
import { ServiceTypeValue } from '../types';

export const useSetTrafficDistributionAction = (kind: K8sKind, obj: K8sResourceKind): Action => {
  const trafficDistributionModalLauncher = useTrafficSplittingModalLauncher({ obj });
  return useMemo<Action>(
    () => ({
      id: 'set-traffic-distribution',
      label: i18next.t('knative-plugin~Set traffic distribution'),
      cta: trafficDistributionModalLauncher,
      accessReview: asAccessReview(kind, obj, 'update'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind.apiGroup, kind.plural, obj?.metadata?.name, obj?.metadata?.namespace],
  );
};

export const useMoveSinkPubsubAction = (model: K8sKind, source: K8sResourceKind): Action => {
  const sinkPubsubModalLauncher = useSinkPubsubModalLauncher({
    source,
    resourceType: model.labelKey ? i18next.t(model.labelKey) : model.label,
  });
  return useMemo<Action>(
    () => ({
      id: 'move-sink-pubsub',
      label: i18next.t('knative-plugin~Move {{kind}}', {
        kind: model.label,
      }),
      cta: sinkPubsubModalLauncher,
      accessReview: asAccessReview(model, source, 'update'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, source],
  );
};

export const useAddTriggerBrokerAction = (model: K8sKind, source: K8sResourceKind): Action => {
  const pubSubModalLauncher = usePubSubModalLauncher({ source });
  return useMemo<Action>(
    () => ({
      id: 'add-tigger-broker',
      label: i18next.t('knative-plugin~Add Trigger'),
      cta: pubSubModalLauncher,
      accessReview: asAccessReview(EventingTriggerModel, source, 'create'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  );
};

export const useAddSubscriptionChannelAction = (
  model: K8sKind,
  source: K8sResourceKind,
): Action => {
  const pubSubModalLauncher = usePubSubModalLauncher({ source });
  return useMemo<Action>(
    () => ({
      id: 'add-subscription-channel',
      label: i18next.t('knative-plugin~Add Subscription'),
      cta: pubSubModalLauncher,
      accessReview: asAccessReview(EventingSubscriptionModel, source, 'create'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  );
};

export const editKnativeService = (kind: K8sKind, obj: K8sResourceKind): Action => ({
  id: 'edit-knative-service',
  label: i18next.t('knative-plugin~Edit {{applicationName}}', {
    applicationName: truncateMiddle(obj.metadata.name, { length: RESOURCE_NAME_TRUNCATE_LENGTH }),
  }),
  cta: {
    href: `/edit/ns/${obj.metadata.namespace}?name=${obj.metadata.name}&kind=${
      obj.kind || kind.kind
    }`,
  },
  insertAfter: 'edit-resource-limits',
  accessReview: asAccessReview(kind, obj, 'update'),
});

export const editKnativeServiceResource = (
  kind: K8sKind,
  obj: K8sResourceKind,
  serviceTypeValue: ServiceTypeValue,
): Action => {
  return {
    id: 'edit-service',
    label:
      serviceTypeValue === ServiceTypeValue.Function
        ? i18next.t('knative-plugin~Edit Function')
        : i18next.t('knative-plugin~Edit Service'),
    cta: {
      href:
        serviceTypeValue === ServiceTypeValue.Function
          ? `/functions/ns/${obj.metadata.namespace}/${obj.metadata.name}/yaml`
          : `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/yaml`,
    },
    insertAfter: 'edit-annotations',
    accessReview: asAccessReview(kind, obj, 'update'),
  };
};

export const useDeleteKnativeServiceResource = (
  kind: K8sKind | undefined,
  obj: K8sResourceKind,
  serviceTypeValue: ServiceTypeValue,
  serviceCreatedFromWebFlag: boolean,
): Action => {
  const launchModal = useOverlay();

  return useMemo<Action>(
    () => ({
      id: `delete-resource`,
      label:
        serviceTypeValue === ServiceTypeValue.Function
          ? i18next.t('knative-plugin~Delete Function')
          : i18next.t('knative-plugin~Delete Service'),
      cta: () =>
        launchModal(
          LazyDeleteModalOverlay,
          serviceCreatedFromWebFlag
            ? {
                kind,
                resource: obj,
                deleteAllResources: () => cleanUpWorkload(obj),
              }
            : {
                kind,
                resource: obj,
              },
        ),
      accessReview: asAccessReview(kind as K8sKind, obj, 'delete'),
    }),
    [kind, obj, serviceTypeValue, serviceCreatedFromWebFlag, launchModal],
  );
};

export const moveSinkSource = (
  model: K8sKind,
  source: K8sResourceKind,
  sinkSourceModalLauncher: () => void,
): Action => {
  return {
    id: 'move-sink-source',
    label: i18next.t('knative-plugin~Move sink'),
    cta: sinkSourceModalLauncher,
    accessReview: asAccessReview(model, source, 'update'),
  };
};

export const useDeleteRevisionAction = (model: K8sKind, revision: K8sResourceKind): Action => {
  const deleteRevisionModalLauncher = useDeleteRevisionModalLauncher({ revision });
  return useMemo<Action>(
    () => ({
      id: 'delete-revision',
      label: i18next.t('knative-plugin~Delete Revision'),
      cta: deleteRevisionModalLauncher,
      accessReview: asAccessReview(model, revision, 'delete'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, revision],
  );
};

export const useEditSinkUriAction = (
  model: K8sKind,
  source: K8sResourceKind,
  resources: K8sResourceKind[],
): Action => {
  const editSinkUriModalLauncher = useSinkUriModalLauncher({ source, eventSourceList: resources });
  return useMemo<Action>(
    () => ({
      id: 'edit-sink-uri',
      label: i18next.t('knative-plugin~Edit URI'),
      cta: editSinkUriModalLauncher,
      accessReview: {
        group: model?.apiGroup,
        resource: model?.plural,
        name: resources?.[0]?.metadata.name,
        namespace: resources?.[0]?.metadata.namespace,
        verb: 'update',
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model?.apiGroup, model?.plural, resources],
  );
};

export const useTestServerlessFunctionAction = (model: K8sKind, obj: K8sResourceKind): Action => {
  const testServerlessFunctionLauncher = useTestFunctionModalLauncher({ obj });
  return useMemo<Action>(
    () => ({
      id: 'test-serverless-function',
      label: i18next.t('knative-plugin~Test Serverless Function'),
      cta: testServerlessFunctionLauncher,
      insertBefore: 'modify-application',
      disabledTooltip: i18next.t('knative-plugin~Serverless function is not ready to test'),
      disabled: obj?.status?.conditions.some((cond) => cond.status !== 'True'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [obj?.status?.conditions],
  );
};

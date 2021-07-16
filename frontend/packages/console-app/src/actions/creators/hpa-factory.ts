import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import {
  K8sResourceKind,
  K8sKind,
  referenceForModel,
  K8sResourceCommon,
  HorizontalPodAutoscalerKind,
} from '@console/internal/module/k8s';
import { deleteHPAModal } from '@console/shared';
import { ResourceActionFactory } from './common-factory';

const hpaRoute = ({ metadata: { name, namespace } }: K8sResourceCommon, kind: K8sKind) =>
  `/workload-hpa/ns/${namespace}/${referenceForModel(kind)}/${name}`;

export const HpaActionFactory: ResourceActionFactory = {
  AddHorizontalPodAutoScaler: (kind: K8sKind, obj: K8sResourceKind) => ({
    id: 'add-hpa',
    label: i18next.t('console-app~Add HorizontalPodAutoscaler'),
    cta: { href: hpaRoute(obj, kind) },
    insertBefore: 'add-storage',
    accessReview: {
      group: HorizontalPodAutoscalerModel.apiGroup,
      resource: HorizontalPodAutoscalerModel.plural,
      namespace: obj.metadata.namespace,
      verb: 'create',
    },
  }),
  EditHorizontalPodAutoScaler: (kind: K8sKind, obj: K8sResourceCommon) => ({
    id: 'edit-hpa',
    label: i18next.t('console-app~Edit HorizontalPodAutoscaler'),
    cta: { href: hpaRoute(obj, kind) },
    insertBefore: 'add-storage',
    accessReview: {
      group: HorizontalPodAutoscalerModel.apiGroup,
      resource: HorizontalPodAutoscalerModel.plural,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  }),
  DeleteHorizontalPodAutoScaler: (
    kind: K8sKind,
    obj: K8sResourceCommon,
    relatedHPA: HorizontalPodAutoscalerKind,
  ) => ({
    id: 'delete-hpa',
    label: i18next.t('console-app~Remove HorizontalPodAutoscaler'),
    insertBefore: 'edit-resource-limits',
    cta: () => {
      deleteHPAModal({
        workload: obj,
        hpa: relatedHPA,
      });
    },
    accessReview: {
      group: HorizontalPodAutoscalerModel.apiGroup,
      resource: HorizontalPodAutoscalerModel.plural,
      namespace: obj.metadata.namespace,
      verb: 'delete',
    },
  }),
};

export const getHpaActions = (
  kind: K8sKind,
  obj: K8sResourceKind,
  relatedHPAs: K8sResourceKind[],
): Action[] => {
  if (relatedHPAs.length === 0) return [HpaActionFactory.AddHorizontalPodAutoScaler(kind, obj)];

  return [
    HpaActionFactory.EditHorizontalPodAutoScaler(kind, obj),
    HpaActionFactory.DeleteHorizontalPodAutoScaler(kind, obj, relatedHPAs[0]),
  ];
};

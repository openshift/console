import * as React from 'react';
import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import {
  K8sResourceKind,
  K8sKind,
  referenceForModel,
  K8sResourceCommon,
  HorizontalPodAutoscalerKind,
} from '@console/internal/module/k8s';
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';
import {
  deleteHPAModal,
  isHelmResource,
  isOperatorBackedService,
  useActiveNamespace,
} from '@console/shared';
import { doesHpaMatch } from '@console/shared/src/utils/hpa-utils';
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

type DeploymentActionExtraResources = {
  hpas: HorizontalPodAutoscalerKind[];
  csvs: ClusterServiceVersionKind[];
};

export const useHPAActions = (kindObj: K8sKind, resource: K8sResourceKind) => {
  const [namespace] = useActiveNamespace();
  const watchedResources = React.useMemo(
    () => ({
      hpas: {
        isList: true,
        kind: HorizontalPodAutoscalerModel.kind,
        namespace,
        optional: true,
      },
      csvs: {
        isList: true,
        kind: referenceForModel(ClusterServiceVersionModel),
        namespace,
        optional: true,
      },
    }),
    [namespace],
  );
  const extraResources = useK8sWatchResources<DeploymentActionExtraResources>(watchedResources);
  const relatedHPAs = React.useMemo(() => extraResources.hpas.data.filter(doesHpaMatch(resource)), [
    extraResources.hpas.data,
    resource,
  ]);

  const supportsHPA = React.useMemo(
    () =>
      !(isHelmResource(resource) || isOperatorBackedService(resource, extraResources.csvs.data)),
    [extraResources.csvs.data, resource],
  );

  const result = React.useMemo(() => {
    return [supportsHPA ? getHpaActions(kindObj, resource, relatedHPAs) : [], relatedHPAs];
  }, [kindObj, relatedHPAs, resource, supportsHPA]);

  return result;
};

import { useMemo } from 'react';
import i18next from 'i18next';
import type { Action } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import type {
  K8sResourceKind,
  K8sKind,
  K8sResourceCommon,
  HorizontalPodAutoscalerKind,
} from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import type { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { LazyDeleteHPAModalOverlay } from '@console/shared/src/components/hpa';
import { isHelmResource } from '@console/shared/src/utils/helm-utils';
import { doesHpaMatch } from '@console/shared/src/utils/hpa-utils';
import { isOperatorBackedService } from '@console/shared/src/utils/operator-utils';

const hpaRoute = (
  { metadata: { name = '', namespace = '' } = {} }: K8sResourceCommon,
  kind: K8sKind,
) => `/workload-hpa/ns/${namespace}/${referenceForModel(kind)}/${name}`;

type DeploymentActionExtraResources = {
  hpas: HorizontalPodAutoscalerKind[];
  csvs: ClusterServiceVersionKind[];
};

export const useHPAActions = (kindObj: K8sKind, resource: K8sResourceKind) => {
  const launchModal = useOverlay();
  const namespace = resource?.metadata?.namespace;

  const watchedResources = useMemo(
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
  const relatedHPAs = useMemo(() => extraResources.hpas.data.filter(doesHpaMatch(resource)), [
    extraResources.hpas.data,
    resource,
  ]);

  const supportsHPA = useMemo(
    () =>
      !(isHelmResource(resource) || isOperatorBackedService(resource, extraResources.csvs.data)),
    [extraResources.csvs.data, resource],
  );

  const actions = useMemo<Action[]>(() => {
    if (!supportsHPA) return [];

    if (relatedHPAs.length === 0) {
      return [
        {
          id: 'add-hpa',
          label: i18next.t('console-app~Add HorizontalPodAutoscaler'),
          cta: { href: hpaRoute(resource, kindObj) },
          insertBefore: 'add-pdb',
          accessReview: {
            group: HorizontalPodAutoscalerModel.apiGroup,
            resource: HorizontalPodAutoscalerModel.plural,
            namespace: resource.metadata?.namespace,
            verb: 'create',
          },
        },
      ];
    }
    return [
      {
        id: 'edit-hpa',
        label: i18next.t('console-app~Edit HorizontalPodAutoscaler'),
        cta: { href: hpaRoute(resource, kindObj) },
        insertBefore: 'add-pdb',
        accessReview: {
          group: HorizontalPodAutoscalerModel.apiGroup,
          resource: HorizontalPodAutoscalerModel.plural,
          namespace: resource.metadata?.namespace,
          verb: 'update',
        },
      },
      {
        id: 'delete-hpa',
        label: i18next.t('console-app~Remove HorizontalPodAutoscaler'),
        insertBefore: 'delete-pdb',
        cta: () => {
          launchModal(LazyDeleteHPAModalOverlay, {
            workload: resource,
            hpa: relatedHPAs[0],
          });
        },
        accessReview: {
          group: HorizontalPodAutoscalerModel.apiGroup,
          resource: HorizontalPodAutoscalerModel.plural,
          namespace: resource.metadata?.namespace,
          verb: 'delete',
        },
      },
    ];
    // Missing launchModal dependency causes max depth exceeded error
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kindObj, relatedHPAs, resource, supportsHPA]);

  const result = useMemo<[Action[], HorizontalPodAutoscalerKind[]]>(() => {
    return [actions, relatedHPAs];
  }, [actions, relatedHPAs]);

  return result;
};

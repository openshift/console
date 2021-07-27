import { KebabAction } from '@console/internal/components/utils';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import {
  HorizontalPodAutoscalerKind,
  K8sKind,
  K8sResourceCommon,
  referenceForModel,
} from '@console/internal/module/k8s';
import { isOperatorBackedService, deleteHPAModal, isHelmResource } from '@console/shared';

type RelatedResources = {
  hpas?: HorizontalPodAutoscalerKind[];
};

const hasHPAs = (mapOfResources: RelatedResources) =>
  Array.isArray(mapOfResources?.hpas) && mapOfResources.hpas.length > 0;

const hpaRoute = ({ metadata: { name, namespace } }: K8sResourceCommon, kind: K8sKind) =>
  `/workload-hpa/ns/${namespace}/${referenceForModel(kind)}/${name}`;

const isOperatorBackedWorkload = (
  obj: K8sResourceCommon,
  customData?: { [key: string]: any },
): boolean => customData?.isOperatorBacked || isOperatorBackedService(obj, customData?.csvs);

const shouldHideHPA = (obj: K8sResourceCommon, customData?: { [key: string]: any }) =>
  isHelmResource(obj) || isOperatorBackedWorkload(obj, customData);

/** @deprecated - Moving to Extensible Action for Deployment resource, see @console/app/src/actions */
export const AddHorizontalPodAutoScaler: KebabAction = (
  kind: K8sKind,
  obj: K8sResourceCommon,
  resources: RelatedResources,
  customData?: { [key: string]: any },
) => ({
  // t('console-app~Add HorizontalPodAutoscaler')
  labelKey: 'console-app~Add HorizontalPodAutoscaler',
  href: hpaRoute(obj, kind),
  hidden: hasHPAs(resources) || shouldHideHPA(obj, customData),
  accessReview: {
    group: HorizontalPodAutoscalerModel.apiGroup,
    resource: HorizontalPodAutoscalerModel.plural,
    namespace: obj.metadata.namespace,
    verb: 'create',
  },
});

/** @deprecated - Moving to Extensible Action for Deployment resource, see @console/app/src/actions */
export const EditHorizontalPodAutoScaler: KebabAction = (
  kind: K8sKind,
  obj: K8sResourceCommon,
  resources: RelatedResources,
  customData?: { [key: string]: any },
) => ({
  // t('console-app~Edit HorizontalPodAutoscaler')
  labelKey: 'console-app~Edit HorizontalPodAutoscaler',
  href: hpaRoute(obj, kind),
  hidden: !hasHPAs(resources) || shouldHideHPA(obj, customData),
  accessReview: {
    group: HorizontalPodAutoscalerModel.apiGroup,
    resource: HorizontalPodAutoscalerModel.plural,
    namespace: obj.metadata.namespace,
    verb: 'update',
  },
});

/** @deprecated - Moving to Extensible Action for Deployment resource, see @console/app/src/actions */
export const DeleteHorizontalPodAutoScaler: KebabAction = (
  kind: K8sKind,
  obj: K8sResourceCommon,
  resources: RelatedResources,
  customData?: { [key: string]: any },
) => ({
  // t('console-app~Remove HorizontalPodAutoscaler')
  labelKey: 'console-app~Remove HorizontalPodAutoscaler',
  callback: () => {
    deleteHPAModal({
      workload: obj,
      hpa: resources?.hpas?.[0],
    });
  },
  hidden: !hasHPAs(resources) || shouldHideHPA(obj, customData),
  accessReview: {
    group: HorizontalPodAutoscalerModel.apiGroup,
    resource: HorizontalPodAutoscalerModel.plural,
    namespace: obj.metadata.namespace,
    verb: 'delete',
  },
});

export const hideActionForHPAs = (action: KebabAction): KebabAction => (
  kind: K8sKind,
  obj: K8sResourceCommon,
  resources: RelatedResources,
) => {
  const actionOptions = action(kind, obj);
  return {
    ...actionOptions,
    hidden: hasHPAs(resources) || actionOptions.hidden,
  };
};

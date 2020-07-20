import { KebabAction } from '@console/internal/components/utils';
import {
  HorizontalPodAutoscalerKind,
  K8sKind,
  K8sResourceCommon,
  referenceForModel,
} from '@console/internal/module/k8s';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import deleteHPAModal from '@console/dev-console/src/components/hpa/DeleteHPAModal';

type RelatedResources = {
  hpas?: HorizontalPodAutoscalerKind[];
};

const hasHPAs = (mapOfResources: RelatedResources) =>
  Array.isArray(mapOfResources?.hpas) && mapOfResources.hpas.length > 0;

export const AddHorizontalPodAutoScaler: KebabAction = (
  kind: K8sKind,
  obj: K8sResourceCommon,
  resources: RelatedResources,
) => ({
  label: `Add ${HorizontalPodAutoscalerModel.label}`,
  href: `/workload-hpa/${obj.metadata.namespace}/${referenceForModel(kind)}/${obj.metadata.name}`,
  hidden: hasHPAs(resources),
  accessReview: {
    group: HorizontalPodAutoscalerModel.apiGroup,
    resource: HorizontalPodAutoscalerModel.plural,
    namespace: obj.metadata.namespace,
    verb: 'create',
  },
});

export const EditHorizontalPodAutoScaler: KebabAction = (
  kind: K8sKind,
  obj: K8sResourceCommon,
  resources: RelatedResources,
) => ({
  label: `Edit ${HorizontalPodAutoscalerModel.label}`,
  href: `/workload-hpa/${obj.metadata.namespace}/${referenceForModel(kind)}/${
    obj.metadata.name
  }/edit`,
  hidden: !hasHPAs(resources),
  accessReview: {
    group: HorizontalPodAutoscalerModel.apiGroup,
    resource: HorizontalPodAutoscalerModel.plural,
    namespace: obj.metadata.namespace,
    verb: 'update',
  },
});

export const DeleteHorizontalPodAutoScaler: KebabAction = (
  kind: K8sKind,
  obj: K8sResourceCommon,
  resources: RelatedResources,
) => ({
  label: `Remove ${HorizontalPodAutoscalerModel.label}`,
  callback: () => {
    deleteHPAModal({
      workload: obj,
      hpa: resources?.hpas?.[0],
    });
  },
  hidden: !hasHPAs(resources),
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

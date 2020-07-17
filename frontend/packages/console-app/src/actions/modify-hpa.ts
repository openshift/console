import { history, KebabAction } from '@console/internal/components/utils';
import { K8sKind, K8sResourceCommon } from '@console/internal/module/k8s';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';

export const AddHorizontalPodAutoScaler: KebabAction = (kind: K8sKind, obj: K8sResourceCommon) => ({
  label: `Add ${HorizontalPodAutoscalerModel.label}`,
  callback: () => {
    history.push(`/workload-hpa/${obj.metadata.namespace}/${kind.kind}/${obj.metadata.name}`);
  },
  accessReview: {
    group: HorizontalPodAutoscalerModel.apiGroup,
    resource: HorizontalPodAutoscalerModel.plural,
    namespace: obj.metadata.namespace,
    verb: 'create',
  },
});

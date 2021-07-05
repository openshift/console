import { HorizontalPodAutoscalerKind, K8sResourceCommon } from '@console/internal/module/k8s';

export const doesHpaMatch = (workload: K8sResourceCommon) => (
  thisHPA: HorizontalPodAutoscalerKind,
) => {
  const {
    apiVersion,
    kind,
    metadata: { name },
  } = workload;
  const ref = thisHPA?.spec?.scaleTargetRef;
  return ref && ref.apiVersion === apiVersion && ref.kind === kind && ref.name === name;
};

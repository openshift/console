import { PodKind } from '@console/internal/module/k8s';
import { VMILikeEntityKind } from '../../types/vm-like';
import { buildOwnerReference, compareOwnerReference } from '../../utils/utils';
import { getName, getNamespace, getOwnerReferences } from '../k8sCommon';

export const findConversionPod = (vm: VMILikeEntityKind, pods: PodKind[]) => {
  if (!pods) {
    return null;
  }

  const vmOwnerReference = buildOwnerReference(vm);

  return pods.find((pod) => {
    const podOwnerReferences = getOwnerReferences(pod);
    return (
      getNamespace(pod) === getNamespace(vm) &&
      getName(pod).startsWith('kubevirt-v2v-conversion') &&
      podOwnerReferences &&
      podOwnerReferences.some((podOwnerReference) =>
        compareOwnerReference(podOwnerReference, vmOwnerReference),
      )
    );
  });
};

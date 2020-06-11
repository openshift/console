import { getName, getNamespace, getOwnerReferences } from '@console/shared/src/selectors';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { PodKind } from '@console/internal/module/k8s';
import { buildOwnerReference } from '../../utils';
import { OS_WINDOWS_PREFIX } from '../../constants';
import { getOperatingSystem } from './selectors';
import { VMILikeEntityKind, VMGenericLikeEntityKind } from '../../types/vmLike';

export const isWindows = (vm: VMGenericLikeEntityKind): boolean =>
  (getOperatingSystem(vm) || '').startsWith(OS_WINDOWS_PREFIX);

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

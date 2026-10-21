import type { PodKind } from '@console/internal/module/k8s';
import { getNamespace, getOwnerReferences, getUID } from '@console/shared';
import type { VMIKind } from './kubevirt-types';

const isPodReady = (pod: PodKind): boolean =>
  pod?.status?.phase === 'Running' && pod?.status?.containerStatuses?.every((s) => s.ready);

export const findVMIPod = (vmi?: VMIKind, pods?: PodKind[]) => {
  if (!pods || !vmi) {
    return null;
  }

  const vmUID = getUID(vmi);
  const prefixedPods = pods.filter((p) => {
    const podOwnerReferences = getOwnerReferences(p);
    return (
      getNamespace(p) === getNamespace(vmi) &&
      podOwnerReferences &&
      podOwnerReferences.some((podOwnerReference) => podOwnerReference.uid === vmUID)
    );
  });

  // Return the newest, most ready Pod created
  return prefixedPods
    .sort((a: PodKind, b: PodKind) =>
      a.metadata.creationTimestamp > b.metadata.creationTimestamp ? -1 : 1,
    )
    .sort((a: PodKind) => (isPodReady(a) ? -1 : 1))[0];
};

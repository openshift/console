import { ClonePVC } from './clone-workflow';
import { DeleteSnapshot } from './delete-snapshot-workflow';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel } from '@console/internal/models/index';
import { isCephProvisioner } from '@console/shared/src/utils/storage-utils';
import { RestorePVC } from './restore-pvc-workflow';
import { SnapshotPVC } from './snapshot-workflow';
import { VolumeSnapshotModel } from '../models';

export const getKebabActionsForKind = (
  kind: K8sKind,
  resource?: K8sResourceKind,
): KebabAction[] => {
  if (kind?.kind === PersistentVolumeClaimModel.kind) {
    const provisioner: string =
      resource?.metadata?.annotations?.['volume.beta.kubernetes.io/storage-provisioner'];
    if (isCephProvisioner(provisioner)) return [SnapshotPVC, ClonePVC];
  }
  if (kind?.kind === VolumeSnapshotModel.kind) {
    return [RestorePVC, DeleteSnapshot];
  }
  return [];
};

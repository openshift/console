import { DeleteSnapshot } from './delete-snapshot-workflow';
import { K8sKind } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel } from '@console/internal/models/index';
import { RestorePVC } from './restore-pvc-workflow';
import { SnapshotPVC } from './snapshot-workflow';
import { VolumeSnapshotModel } from '../models';

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  if (resourceKind?.kind === PersistentVolumeClaimModel.kind) {
    return [SnapshotPVC];
  }
  if (resourceKind?.kind === VolumeSnapshotModel.kind) {
    return [RestorePVC, DeleteSnapshot];
  }
  return [];
};

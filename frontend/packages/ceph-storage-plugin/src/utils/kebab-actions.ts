import { PersistentVolumeClaimModel } from '@console/internal/models/index';
import { GetKebabActions } from '@console/plugin-sdk';
import { ClonePVC } from './clone-workflow';
import { DeleteSnapshot } from './delete-snapshot-workflow';
import { RestorePVC } from './restore-pvc-workflow';
import { SnapshotPVC } from './snapshot-workflow';
import { VolumeSnapshotModel } from '../models';

export const getKebabActions: GetKebabActions = (resourceKind) => {
  if (resourceKind?.kind === PersistentVolumeClaimModel.kind) {
    return [SnapshotPVC, ClonePVC];
  }
  if (resourceKind?.kind === VolumeSnapshotModel.kind) {
    return [RestorePVC, DeleteSnapshot];
  }
  return [];
};

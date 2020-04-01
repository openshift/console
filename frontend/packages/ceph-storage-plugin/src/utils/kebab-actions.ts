import { ClonePVC } from './clone-workflow';
import { DeleteSnapshot } from './delete-snapshot-workflow';
import { K8sKind } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel } from '@console/internal/models/index';
import { RestorePVC } from './restore-pvc-workflow';
import { SnapshotPVC } from './snapshot-workflow';
import { VolumeSnapshotModel, SnapshotScheduleModel } from '../models';
import { EditSchedule } from './schedule-workflow';
import { DeleteSchedule } from './delete-schedule-workflow';

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  if (resourceKind?.kind === PersistentVolumeClaimModel.kind) {
    return [SnapshotPVC, ClonePVC];
  }
  if (resourceKind?.kind === VolumeSnapshotModel.kind) {
    return [RestorePVC, DeleteSnapshot];
  }
  if (resourceKind?.kind === SnapshotScheduleModel.kind) {
    return [EditSchedule, DeleteSchedule];
  }
  return [];
};

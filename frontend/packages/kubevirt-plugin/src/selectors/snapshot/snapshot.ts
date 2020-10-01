import { VMSnapshot, VMRestore } from '../../types';
import { getStatusConditionOfType, isConditionStatusTrue } from '../selectors';

export const getVmSnapshotVmName = (snapshot: VMSnapshot) => snapshot?.spec?.source?.name;

export const getVmSnapshotDescription = (snapshot: VMSnapshot) =>
  snapshot?.metadata?.annotations?.description;

export const getVMSnapshotError = (snapshot: VMSnapshot) => snapshot?.status?.error;

export const isVMSnapshotReady = (snapshot: VMSnapshot) => snapshot?.status?.readyToUse;

// restore
export const getVmRestoreVmName = (restore: VMRestore) => restore?.spec?.target?.name;

export const getVmRestoreSnapshotName = (restore: VMRestore) =>
  restore?.spec?.virtualMachineSnapshotName;

export const getVMRestoreError = (restore: VMRestore) => restore?.status?.error;

export const getVmRestoreTime = (restore: VMRestore) => restore?.status?.restoreTime;

export const isVMRestoreComplete = (restore: VMRestore) => restore?.status?.complete;

export const isVmRestoreProgressing = (restore: VMRestore) =>
  isConditionStatusTrue(getStatusConditionOfType(restore, 'Progressing'));

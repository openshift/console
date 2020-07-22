import { VMSnapshot, VMRestore } from '../../types';

export const getVmSnapshotVmName = (snapshot: VMSnapshot) => snapshot?.spec?.source?.name;

export const getVMSnapshotError = (snapshot: VMSnapshot) => snapshot?.status?.error;

export const isVMSnapshotReady = (snapshot: VMSnapshot) => snapshot?.status?.readyToUse;

// restore
export const getVmRestoreVmName = (snapshot: VMRestore) => snapshot?.spec?.target?.name;

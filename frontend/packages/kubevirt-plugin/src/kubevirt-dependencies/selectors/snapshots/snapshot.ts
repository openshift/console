import { VMSnapshot } from '../../types/vm';

export const getVmSnapshotVmName = (snapshot: VMSnapshot) => snapshot?.spec?.source?.name;

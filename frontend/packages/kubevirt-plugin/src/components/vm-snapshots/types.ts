import { VMLikeEntityKind } from '../../types/vmLike';

export type VMSnapshotRowActionOpts = { withProgress: (promise: Promise<any>) => void };

export type VMSnapshotRowCustomData = {
  vmLikeEntity: VMLikeEntityKind;
  columnClasses: string[];
  isDisabled: boolean;
} & VMSnapshotRowActionOpts;

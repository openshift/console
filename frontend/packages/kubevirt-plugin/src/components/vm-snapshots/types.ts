import { VMRestore } from '../../types';
import { VMLikeEntityKind } from '../../types/vmLike';

export type VMSnapshotRowActionOpts = {
  withProgress: (promise: Promise<any>) => void;
  restores: { [key: string]: VMRestore };
};

export type VMSnapshotRowCustomData = {
  vmLikeEntity: VMLikeEntityKind;
  columnClasses: string[];
  isDisabled: boolean;
  restores: { [key: string]: VMRestore };
  withProgress: (promise: Promise<any>) => void;
} & VMSnapshotRowActionOpts;

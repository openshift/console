import { ValidationObject } from '@console/shared';
import { VMLikeEntityKind } from '../../types/vmLike';
import { CombinedDisk } from '../../k8s/wrapper/vm/combined-disk';

export type StorageSimpleData = {
  name?: string;
  content?: string;
  source?: string;
  diskInterface?: string;
  size?: string;
  storageClass?: string;
};

export type StorageSimpleDataValidation = {
  name?: ValidationObject;
  content?: ValidationObject;
  source?: ValidationObject;
  diskInterface?: ValidationObject;
  size?: ValidationObject;
  storageClass?: ValidationObject;
};

export type StorageBundle = StorageSimpleData & {
  disk: CombinedDisk;
};

export type VMStorageRowActionOpts = {
  withProgress: (promise: Promise<any>) => void;
};

export type VMStorageRowCustomData = {
  vmLikeEntity: VMLikeEntityKind;
  columnClasses: string[];
  isDisabled: boolean;
} & VMStorageRowActionOpts;

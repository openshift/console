import { VMLikeEntityKind } from '../../types';
import { ValidationObject } from '../../utils/validations/types';
import { CombinedDisk } from '../../k8s/wrapper/vm/combined-disk';

export type StorageSimpleData = {
  name?: string;
  diskInterface?: string;
  size?: string;
  storageClass?: string;
};

export type StorageSimpleDataValidation = {
  name?: ValidationObject;
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

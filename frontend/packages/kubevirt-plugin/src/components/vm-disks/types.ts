import { VMLikeEntityKind } from '../../types';
import { ValidationObject } from '../../utils/validations/types';

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
  disk: any;
  volume: any;
  dataVolume: any;
  isEditingEnabled: boolean;
};

export type VMStorageRowActionOpts = {
  withProgress: (promise: Promise<any>) => void;
  isEditingEnabled: boolean;
};

export type VMStorageRowCustomData = {
  vmLikeEntity: VMLikeEntityKind;
  columnClasses: string[];
  isDisabled: boolean;
} & VMStorageRowActionOpts;

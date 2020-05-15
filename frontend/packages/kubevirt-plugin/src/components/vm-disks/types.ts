import { ValidationObject } from '@console/shared';
import { VMLikeEntityKind } from '../../types/vmLike';
import { CombinedDisk } from '../../k8s/wrapper/vm/combined-disk';
import { TemplateValidations } from '../../utils/validations/template/template-validations';
import { UIStorageValidation } from '../../types/ui/storage';
import { DiskType } from '../../constants';

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
  templateValidations?: TemplateValidations;
  diskValidations?: UIStorageValidation;
  metadata?: { name?: string; type?: DiskType };
};

export type VMStorageRowActionOpts = {
  withProgress: (promise: Promise<any>) => void;
  templateValidations?: TemplateValidations;
};

export type VMStorageRowCustomData = {
  vmLikeEntity: VMLikeEntityKind;
  columnClasses: string[];
  isDisabled: boolean;
} & VMStorageRowActionOpts;

import { ValidationObject } from '@console/shared';

import { VMLikeEntityKind } from '../../types/vmLike';
import { VMIKind } from '../../types';

export type NetworkSimpleData = {
  name?: string;
  model?: string;
  networkName?: string;
  interfaceType?: string;
  macAddress?: string;
};

export type NetworkSimpleDataValidation = {
  name?: ValidationObject;
  model?: ValidationObject;
  network?: ValidationObject;
  interfaceType?: ValidationObject;
  macAddress?: ValidationObject;
};

export type NetworkBundle = NetworkSimpleData & {
  nic: any;
  network: any;
};

export type VMNicRowActionOpts = { withProgress: (promise: Promise<any>) => void };

export type VMNicRowCustomData = {
  vmLikeEntity: VMLikeEntityKind;
  vmi: VMIKind;
  columnClasses: string[];
  isDisabled: boolean;
  pendingChangesNICs?: Set<string>;
} & VMNicRowActionOpts;

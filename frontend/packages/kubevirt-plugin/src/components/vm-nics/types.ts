import { VMLikeEntityKind } from '../../types';

export type NetworkBundle = {
  name?: string;
  model?: string;
  networkName: string;
  interfaceType?: string;
  macAddress?: string;
  nic: any;
  network: any;
};

export type VMNicRowCustomData = {
  vmLikeEntity: VMLikeEntityKind;
};

export type VMNicRowProps = {
  obj: NetworkBundle;
  customData: VMNicRowCustomData;
  index: number;
  style: object;
};

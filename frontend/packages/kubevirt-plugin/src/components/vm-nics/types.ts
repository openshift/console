import { EntityMap, VMKind, VMLikeEntityKind } from '../../types';

export enum NetworkRowType {
  NETWORK_TYPE_VM = 'network-type-vm',
  NETWORK_TYPE_CREATE = 'network-type-create',
}

export type NetworkBundle = {
  name?: string;
  networkName: string;
  binding: string;
  networkType: NetworkRowType;
  nic?: any;
};

export type VMNicRowProps = {
  obj: NetworkBundle;
  index: number;
  style: object;
  hasNADs?: boolean;
  customData: {
    vmLikeEntity: VMLikeEntityKind;
    vm: VMKind;
    interfaceLookup: EntityMap<any>;
    preferableNicBus: string;
    onCreateRowDismiss: () => void;
    onCreateRowError: (error: string) => void;
  };
};

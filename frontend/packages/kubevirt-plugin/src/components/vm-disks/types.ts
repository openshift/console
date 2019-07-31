import { EntityMap } from '@console/shared';
import { VMLikeEntityKind, VMKind } from '../../types';

export enum StorageType {
  STORAGE_TYPE_VM = 'storage-type-vm',
  STORAGE_TYPE_CREATE = 'storage-type-create',
}

export type StorageBundle = {
  name: string;
  size: string;
  storageClass: string;
  storageType: StorageType;
  disk: any;
};

export type VMDiskRowProps = {
  obj: StorageBundle;
  index: number;
  style: object;
  customData: {
    vmLikeEntity: VMLikeEntityKind;
    vm: VMKind;
    diskLookup: EntityMap<any>;
    onCreateRowDismiss: () => void;
    onCreateRowError: (error: string) => void;
    forceRerender: () => void;
  };
};

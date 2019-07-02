import { FirehoseResult } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { EntityMap, VMLikeEntityKind, VMKind, K8sEntityMap } from '../../types';

export enum StorageType {
  STORAGE_TYPE_VM = 'storage-type-vm',
  STORAGE_TYPE_CREATE = 'storage-type-create',
}

export type StorageBundle = {
  name: string;
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
    pvcs: FirehoseResult<K8sResourceKind[]>;
    pvcLookup: K8sEntityMap<K8sResourceKind>;
    datavolumes: FirehoseResult<K8sResourceKind[]>;
    datavolumeLookup: K8sEntityMap<K8sResourceKind>;
    volumeLookup: EntityMap<any>;
    datavolumeTemplatesLookup: K8sEntityMap<K8sResourceKind>;
    onCreateRowDismiss: () => void;
    onCreateRowError: (error: string) => void;
  };
};

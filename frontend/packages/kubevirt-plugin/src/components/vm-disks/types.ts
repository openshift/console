import { FirehoseResult } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { K8sEntityMap, VMLikeEntityKind, VMKind } from '../../types';

export enum StorageTypeEnum {
  STORAGE_TYPE_VM = 'storage-type-vm',
  STORAGE_TYPE_CREATE = 'storage-type-create',
}

export type VMDiskRowProps = {
  obj: {
    name: string;
    storageType: StorageTypeEnum;
    disk: any;
  };
  index: number;
  style: object;
  customData: {
    vmLikeEntity: VMLikeEntityKind;
    vm: VMKind;
    pvcs: FirehoseResult<K8sResourceKind[]>;
    pvcLookup: K8sEntityMap<K8sResourceKind>;
    datavolumes: FirehoseResult<K8sResourceKind[]>;
    datavolumeLookup: K8sEntityMap<K8sResourceKind>;
    volumeLookup: K8sEntityMap<K8sResourceKind>;
    datavolumeTemplatesLookup: K8sEntityMap<K8sResourceKind>;
    onCreateRowDismiss: () => void;
    onCreateRowError: (error: string) => void;
  };
};

import {
  K8sKind,
  K8sResourceKind,
  PersistentVolumeClaimKind,
  PodKind,
} from '@console/internal/module/k8s';
import { V1alpha1DataVolume } from '../../types/api';
import { VMIKind, VMKind } from '../../types/vm';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { VMGenericLikeEntityKind, VMILikeEntityKind } from '../../types/vmLike';

type PendingChange = {
  isPendingChange: boolean;
  execAction: () => void;
  vmTab?: VMTabEnum;
  resourceNames?: string[];
};

export type PendingChanges = {
  [key: string]: PendingChange;
};

export type PendingChangesByTab = {
  [vmTab in VMTabEnum]?: {
    resources?: string[];
    pendingChangesKey?: string;
  };
};

export type VMTabProps = {
  obj?: VMILikeEntityKind;
  vm?: VMKind;
  vmis?: VMIKind[];
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  pvcs?: PersistentVolumeClaimKind[];
  dataVolumes?: V1alpha1DataVolume[];
  vmImports?: VMImportKind[];
  customData: {
    kindObj: K8sKind;
    isCommonTemplate: boolean;
  };
  showOpenInNewWindow?: boolean;
};

export type VMLikeEntityTabProps = {
  obj?: VMGenericLikeEntityKind;
  customData?: {
    isCommonTemplate: boolean;
  };
};

export enum IsPendingChange {
  flavor = 'Flavor',
  bootOrder = 'Boot Order',
  env = 'Environment',
  nics = 'Network Interfaces',
  disks = 'Disks',
}

export enum VMTabURLEnum {
  details = 'details',
  env = 'environment',
  nics = 'nics',
  disks = 'disks',
}

export enum VMTabEnum {
  details = 'Details',
  env = 'Environment',
  nics = 'Network Interfaces',
  disks = 'Disks',
}

import { K8sKind, K8sResourceKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { VMIKind, VMKind } from '../../types/vm';
import { VMGenericLikeEntityKind, VMILikeEntityKind } from '../../types/vmLike';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';

export type VMTabProps = {
  obj?: VMILikeEntityKind;
  vm?: VMKind;
  vmis?: VMIKind[];
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  templates?: TemplateKind[];
  dataVolumes?: V1alpha1DataVolume[];
  vmImports?: VMImportKind[];
  customData: {
    kindObj: K8sKind;
  };
  showOpenInNewWindow?: boolean;
};

export type VMLikeEntityTabProps = {
  obj?: VMGenericLikeEntityKind;
};

export enum IsPendingChange {
  flavor = 'Flavor',
  cdroms = 'CD-ROMs',
  bootOrder = 'Boot Order',
}

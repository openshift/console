import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { VMStatus } from '../../constants/vm/vm-status';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';

export type VMStatusBundle = {
  status: VMStatus;
  message?: string;
  detailedMessage?: string;
  progress?: number;
  pod?: PodKind;
  vmImport?: VMImportKind;
  migration?: K8sResourceKind;
  importerPodsStatuses?: {
    message: string;
    dataVolume?: V1alpha1DataVolume;
    status: VMStatus;
    pod: PodKind;
    progress?: number;
  }[];
};

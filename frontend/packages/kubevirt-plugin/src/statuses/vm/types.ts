import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { VMStatus } from '../../constants/vm/vm-status';
import { V1alpha1DataVolume } from '../../types/api';
import { StatusBundle } from '../../types/status-bundle';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';

export interface ImporterPodStatus extends StatusBundle<VMStatus> {
  pod: PodKind;
  dataVolume?: V1alpha1DataVolume;
}

export interface VMStatusBundle extends StatusBundle<VMStatus> {
  pod?: PodKind;
  vmImport?: VMImportKind;
  migration?: K8sResourceKind;
  importerPodsStatuses?: ImporterPodStatus[];
}

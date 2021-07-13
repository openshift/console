import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel, PodModel } from '@console/internal/models';
import { K8sResourceKind, PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import {
  DataVolumeModel,
  VirtualMachineImportModel,
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
import { getVMStatus } from '../statuses/vm/vm-status';
import { VMIKind, VMKind } from '../types';
import { V1alpha1DataVolume } from '../types/api';
import { VMImportKind } from '../types/vm-import/ovirt/vm-import';

export const useVMStatus = (name, namespace) => {
  const [vm] = useK8sWatchResource<VMKind>({
    kind: kubevirtReferenceForModel(VirtualMachineModel),
    name,
    namespace,
    isList: false,
  });

  const [vmi] = useK8sWatchResource<VMIKind>({
    kind: kubevirtReferenceForModel(VirtualMachineInstanceModel),
    name,
    namespace,
    isList: false,
  });

  const [pods] = useK8sWatchResource<PodKind[]>({
    kind: PodModel.kind,
    namespace,
    isList: true,
  });

  const [migrations] = useK8sWatchResource<K8sResourceKind[]>({
    kind: kubevirtReferenceForModel(VirtualMachineInstanceMigrationModel),
    namespace,
    isList: true,
  });

  const [vmImports] = useK8sWatchResource<VMImportKind[]>({
    kind: kubevirtReferenceForModel(VirtualMachineImportModel),
    namespace,
    isList: true,
  });
  const [pvcs] = useK8sWatchResource<PersistentVolumeClaimKind[]>({
    kind: PersistentVolumeClaimModel.kind,
    namespace,
    isList: true,
  });
  const [dataVolumes] = useK8sWatchResource<V1alpha1DataVolume[]>({
    kind: kubevirtReferenceForModel(DataVolumeModel),
    namespace,
    isList: true,
  });

  return getVMStatus({
    vm,
    vmi,
    pods,
    migrations,
    pvcs,
    dataVolumes,
    vmImports,
  });
};

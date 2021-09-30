import * as React from 'react';
import { CommonActionFactory } from '@console/app/src/actions/creators/common-factory';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { VmActionFactory, VmImportActionFactory } from '../components/vms/menu-actions';
import { StatusGroup } from '../constants/status-group';
import { useVMStatus } from '../hooks/use-vm-status';
import { VirtualMachineImportModel, VirtualMachineInstanceModel } from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
import {
  isVMCreated,
  isVMExpectedRunning,
  isVMRunningOrExpectedRunning,
} from '../selectors/vm/selectors';
import { isVMIPaused } from '../selectors/vmi';
import { VMIKind, VMKind } from '../types';

export const useVmActionsProvider = (vm: VMKind) => {
  const [k8sModel, inFlight] = useK8sModel(referenceFor(vm));
  const {
    metadata: { name, namespace },
  } = vm;
  const [vmi] = useK8sWatchResource<VMIKind>({
    kind: kubevirtReferenceForModel(VirtualMachineInstanceModel),
    name,
    namespace,
    isList: false,
  });
  const vmStatusBundle = useVMStatus(name, namespace);
  const actions = React.useMemo(() => {
    return vmStatusBundle
      ? [
          ...(!(vmStatusBundle?.status?.isMigrating() || isVMRunningOrExpectedRunning(vm, vmi))
            ? [VmActionFactory.Start(k8sModel, vm, { vmi, vmStatusBundle })]
            : []),
          ...(!(
            vmStatusBundle?.status?.isPending() ||
            (!vmStatusBundle?.status?.isImporting() && !isVMExpectedRunning(vm, vmi))
          )
            ? [VmActionFactory.Stop(k8sModel, vm, { vmStatusBundle, vmi })]
            : []),
          ...(!(
            vmStatusBundle?.status?.isImporting() ||
            vmStatusBundle?.status?.isMigrating() ||
            !isVMExpectedRunning(vm, vmi) ||
            !isVMCreated(vm)
          )
            ? [VmActionFactory.Restart(k8sModel, vm, { vmi })]
            : []),
          ...(isVMIPaused(vmi) ? [VmActionFactory.Unpause(vmi)] : []),
          ...(!isVMIPaused(vmi) ? [VmActionFactory.Pause(vmi)] : []),
          ...(!(
            vmStatusBundle?.status?.isMigrating() ||
            vmStatusBundle?.status?.isError() ||
            vmStatusBundle?.status?.isInProgress() ||
            !isVMRunningOrExpectedRunning(vm, vmi)
          )
            ? [VmActionFactory.Migrate(vmi)]
            : []),
          ...(vmStatusBundle?.status?.isMigrating()
            ? [VmActionFactory.CancelMigration(vmStatusBundle)]
            : []),
          ...(!vmStatusBundle?.status?.isImporting()
            ? [VmActionFactory.Clone(k8sModel, vm, { vmi })]
            : []),
          VmActionFactory.OpenConsole(vmi),
          VmActionFactory.CopySSHCommand(vm, vmStatusBundle),
          CommonActionFactory.ModifyLabels(k8sModel, vm),
          CommonActionFactory.ModifyAnnotations(k8sModel, vm),
          ...(vmStatusBundle?.status?.getGroup() !== StatusGroup.VMIMPORT &&
          vmStatusBundle?.status?.isCompleted() &&
          !vmStatusBundle?.vmImport
            ? [
                VmImportActionFactory.Delete(VirtualMachineImportModel, vmStatusBundle.vmImport, {
                  vm,
                }),
              ]
            : [VmActionFactory.Delete(k8sModel, vm, vmi)]),
        ]
      : [];
  }, [k8sModel, vm, vmStatusBundle, vmi]);
  return React.useMemo(() => [actions, !inFlight, undefined], [actions, inFlight]);
};

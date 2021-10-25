import * as React from 'react';
import { CommonActionFactory } from '@console/app/src/actions/creators/common-factory';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { VmActionFactory } from '../components/vms/menu-actions';
import { useVMStatus } from '../hooks/use-vm-status';
import { VirtualMachineInstanceModel } from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
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

  const actions = React.useMemo(
    () =>
      vmStatusBundle
        ? [
            VmActionFactory.Start(k8sModel, vm, { vmi, vmStatusBundle }),
            VmActionFactory.Restart(k8sModel, vm, { vmi, vmStatusBundle }),
            VmActionFactory.Pause(k8sModel, vm, { vmi, vmStatusBundle }),
            VmActionFactory.Migrate(k8sModel, vm, { vmi, vmStatusBundle }),
            VmActionFactory.Clone(k8sModel, vm, { vmi, vmStatusBundle }),
            VmActionFactory.OpenConsole(k8sModel, vm, { vmi, vmStatusBundle }),
            CommonActionFactory.ModifyLabels(k8sModel, vm),
            CommonActionFactory.ModifyAnnotations(k8sModel, vm),
            VmActionFactory.Delete(k8sModel, vm, { vmi }),
          ]
        : [],
    [k8sModel, vm, vmStatusBundle, vmi],
  );
  return React.useMemo(() => [actions, !inFlight, undefined], [actions, inFlight]);
};

export const useVmiActionsProvider = (vm: VMKind) => {
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
          VmActionFactory.OpenConsole(k8sModel, vm, { vmi, vmStatusBundle }),
          CommonActionFactory.ModifyLabels(k8sModel, vm),
          CommonActionFactory.ModifyAnnotations(k8sModel, vm),
          VmActionFactory.Delete(k8sModel, vm, { vmi }),
        ]
      : [];
  }, [k8sModel, vm, vmStatusBundle, vmi]);
  return React.useMemo(() => [actions, !inFlight, undefined], [actions, inFlight]);
};

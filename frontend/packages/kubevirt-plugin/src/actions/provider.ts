import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { CommonActionFactory } from '@console/app/src/actions/creators/common-factory';
import { modelFor } from '@console/dynamic-plugin-sdk/src/lib-internal-kubevirt';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getModifyApplicationAction } from '@console/topology/src/actions';
import { VmActionFactory, VmiActionFactory } from '../components/vms/menu-actions';
import { useVMStatus } from '../hooks/use-vm-status';
import { VirtualMachineInstanceModel } from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
import { isVMRunningOrExpectedRunning } from '../selectors/vm/selectors';
import { isVMIPaused } from '../selectors/vmi';
import { TYPE_VIRTUAL_MACHINE } from '../topology/components/const';
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
    const start =
      !isVMRunningOrExpectedRunning(vm, vmi) || isVMIPaused(vmi)
        ? VmActionFactory.Start(k8sModel, vm, { vmi, vmStatusBundle })
        : VmActionFactory.Stop(k8sModel, vm, { vmStatusBundle, vmi });

    const migrate =
      !vmStatusBundle || !vmStatusBundle?.status?.isMigrating()
        ? VmActionFactory.Migrate(k8sModel, vm, { vmi })
        : VmActionFactory.CancelMigration(k8sModel, vm, { vmStatusBundle });

    const pause =
      !vmi || !isVMIPaused(vmi)
        ? VmActionFactory.Pause(k8sModel, vm, { vmi, vmStatusBundle })
        : VmActionFactory.Unpause(k8sModel, vm, { vmi, vmStatusBundle });

    return vmStatusBundle
      ? [
          start,
          VmActionFactory.Restart(k8sModel, vm, { vmi }),
          pause,
          VmActionFactory.Clone(k8sModel, vm, { vmi, vmStatusBundle }),
          migrate,
          VmActionFactory.OpenConsole(k8sModel, vm, { vmi }),
          // disabled until https://issues.redhat.com/browse/CNV-9746 is implemented
          // VmActionFactory.CopySSH(k8sModel, vm, { vmi }),
          CommonActionFactory.ModifyLabels(k8sModel, vm),
          CommonActionFactory.ModifyAnnotations(k8sModel, vm),
          VmActionFactory.Delete(k8sModel, vm, { vmi }),
        ]
      : [];
  }, [k8sModel, vm, vmStatusBundle, vmi]);
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
          ...(vmi ? [VmActionFactory.OpenConsole(k8sModel, vm, { vmi })] : []),
          CommonActionFactory.ModifyLabels(k8sModel, vm),
          CommonActionFactory.ModifyAnnotations(k8sModel, vm),
          ...(vmi ? [VmiActionFactory.Delete(k8sModel, vmi)] : []),
        ]
      : [];
  }, [k8sModel, vm, vmStatusBundle, vmi]);
  return React.useMemo(() => [actions, !inFlight, undefined], [actions, inFlight]);
};

export const useModifyApplicationActionProvider = (element: GraphElement) => {
  const actions = React.useMemo(() => {
    if (element.getType() !== TYPE_VIRTUAL_MACHINE) return undefined;
    const resource = element.getData().resources.obj;
    const k8sKind = modelFor(referenceFor(resource));
    return [getModifyApplicationAction(k8sKind, resource, 'vm-action-start')];
  }, [element]);

  return React.useMemo(() => {
    if (!actions) return [[], true, undefined];
    return [actions, true, undefined];
  }, [actions]);
};

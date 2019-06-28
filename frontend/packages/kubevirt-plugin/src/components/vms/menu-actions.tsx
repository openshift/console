import {
  getVmStatus,
  VM_STATUS_IMPORTING,
  VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
} from 'kubevirt-web-ui-components';

import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { K8sKind, PodKind } from '@console/internal/module/k8s';
import { isVMRunning } from '../../selectors/vm';
import { startStopVmModal } from '../modals/start-stop-vm-modal';
import { VMKind } from '../../types/vm';

type ActionArgs = {
  pods: PodKind[];
  migrations: any[];
};

const isImporting = (vm: VMKind, { pods, migrations }: ActionArgs): boolean => {
  const status = getVmStatus(vm, pods, migrations);
  return (
    status && [VM_STATUS_IMPORTING, VM_STATUS_V2V_CONVERSION_IN_PROGRESS].includes(status.status)
  );
};

const menuActionStart = (kindObj: K8sKind, vm: VMKind, actionArgs: ActionArgs): KebabOption => {
  return {
    hidden: isImporting(vm, actionArgs) || isVMRunning(vm),
    label: 'Start Virtual Machine',
    callback: () =>
      startStopVmModal({
        vm,
        start: true,
      }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

const menuActionStop = (kindObj: K8sKind, vm: VMKind): KebabOption => {
  return {
    hidden: !isVMRunning(vm),
    label: 'Stop Virtual Machine',
    callback: () =>
      startStopVmModal({
        vm,
        start: false,
      }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

export const menuActions = [
  menuActionStart,
  menuActionStop,
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  Kebab.factory.Delete,
];

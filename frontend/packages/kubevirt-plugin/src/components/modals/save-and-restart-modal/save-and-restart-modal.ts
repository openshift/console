import { VMKind, VMIKind } from '../../../types';
import { confirmVMIModal } from '../menu-actions-modals/confirm-vmi-modal';
import { getActionMessage } from '../../vms/constants';
import { VMActionType, restartVM } from '../../../k8s/requests/vm';
import * as _ from 'lodash';

export const saveAndRestartModal = (vm: VMKind, vmi: VMIKind, saveChanges?: () => void) =>
  confirmVMIModal({
    vmi,
    title: 'Restart Virtual Machine',
    alertTitle: 'Restart Virtual Machine alert',
    message: getActionMessage(vm, VMActionType.Restart),
    btnText: _.capitalize(VMActionType.Restart),
    executeFn: () => {
      saveChanges && saveChanges();
      return restartVM(vm);
    },
    cancel: () => saveChanges && saveChanges(),
  });

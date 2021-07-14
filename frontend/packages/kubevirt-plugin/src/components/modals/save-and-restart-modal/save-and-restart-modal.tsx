import * as React from 'react';
import { restartVM } from '../../../k8s/requests/vm';
import { VMIKind, VMKind } from '../../../types';
import { ActionMessage } from '../../vms/ActionMessage';
import { confirmVMIModal } from '../menu-actions-modals/confirm-vmi-modal';

export const saveAndRestartModal = (vm: VMKind, vmi: VMIKind, saveChanges?: () => void) =>
  confirmVMIModal({
    vmi,
    // t('kubevirt-plugin~Restart Virtual Machine')
    titleKey: 'kubevirt-plugin~Restart Virtual Machine',
    // t('kubevirt-plugin~Restart Virtual Machine alert')
    alertTitleKey: 'kubevirt-plugin~Restart Virtual Machine alert',
    // t('kubevirt-plugin~restart')
    message: <ActionMessage obj={vm} actionKey="kubevirt-plugin~restart" />,
    // t('kubevirt-plugin~Restart')
    btnTextKey: 'kubevirt-plugin~Restart',
    executeFn: () => {
      saveChanges && saveChanges();
      return restartVM(vm);
    },
    cancel: () => saveChanges && saveChanges(),
  });

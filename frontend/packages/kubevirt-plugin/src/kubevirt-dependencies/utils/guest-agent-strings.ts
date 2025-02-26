import { TFunction } from 'i18next';
import { VMStatus, VMStatusSimpleLabel } from '../constants/vm-status';

export const getGuestAgentFieldNotAvailMsg = (
  t: TFunction,
  isGuestAgentInstalled: boolean,
  vmStatus: VMStatus,
): string => {
  if (vmStatus.getSimpleLabel() !== VMStatusSimpleLabel.Running) {
    return t('kubevirt-plugin~Virtual machine not running');
  }

  return isGuestAgentInstalled
    ? t('kubevirt-plugin~Not available')
    : t('kubevirt-plugin~Guest agent required');
};

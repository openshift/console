import { TFunction } from 'i18next';

import { VMStatus } from '../constants/vm/vm-status';

export const getNumLoggedInUsersMessage = (t: TFunction, numLoggedInUsers: number | null) => {
  if (numLoggedInUsers == null) {
    return t('kubevirt-plugin~Not available');
  }

  if (numLoggedInUsers === 0) {
    return t('kubevirt-plugin~No users logged in');
  }

  return t('kubevirt-plugin~{{count}} user', { count: numLoggedInUsers });
};

export const getGuestAgentFieldNotAvailMsg = (
  t: TFunction,
  isGuestAgentInstalled: boolean,
  vmStatus: VMStatus,
): string => {
  if (vmStatus !== VMStatus.RUNNING) {
    return t('kubevirt-plugin~Virtual machine not running');
  }

  return isGuestAgentInstalled
    ? t('kubevirt-plugin~Not available')
    : t('kubevirt-plugin~Guest agent required');
};

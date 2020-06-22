import {
  GUEST_AGENT_REQUIRED_MESSAGE,
  NOT_AVAILABLE_MESSAGE,
  NO_LOGGED_IN_USERS_MSG,
  VM_NOT_RUNNING_MESSAGE,
} from '../strings/vm/messages';
import { pluralize } from './strings';
import { VMStatus } from '../constants/vm/vm-status';

export const getNumLoggedInUsersMessage = (numLoggedInUsers: number | null) => {
  if (numLoggedInUsers == null) {
    return NOT_AVAILABLE_MESSAGE;
  }

  if (numLoggedInUsers === 0) {
    return NO_LOGGED_IN_USERS_MSG;
  }

  return `${numLoggedInUsers} ${pluralize(numLoggedInUsers, 'user')}`;
};

export const getGuestAgentFieldNotAvailMsg = (
  isGuestAgentInstalled: boolean,
  vmStatus: VMStatus,
): string => {
  if (vmStatus !== VMStatus.RUNNING) {
    return VM_NOT_RUNNING_MESSAGE;
  }

  return isGuestAgentInstalled ? NOT_AVAILABLE_MESSAGE : GUEST_AGENT_REQUIRED_MESSAGE;
};

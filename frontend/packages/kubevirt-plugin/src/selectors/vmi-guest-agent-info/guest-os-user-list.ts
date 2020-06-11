import {
  V1VirtualMachineInstanceGuestOSUser,
  V1VirtualMachineInstanceGuestOSUserList,
} from '../../types/vmi-guest-data-info/vmi-guest-agent-info';

// Selectors for V1VirtualMachineInstanceGuestOSUser
export const getGuestOSUserDomain = (guestOSUser: V1VirtualMachineInstanceGuestOSUser): string =>
  guestOSUser?.domain;

export const getGuestOSUserLoginTime = (guestOSUser: V1VirtualMachineInstanceGuestOSUser): number =>
  guestOSUser?.loginTime;

export const getGuestOSUserUserName = (guestOSUser: V1VirtualMachineInstanceGuestOSUser): string =>
  guestOSUser?.userName;

// Selectors for V1VirtualMachineInstanceGuestOSUserList
export const getGuestOSUserListAPIVersion = (
  guestOSUserList: V1VirtualMachineInstanceGuestOSUserList,
): string => guestOSUserList?.apiVersion;

export const getGuestOSUserListItems = (
  guestOSUserList: V1VirtualMachineInstanceGuestOSUserList,
): V1VirtualMachineInstanceGuestOSUser[] => guestOSUserList?.items;

import {
  V1VirtualMachineInstanceFileSystemInfo,
  V1VirtualMachineInstanceGuestAgentInfo,
  V1VirtualMachineInstanceGuestOSInfo,
  V1VirtualMachineInstanceGuestOSUser,
} from '../../types/vmi-guest-data-info/vmi-guest-agent-info';

export const getGuestAgentInfoAPIVersion = (
  guestAgentInfo: V1VirtualMachineInstanceGuestAgentInfo,
): string => guestAgentInfo?.apiVersion;

export const getGuestAgentInfoFSInfo = (
  guestAgentInfo: V1VirtualMachineInstanceGuestAgentInfo,
): V1VirtualMachineInstanceFileSystemInfo => guestAgentInfo?.fsInfo;

export const getGuestAgentInfoGAVersion = (
  guestAgentInfo: V1VirtualMachineInstanceGuestAgentInfo,
): string => guestAgentInfo?.guestAgentVersion;

export const getGuestAgentInfoHostname = (
  guestAgentInfo: V1VirtualMachineInstanceGuestAgentInfo,
): string => guestAgentInfo?.hostname;

export const getGuestAgentInfoOS = (
  guestAgentInfo: V1VirtualMachineInstanceGuestAgentInfo,
): V1VirtualMachineInstanceGuestOSInfo => guestAgentInfo?.os;

export const getGuestAgentInfoTimezone = (
  guestAgentInfo: V1VirtualMachineInstanceGuestAgentInfo,
): string => guestAgentInfo?.timezone;

export const getGuestAgentInfoUserList = (
  guestAgentInfo: V1VirtualMachineInstanceGuestAgentInfo,
): V1VirtualMachineInstanceGuestOSUser[] => guestAgentInfo?.userList;

import { V1VirtualMachineInstanceGuestOSInfo } from '../../types/vmi-guest-data-info/vmi-guest-agent-info';

export const getGuestOSID = (guestOSInfo: V1VirtualMachineInstanceGuestOSInfo): string =>
  guestOSInfo?.id;

export const getGuestOSKernelRelease = (guestOSInfo: V1VirtualMachineInstanceGuestOSInfo): string =>
  guestOSInfo?.kernelRelease;

export const getGuestOSKernelVersion = (guestOSInfo: V1VirtualMachineInstanceGuestOSInfo): string =>
  guestOSInfo?.kernelVersion;

export const getGuestOSMachine = (guestOSInfo: V1VirtualMachineInstanceGuestOSInfo): string =>
  guestOSInfo?.machine;

export const getGuestOSName = (guestOSInfo: V1VirtualMachineInstanceGuestOSInfo): string =>
  guestOSInfo?.name;

export const getGuestOSPrettyName = (guestOSInfo: V1VirtualMachineInstanceGuestOSInfo): string =>
  guestOSInfo?.prettyName;

export const getGuestOSVersion = (guestOSInfo: V1VirtualMachineInstanceGuestOSInfo): string =>
  guestOSInfo?.version;

export const getGuestOSVersionId = (guestOSInfo: V1VirtualMachineInstanceGuestOSInfo): string =>
  guestOSInfo?.versionId;

import { ObjectMetadata } from '@console/internal/module/k8s';

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstanceguestosinfo
export type V1VirtualMachineInstanceGuestOSInfo = {
  id?: string;
  kernelRelease?: string;
  kernelVersion?: string;
  machine?: string;
  name?: string;
  prettyName?: string;
  version?: string;
  versionId?: string;
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstanceguestosuser
export type V1VirtualMachineInstanceGuestOSUser = {
  domain?: string;
  loginTime?: number;
  userName: string;
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstanceguestosuserlist
export type V1VirtualMachineInstanceGuestOSUserList = {
  apiVersion?: string;
  items: V1VirtualMachineInstanceGuestOSUser[];
  kind?: string;
  metadata?: ObjectMetadata;
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancefilesystem
export type V1VirtualMachineInstanceFileSystem = {
  diskName?: string;
  fileSystemType: string;
  mountPoint: string;
  totalBytes: number;
  usedBytes: number;
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancefilesysteminfo
export type V1VirtualMachineInstanceFileSystemInfo = {
  disks: V1VirtualMachineInstanceFileSystem[];
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancefilesystemlist
export type V1VirtualMachineInstanceFileSystemList = {
  apiVersion?: string;
  items: V1VirtualMachineInstanceFileSystem[];
  kind?: string;
  metadata?: ObjectMetadata;
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstanceguestagentinfo
export type V1VirtualMachineInstanceGuestAgentInfo = {
  apiVersion?: string;
  fsInfo?: V1VirtualMachineInstanceFileSystemInfo;
  guestAgentVersion?: string;
  hostname?: string;
  kind?: string;
  os?: V1VirtualMachineInstanceGuestOSInfo;
  timezone?: string;
  userList?: V1VirtualMachineInstanceGuestOSUser[];
};

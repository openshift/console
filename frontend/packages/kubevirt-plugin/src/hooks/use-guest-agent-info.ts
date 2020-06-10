import { VMIKind } from '../types';
import { useURLPoll } from '@console/internal/components/utils/url-poll-hook';
import { getVMIApiPath, getVMISubresourcePath } from '../selectors/vmi/selectors';
import { isGuestAgentInstalled } from '../components/dashboards-page/vm-dashboard/vm-alerts';

const getGuestAgentURL = (vmi: VMIKind) =>
  vmi &&
  isGuestAgentInstalled(vmi) &&
  `/${getVMISubresourcePath()}/${getVMIApiPath(vmi)}/guestosinfo`;

const useGuestAgentInfo = ({ vmi, delay }: GuestAgentInfoProps) =>
  useURLPoll<VirtualMachineInstanceGuestAgentInfo>(getGuestAgentURL(vmi), delay);

type GuestAgentInfoProps = {
  vmi: VMIKind;
  delay?: number;
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancefilesystem
type VirtualMachineInstanceFileSystem = {
  diskName: string;
  fileSystemType: string;
  mountPoint: string;
  totalBytes: number;
  usedBytes: number;
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancefilesysteminfo
type VirtualMachineInstanceFileSystemInfo = {
  disks: VirtualMachineInstanceFileSystem[];
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstanceguestagentinfo
type VirtualMachineInstanceGuestOSInfo = {
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
type VirtualMachineInstanceGuestOSUser = {
  userName: string;
  domain?: string;
  loginTime?: number;
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancefilesysteminfo
type VirtualMachineInstanceGuestAgentInfo = {
  apiVersion?: string;
  fsInfo?: VirtualMachineInstanceFileSystemInfo;
  guestAgentVersion?: string;
  hostname?: string;
  kind?: string;
  os?: VirtualMachineInstanceGuestOSInfo;
  timezone?: string;
  userList?: VirtualMachineInstanceGuestOSUser[];
};

export { useGuestAgentInfo, GuestAgentInfoProps };

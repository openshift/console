import { Wrapper } from '../../common/wrapper';
import { V1VirtualMachineInstanceFileSystemInfo } from '../../../../types/vmi-guest-data-info/vmi-guest-agent-info';
import { GuestAgentFileSystemWrapper } from './guest-agent-file-system-wrapper';

export class GuestAgentFSInfoWrapper extends Wrapper<
  V1VirtualMachineInstanceFileSystemInfo,
  GuestAgentFSInfoWrapper
> {
  constructor(
    fileSystemInfo?: V1VirtualMachineInstanceFileSystemInfo | GuestAgentFSInfoWrapper | any,
    copy = false,
  ) {
    super(fileSystemInfo, copy);
  }

  getDisks = (): GuestAgentFileSystemWrapper[] =>
    this.data?.disks.map((disk) => new GuestAgentFileSystemWrapper(disk));
}

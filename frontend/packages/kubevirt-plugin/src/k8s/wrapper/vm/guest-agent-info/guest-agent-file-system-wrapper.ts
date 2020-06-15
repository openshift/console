import { Wrapper } from '../../common/wrapper';
import { V1VirtualMachineInstanceFileSystem } from '../../../../types/vmi-guest-data-info/vmi-guest-agent-info';

export class GuestAgentFileSystemWrapper extends Wrapper<
  V1VirtualMachineInstanceFileSystem,
  GuestAgentFileSystemWrapper
> {
  constructor(
    fileSystem?: V1VirtualMachineInstanceFileSystem | GuestAgentFileSystemWrapper | any,
    copy = false,
  ) {
    super(fileSystem, copy);
  }

  getDiskName = (): string => this.data?.diskName;

  getType = (): string => this.data?.fileSystemType;

  getMountPoint = (): string => this.data?.mountPoint;

  getTotalBytes = (): number => this.data?.totalBytes;

  getUsedBytes = (): number => this.data?.usedBytes;
}

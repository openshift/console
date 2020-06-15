import { Wrapper } from '../../common/wrapper';
import { V1VirtualMachineInstanceGuestOSInfo } from '../../../../types/vmi-guest-data-info/vmi-guest-agent-info';

export class GuestAgentOSInfoWrapper extends Wrapper<
  V1VirtualMachineInstanceGuestOSInfo,
  GuestAgentOSInfoWrapper
> {
  constructor(
    guestOSInfo?: V1VirtualMachineInstanceGuestOSInfo | GuestAgentOSInfoWrapper | any,
    copy = false,
  ) {
    super(guestOSInfo, copy);
  }

  getId = (): string => this.data?.id;

  getKernelRelease = (): string => this.data?.kernelRelease;

  getKernelVersion = (): string => this.data?.kernelVersion;

  getMachine = (): string => this.data?.machine;

  getName = (): string => this.data?.name;

  getPrettyName = (): string => this.data?.prettyName;

  getVersion = (): string => this.data?.version;

  getVersionId = (): string => this.data?.versionId;
}

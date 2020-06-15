import { V1VirtualMachineInstanceGuestAgentInfo } from '../../../../types/vmi-guest-data-info/vmi-guest-agent-info';
import { Wrapper } from '../../common/wrapper';
import { GuestAgentOSInfoWrapper } from './guest-agent-os-info-wrapper';
import { GuestAgentFSInfoWrapper } from './guest-agent-fs-info-wrapper';
import { GuestOSUserWrapper } from './guest-os-user-wrapper';

export class GuestAgentInfoWrapper extends Wrapper<
  V1VirtualMachineInstanceGuestAgentInfo,
  GuestAgentInfoWrapper
> {
  private readonly guestAgentOSInfo: GuestAgentOSInfoWrapper;

  private readonly guestAgentFSInfo: GuestAgentFSInfoWrapper;

  private readonly guestOSUserList: GuestOSUserWrapper[];

  constructor(
    guestAgentInfo?: V1VirtualMachineInstanceGuestAgentInfo | GuestAgentInfoWrapper | any,
    copy = false,
  ) {
    super(guestAgentInfo, copy);
    this.guestAgentOSInfo = new GuestAgentOSInfoWrapper(guestAgentInfo?.os);
    this.guestAgentFSInfo = new GuestAgentFSInfoWrapper(guestAgentInfo?.fsInfo);
    this.guestOSUserList = guestAgentInfo?.userList?.map((user) => new GuestOSUserWrapper(user));
  }

  getFSInfo = (): GuestAgentFSInfoWrapper => this.guestAgentFSInfo;

  getOSInfo = (): GuestAgentOSInfoWrapper => this.guestAgentOSInfo;

  getUserList = (): GuestOSUserWrapper[] => this.guestOSUserList;

  getAPIVersion = (): string => this.data?.apiVersion;

  getGAVersion = (): string => this.data?.guestAgentVersion;

  getHostname = (): string => this.data?.hostname;

  getTimezone = (): string => this.data?.timezone;

  getTimezoneName = (): string => this.data?.timezone && this.data?.timezone.split(',')[0];
}

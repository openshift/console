import * as _ from 'lodash';
import { V1VirtualMachineInstanceGuestAgentInfo } from '../../../../types/vmi-guest-data-info/vmi-guest-agent-info';
import { Wrapper } from '../../common/wrapper';
import { GuestAgentOSInfoWrapper } from './guest-agent-os-info-wrapper';
import { GuestAgentFSInfoWrapper } from './guest-agent-fs-info-wrapper';
import { GuestOSUserWrapper } from './guest-os-user-wrapper';

export class GuestAgentInfoWrapper extends Wrapper<
  V1VirtualMachineInstanceGuestAgentInfo,
  GuestAgentInfoWrapper
> {
  constructor(
    guestAgentInfo?: V1VirtualMachineInstanceGuestAgentInfo | GuestAgentInfoWrapper | any,
    copy = false,
  ) {
    super(guestAgentInfo, copy);
  }

  getFSInfo = (): GuestAgentFSInfoWrapper => new GuestAgentFSInfoWrapper(this.data?.fsInfo);

  getOSInfo = (): GuestAgentOSInfoWrapper => new GuestAgentOSInfoWrapper(this.data?.os);

  getUserList = (): GuestOSUserWrapper[] =>
    this.data?.userList?.map((user) => new GuestOSUserWrapper(user));

  getNumLoggedInUsers = (): number | null => {
    if (_.isEmpty(this.data)) {
      return null;
    }

    const userList = this.getUserList();
    return userList ? userList.length : 0;
  };

  getAPIVersion = (): string => this.data?.apiVersion;

  getGAVersion = (): string => this.data?.guestAgentVersion;

  getHostname = (): string => this.data?.hostname;

  getTimezone = (): string => this.data?.timezone;

  getTimezoneName = (): string => this.data?.timezone && this.data?.timezone.split(',')[0];
}

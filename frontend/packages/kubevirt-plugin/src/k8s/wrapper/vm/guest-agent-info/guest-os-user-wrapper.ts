import { Wrapper } from '../../common/wrapper';
import { V1VirtualMachineInstanceGuestOSUser } from '../../../../types/vmi-guest-data-info/vmi-guest-agent-info';

export class GuestOSUserWrapper extends Wrapper<
  V1VirtualMachineInstanceGuestOSUser,
  GuestOSUserWrapper
> {
  constructor(
    guestOSUser?: V1VirtualMachineInstanceGuestOSUser | GuestOSUserWrapper | any,
    copy = false,
  ) {
    super(guestOSUser, copy);
  }

  getUserName = (): string => this.data?.userName;

  getDomain = (): string => this.data?.domain;

  getLoginTime = (): number => this.data?.loginTime;

  getLoginTimeInMilliSec = (): number => this.data?.loginTime && this.data?.loginTime * 1000;
}

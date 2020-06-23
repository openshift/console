import { VMIKind } from '../types';
import { useURLPoll } from '@console/internal/components/utils/url-poll-hook';
import { isGuestAgentInstalled } from '../components/dashboards-page/vm-dashboard/vm-alerts';
import { getVMIApiPath, getVMISubresourcePath } from '../selectors/vmi/selectors';
import { V1VirtualMachineInstanceGuestAgentInfo } from '../types/vmi-guest-data-info/vmi-guest-agent-info';

export const GUEST_AGENT_POLL_DEFAULT_DELAY = 5000; // 5 seconds

const getGuestAgentURL = (vmi: VMIKind) =>
  vmi &&
  isGuestAgentInstalled(vmi) &&
  `/${getVMISubresourcePath()}/${getVMIApiPath(vmi)}/guestosinfo`;

const useGuestAgentInfo = ({ vmi, delay = GUEST_AGENT_POLL_DEFAULT_DELAY }: GuestAgentInfoProps) =>
  useURLPoll<V1VirtualMachineInstanceGuestAgentInfo>(getGuestAgentURL(vmi), delay);

type GuestAgentInfoProps = {
  vmi: VMIKind;
  delay?: number;
};

export { useGuestAgentInfo, GuestAgentInfoProps };

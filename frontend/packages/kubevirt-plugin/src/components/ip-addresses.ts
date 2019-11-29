import { VMIKind } from '../types';
import { VMStatus, isVmOff } from '../statuses/vm/vm';
import { getVmiIpAddresses } from '../selectors/vmi/ip-address';

// the vmStatus is precomputed by caller for optimization
export const getVmiIpAddressesString = (vmi: VMIKind, vmStatus: VMStatus): string => {
  const vmIsOff = vmStatus && isVmOff(vmStatus);
  const ipAddresses = vmIsOff ? [] : getVmiIpAddresses(vmi);
  return ipAddresses.length > 0 ? ipAddresses.join(', ') : null;
};

import { getVmiIpAddresses, isVmOff } from 'kubevirt-web-ui-components';
import { VMIKind } from '../types';
import { VMStatus } from '../statuses/vm/vm';

// the vmStatus is precomputed by caller for optimization
export const getVmiIpAddressesString = (vmi: VMIKind, vmStatus: VMStatus): string => {
  const vmIsOff = vmStatus && isVmOff(vmStatus);
  const ipAddresses = vmIsOff ? [] : getVmiIpAddresses(vmi);
  return ipAddresses.length > 0 ? ipAddresses.join(', ') : null;
};

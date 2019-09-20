import * as React from 'react';
import { getVmiIpAddresses, isVmOff } from 'kubevirt-web-ui-components';
import { IpAddresses } from '@console/shared/src/components/ip-addresses';
import { VMIKind } from '../types';

export const VmIpAddresses: React.FC<VmIpAddressesProps> = ({ vmi, vmStatus }) => {
  const vmIsOff = vmStatus && isVmOff(vmStatus);
  const ips = vmIsOff ? [] : getVmiIpAddresses(vmi);
  return <IpAddresses ips={ips} />;
};

type VmIpAddressesProps = {
  vmi: VMIKind;
  vmStatus?: any; // precomputed by higher component for optimization
};

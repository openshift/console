import * as React from 'react';
import { DASH } from '../constants';

export const IpAddresses: React.FC<IpAddressesProps> = ({ ips = [] }) => {
  return <>{ips.length > 0 ? ips.join(', ') : DASH}</>;
};

type IpAddressesProps = {
  ips?: string[];
};

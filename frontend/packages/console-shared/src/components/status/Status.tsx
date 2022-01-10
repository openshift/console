import * as React from 'react';
import { StatusComponent as Status } from '@console/dynamic-plugin-sdk';

export { StatusComponent as Status } from '@console/dynamic-plugin-sdk';

export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => (
  <Status status={status} iconOnly />
);

type StatusIconProps = {
  status: string;
};

import type { FC } from 'react';
import { StatusComponent as Status } from '@console/dynamic-plugin-sdk';

export { StatusComponent as Status } from '@console/dynamic-plugin-sdk';

export const StatusIcon: FC<StatusIconProps> = ({ status }) => <Status status={status} iconOnly />;

type StatusIconProps = {
  status: string;
};

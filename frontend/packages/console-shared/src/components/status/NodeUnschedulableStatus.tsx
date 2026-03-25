import type { FC } from 'react';
import type { StatusComponentProps } from '@console/dynamic-plugin-sdk';
import { WarningStatus } from './statuses';

const NodeUnschedulableStatus: FC<NodeUnschedulableStatusProps> = ({
  status,
  title,
  iconOnly,
  noTooltip,
  className,
}) => {
  const statusProps = { title: title || status, iconOnly, noTooltip, className };
  return <WarningStatus {...statusProps} />;
};

type NodeUnschedulableStatusProps = StatusComponentProps & {
  status: string;
};

export default NodeUnschedulableStatus;

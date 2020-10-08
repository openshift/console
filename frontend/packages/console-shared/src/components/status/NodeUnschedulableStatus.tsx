import * as React from 'react';

import { WarningStatus } from './statuses';
import { StatusComponentProps } from './types';

const NodeUnschedulableStatus: React.FC<NodeUnschedulableStatusProps> = ({
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

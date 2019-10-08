import * as React from 'react';
import Status from './Status';

type StatusIconProps = {
  status: string;
};

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => <Status status={status} iconOnly />;

export default StatusIcon;

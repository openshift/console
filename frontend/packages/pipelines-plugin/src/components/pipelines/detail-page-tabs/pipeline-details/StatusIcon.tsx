import * as React from 'react';
import {
  AngleDoubleRightIcon,
  BanIcon,
  CheckCircleIcon,
  CircleIcon,
  ExclamationCircleIcon,
  HourglassHalfIcon,
  SyncAltIcon,
} from '@patternfly/react-icons';
import { getRunStatusColor, runStatus } from '../../../../utils/pipeline-augment';

interface StatusIconProps {
  status: string;
  height?: number;
  width?: number;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, ...props }) => {
  switch (status) {
    case runStatus['In Progress']:
    case runStatus.Running:
      return <SyncAltIcon {...props} className="fa-spin" />;

    case runStatus.Succeeded:
      return <CheckCircleIcon {...props} />;

    case runStatus.Failed:
      return <ExclamationCircleIcon {...props} />;

    case runStatus.Idle:
    case runStatus.Pending:
      return <HourglassHalfIcon {...props} />;

    case runStatus.Cancelled:
      return <BanIcon {...props} />;

    case runStatus.Skipped:
      return <AngleDoubleRightIcon {...props} />;

    default:
      return <CircleIcon {...props} />;
  }
};

export const ColoredStatusIcon: React.FC<StatusIconProps> = ({ status, ...others }) => {
  return (
    <div
      style={{
        color: status
          ? getRunStatusColor(status).pftoken.value
          : getRunStatusColor(runStatus.Cancelled).pftoken.value,
      }}
    >
      <StatusIcon status={status} {...others} />
    </div>
  );
};

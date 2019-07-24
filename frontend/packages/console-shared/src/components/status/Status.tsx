import * as React from 'react';
import {
  HourglassStartIcon,
  HourglassHalfIcon,
  SyncAltIcon,
  BanIcon,
  ExclamationTriangleIcon,
  UnknownIcon,
} from '@patternfly/react-icons';
import { DASH } from '../../constants';
import StatusIconAndText from './StatusIconAndText';
import ProgressStatus from './ProgressStatus';
import ErrorStatus from './ErrorStatus';
import SuccessStatus from './SuccessStatus';
import InfoStatus from './InfoStatus';

export type StatusProps = {
  status?: string;
  title?: string;
  iconOnly?: boolean;
};

const Status: React.FC<StatusProps> = ({ status, title, children, iconOnly }) => {
  const statusProps = { title: title || status, iconOnly };
  switch (status) {
    case 'New':
      return <StatusIconAndText {...statusProps} icon={<HourglassStartIcon />} />;

    case 'Pending':
      return <StatusIconAndText {...statusProps} icon={<HourglassHalfIcon />} />;

    case 'ContainerCreating':
      return <ProgressStatus {...statusProps} />;

    case 'In Progress':
    case 'Running':
    case 'Updating':
    case 'Upgrading':
      return <StatusIconAndText {...statusProps} icon={<SyncAltIcon />} />;

    case 'Cancelled':
    case 'Expired':
    case 'Not Ready':
    case 'Terminating':
      return <StatusIconAndText {...statusProps} icon={<BanIcon />} />;

    case 'Warning':
      return <StatusIconAndText {...statusProps} icon={<ExclamationTriangleIcon />} />;

    case 'ContainerCannotRun':
    case 'CrashLoopBackOff':
    case 'Critical':
    case 'Error':
    case 'Failed':
    case 'InstallCheckFailed':
    case 'Lost':
    case 'Rejected':
      return <ErrorStatus {...statusProps}>{children}</ErrorStatus>;

    case 'Accepted':
    case 'Active':
    case 'Bound':
    case 'Complete':
    case 'Completed':
    case 'Succeeded':
    case 'Enabled':
    case 'Ready':
    case 'Up to date':
      return <SuccessStatus {...statusProps} />;

    case 'Info':
      return <InfoStatus {...statusProps}>{children}</InfoStatus>;

    case 'Unknown':
      return <StatusIconAndText {...statusProps} icon={<UnknownIcon />} />;

    default:
      return <>{DASH}</>;
  }
};

export default Status;

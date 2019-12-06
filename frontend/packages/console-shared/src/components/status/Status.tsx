import * as React from 'react';
import {
  ClipboardListIcon,
  HourglassStartIcon,
  HourglassHalfIcon,
  SyncAltIcon,
  BanIcon,
  ExclamationTriangleIcon,
  UnknownIcon,
} from '@patternfly/react-icons';
import { GreenCheckCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';
import { DASH } from '../../constants';
import StatusIconAndText from './StatusIconAndText';
import { ErrorStatus, InfoStatus, ProgressStatus, SuccessStatus } from './statuses';
import { StatusComponentProps } from './types';

export const Status: React.FC<StatusProps> = ({ status, title, children, iconOnly, noTooltip }) => {
  const statusProps = { title: title || status, iconOnly, noTooltip };
  switch (status) {
    case 'New':
      return <StatusIconAndText {...statusProps} icon={<HourglassStartIcon />} />;

    case 'Pending':
      return <StatusIconAndText {...statusProps} icon={<HourglassHalfIcon />} />;

    case 'Planning':
      return <StatusIconAndText {...statusProps} icon={<ClipboardListIcon />} />;

    case 'ContainerCreating':
      return <ProgressStatus {...statusProps} />;

    case 'In Progress':
    case 'Installing':
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

    case 'RequiresApproval':
      return <StatusIconAndText {...statusProps} icon={<YellowExclamationTriangleIcon />} />;

    case 'ContainerCannotRun':
    case 'CrashLoopBackOff':
    case 'Critical':
    case 'Error':
    case 'ErrorImagePull':
    case 'Failed':
    case 'ImagePullBackOff':
    case 'InstallCheckFailed':
    case 'Lost':
    case 'Rejected':
      return <ErrorStatus {...statusProps}>{children}</ErrorStatus>;

    case 'Accepted':
    case 'Active':
    case 'Bound':
    case 'Complete':
    case 'Completed':
    case 'Enabled':
    case 'Succeeded':
    case 'Ready':
    case 'Up to date':
      return <SuccessStatus {...statusProps} />;

    case 'Created':
      return <StatusIconAndText {...statusProps} icon={<GreenCheckCircleIcon />} />;

    case 'Info':
      return <InfoStatus {...statusProps}>{children}</InfoStatus>;

    case 'Unknown':
      return <StatusIconAndText {...statusProps} icon={<UnknownIcon />} />;

    default:
      return <>{status || DASH}</>;
  }
};

export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => (
  <Status status={status} iconOnly />
);

type StatusIconProps = {
  status: string;
};

type StatusProps = StatusComponentProps & {
  status: string;
};

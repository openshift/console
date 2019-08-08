import * as React from 'react';
import {
  HourglassStartIcon,
  HourglassHalfIcon,
  SyncAltIcon,
  BanIcon,
  ExclamationTriangleIcon,
  UnknownIcon,
} from '@patternfly/react-icons';
import { DASH, StatusType } from '../../constants';
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
    case StatusType.New:
      return <StatusIconAndText {...statusProps} icon={<HourglassStartIcon />} />;

    case StatusType.Pending:
      return <StatusIconAndText {...statusProps} icon={<HourglassHalfIcon />} />;

    case StatusType.ContainerCreating:
      return <ProgressStatus {...statusProps} />;

    case StatusType.InProgress:
    case StatusType.Running:
    case StatusType.Updating:
    case StatusType.Upgrading:
      return <StatusIconAndText {...statusProps} icon={<SyncAltIcon />} />;

    case StatusType.Cancelled:
    case StatusType.Expired:
    case StatusType.NotReady:
    case StatusType.Terminating:
      return <StatusIconAndText {...statusProps} icon={<BanIcon />} />;

    case StatusType.Warning:
      return <StatusIconAndText {...statusProps} icon={<ExclamationTriangleIcon />} />;

    case StatusType.ContainerCannotRun:
    case StatusType.CrashLoopBackOff:
    case StatusType.Critical:
    case StatusType.Error:
    case StatusType.Failed:
    case StatusType.InstallCheckFailed:
    case StatusType.Lost:
    case StatusType.Rejected:
      return <ErrorStatus {...statusProps}>{children}</ErrorStatus>;

    case StatusType.Accepted:
    case StatusType.Active:
    case StatusType.Bound:
    case StatusType.Complete:
    case StatusType.Completed:
    case StatusType.Enabled:
    case StatusType.Succeeded:
    case StatusType.Ready:
    case StatusType.Uptodate:
      return <SuccessStatus {...statusProps} />;

    case StatusType.Info:
      return <InfoStatus {...statusProps}>{children}</InfoStatus>;

    case StatusType.Unknown:
      return <StatusIconAndText {...statusProps} icon={<UnknownIcon />} />;

    default:
      return <>{DASH}</>;
  }
};

export default Status;

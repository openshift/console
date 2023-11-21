import * as React from 'react';
import { AngleDoubleRightIcon } from '@patternfly/react-icons/dist/esm/icons/angle-double-right-icon';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { CircleIcon } from '@patternfly/react-icons/dist/esm/icons/circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { HourglassHalfIcon } from '@patternfly/react-icons/dist/esm/icons/hourglass-half-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import * as cx from 'classnames';
import { YellowExclamationTriangleIcon } from '@console/dynamic-plugin-sdk';
import { ComputedStatus } from '../../../../types';
import { getRunStatusColor } from '../../../../utils/pipeline-augment';

interface StatusIconProps {
  status: string;
  height?: number;
  width?: number;
  disableSpin?: boolean;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, disableSpin, ...props }) => {
  switch (status) {
    case ComputedStatus['In Progress']:
    case ComputedStatus.Running:
      return <SyncAltIcon {...props} className={cx({ 'fa-spin': !disableSpin })} />;

    case ComputedStatus.Succeeded:
      return <CheckCircleIcon {...props} />;

    case ComputedStatus.Failed:
      return <ExclamationCircleIcon {...props} />;

    case ComputedStatus.Idle:
    case ComputedStatus.Pending:
      return <HourglassHalfIcon {...props} />;

    case ComputedStatus.Cancelled:
      return <YellowExclamationTriangleIcon {...props} />;

    case ComputedStatus.Skipped:
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
          : getRunStatusColor(ComputedStatus.Cancelled).pftoken.value,
      }}
    >
      <StatusIcon status={status} {...others} />
    </div>
  );
};

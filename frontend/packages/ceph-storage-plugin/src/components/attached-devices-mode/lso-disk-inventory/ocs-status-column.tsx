import * as React from 'react';
import { OffIcon } from '@patternfly/react-icons';
import { TableData } from '@console/internal/components/factory';
import { OCSColumnState, Status, OCSDiskStatus } from './state-reducer';
import { ExternalLink } from '@console/internal/components/utils';
import {
  ErrorStatus,
  PopoverStatus,
  SuccessStatus,
  ProgressStatus,
  StatusIconAndText,
} from '@console/shared';
import './ocs-status-column.scss';

const getOCSStatusBody = (status: OCSDiskStatus, diskName: string): React.ReactNode => {
  switch (status) {
    case Status.Online:
      return <SuccessStatus title={status} />;
    case Status.PreparingToReplace:
      return <ProgressStatus title={status} />;
    case Status.ReplacementReady:
      return (
        <PopoverStatus
          statusBody={
            <StatusIconAndText
              className="ceph-ocs-status__status-icon-and-text--color"
              title={status}
              icon={<OffIcon />}
            />
          }
        >
          <p>
            <strong>{diskName}</strong> can be replaced with a disk of same type.
          </p>
        </PopoverStatus>
      );
    case Status.Offline:
    case Status.NotResponding:
      return (
        <PopoverStatus statusBody={<ErrorStatus title={status} />}>
          <span>
            Troubleshoot disk <strong>{diskName}</strong>{' '}
          </span>
          <span>
            <ExternalLink
              dataTestID="disk-troubleshoot-link"
              href="https://access.redhat.com/solutions/5194851 "
              text="here"
            />
          </span>
        </PopoverStatus>
      );
    case Status.ReplacementFailed:
      return <ErrorStatus title={status} />;
    default:
      return status;
  }
};

export const OCSStatus: React.FC<{
  ocsState: OCSColumnState;
  diskName: string;
  className: string;
}> = React.memo(({ ocsState, className, diskName }) => {
  const { replacementMap, alertsMap, metricsMap } = ocsState;
  let status: OCSDiskStatus;

  if (replacementMap[diskName]) status = replacementMap[diskName].status;
  else if (alertsMap[diskName]) status = alertsMap[diskName].status;
  else if (metricsMap[diskName]) status = metricsMap[diskName].status;

  const testProps = {
    'data-test-status': `ocs-status-${status}`,
    'data-test-disk': diskName,
  };
  return (
    <TableData {...testProps} className={className}>
      {status ? getOCSStatusBody(status, diskName) : '-'}
    </TableData>
  );
});

import * as React from 'react';
import { TFunction } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';
import { OffIcon } from '@patternfly/react-icons';
import { TableData } from '@console/internal/components/factory';
import { OCSColumnState, Status, OCSDiskStatus, getOCSColumnStatus } from './state-reducer';
import { ExternalLink } from '@console/internal/components/utils';
import {
  ErrorStatus,
  PopoverStatus,
  SuccessStatus,
  ProgressStatus,
  StatusIconAndText,
} from '@console/shared';
import './ocs-status-column.scss';

const getOCSStatusBody = (
  status: OCSDiskStatus,
  diskName: string,
  t: TFunction,
): React.ReactNode => {
  const title = getOCSColumnStatus(status, t);

  switch (status) {
    case Status.Online:
      return <SuccessStatus title={title} />;
    case Status.PreparingToReplace:
      return <ProgressStatus title={title} />;
    case Status.ReplacementReady:
      return (
        <PopoverStatus
          statusBody={
            <StatusIconAndText
              className="ceph-ocs-status__status-icon-and-text--color"
              title={title}
              icon={<OffIcon />}
            />
          }
        >
          <p>
            <Trans t={t} ns="ceph-storage-plugin">
              <strong>{{ diskName }}</strong> can be replaced with a disk of same type.
            </Trans>
          </p>
        </PopoverStatus>
      );
    case Status.Offline:
    case Status.NotResponding:
      return (
        <PopoverStatus statusBody={<ErrorStatus title={title} />}>
          <span>
            <Trans t={t} ns="ceph-storage-plugin">
              Troubleshoot disk <strong>{{ diskName }}</strong>
            </Trans>
          </span>
          <span>
            <ExternalLink
              href="https://access.redhat.com/solutions/5194851 "
              text={t('ceph-storage-plugin~here')}
            />
          </span>
        </PopoverStatus>
      );
    case Status.ReplacementFailed:
      return <ErrorStatus title={title} />;
    default:
      return title;
  }
};

export const OCSStatus: React.FC<{
  ocsState: OCSColumnState;
  diskName: string;
  diskID: string;
  diskSerial: string;
  className: string;
}> = React.memo(({ ocsState, className, diskName, diskID, diskSerial }) => {
  const { t } = useTranslation();

  const { replacementMap, alertsMap, metricsMap } = ocsState;
  const { id, serial } = replacementMap?.[diskName]?.disk || {};
  let status: OCSDiskStatus;

  // If device is already replaced then show the replacement status
  if (replacementMap[diskName] && id === diskID && serial === diskSerial)
    status = replacementMap[diskName].status;
  // If device is failed then show the failure status
  else if (alertsMap[diskName]) status = alertsMap[diskName].status;
  // If device is neither failed nor replaced then show underlying osd status
  else if (metricsMap[diskName]) status = metricsMap[diskName].status;

  return (
    <TableData className={className}>
      {status ? getOCSStatusBody(status, diskName, t) : '-'}
    </TableData>
  );
});

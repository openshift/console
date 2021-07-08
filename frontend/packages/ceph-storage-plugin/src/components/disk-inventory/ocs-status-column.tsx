import * as React from 'react';
import { TFunction } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';
import { OffIcon } from '@patternfly/react-icons';
import { TableData } from '@console/internal/components/factory';
import { ExternalLink } from '@console/internal/components/utils';
import {
  ErrorStatus,
  PopoverStatus,
  SuccessStatus,
  ProgressStatus,
  StatusIconAndText,
} from '@console/shared';
import {
  OCSColumnState,
  Status,
  OCSDiskStatus,
  getOCSColumnStatus,
  ReplacedDisk,
} from './state-reducer';
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
  nodeName: string;
  className: string;
}> = React.memo(({ ocsState, className, diskName, diskID, diskSerial, nodeName }) => {
  const { t } = useTranslation();

  const { replacedDiskList, alertsMap, metricsMap, replacingDiskList } = ocsState;
  let status: OCSDiskStatus;
  let replacingDiskIndex: number = -1;

  const { status: replacementStatus } =
    replacedDiskList?.find((rd: ReplacedDisk) => {
      const diskInfo = rd?.disk || { id: '', serial: '', path: '' };
      return (
        diskInfo.path === diskName &&
        diskInfo.id === diskID &&
        diskInfo.serial === diskSerial &&
        rd?.node === nodeName
      );
    }) || {};

  if (replacingDiskList.length)
    replacingDiskIndex = replacingDiskList.findIndex(
      (disk) => disk?.id === diskID && disk?.serial === diskSerial && disk?.path === diskName,
    );

  // If device replacement is just triggered from modal and template status is not fetched
  if (replacingDiskIndex !== -1) status = Status.PreparingToReplace;
  // If device is already replaced then show the replacement status
  else if (replacementStatus) status = replacementStatus;
  // If device is failed then show the failure status
  else if (alertsMap[diskName]?.node === nodeName) status = alertsMap[diskName].status;
  // If device is neither failed nor replaced then show underlying osd status
  else if (metricsMap[diskName]?.node === nodeName) status = metricsMap[diskName].status;

  return (
    <TableData className={className}>
      {status ? getOCSStatusBody(status, diskName, t) : '-'}
    </TableData>
  );
});

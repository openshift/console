import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  ProgressStatus,
  SuccessStatus,
  ErrorStatus,
  Status,
  PopoverStatus,
  InfoStatus,
} from '@console/shared';
import {
  HOST_PROGRESS_STATES,
  HOST_ERROR_STATES,
  HOST_SUCCESS_STATES,
  NODE_STATUS_UNDER_MAINTENANCE,
  NODE_STATUS_STARTING_MAINTENANCE,
  NODE_STATUS_STOPPING_MAINTENANCE,
  HOST_STATUS_UNMANAGED,
  HOST_INFO_STATES,
} from '../../constants';
import { BareMetalHostModel } from '../../models';
import { getHostErrorMessage } from '../../selectors';
import { BareMetalHostKind } from '../../types';
import MaintenancePopover from '../maintenance/MaintenancePopover';
import { StatusProps } from '../types';

import './status.scss';

export const hostStatusActions = (t: TFunction) => ({
  [HOST_STATUS_UNMANAGED]: (host: BareMetalHostKind) => (
    <div className="bmh-status-action">
      <Link
        to={`${resourcePathFromModel(
          BareMetalHostModel,
          host.metadata.name,
          host.metadata.namespace,
        )}/edit?powerMgmt`}
      >
        {t('metal3-plugin~Add credentials')}
      </Link>
    </div>
  ),
});

const BareMetalHostStatus: React.FC<BareMetalHostStatusProps> = ({
  status,
  titleKey,
  descriptionKey,
  host,
  nodeMaintenance,
  className,
}) => {
  const { t } = useTranslation();
  const statusTitle = t(titleKey) || status;
  const action = hostStatusActions(t)[status]?.(host);
  switch (true) {
    case [NODE_STATUS_STARTING_MAINTENANCE, NODE_STATUS_UNDER_MAINTENANCE].includes(status):
      return (
        <MaintenancePopover
          title={statusTitle}
          nodeMaintenance={nodeMaintenance}
          className={className}
        />
      );
    case [NODE_STATUS_STOPPING_MAINTENANCE, ...HOST_PROGRESS_STATES].includes(status):
      return (
        <ProgressStatus title={statusTitle} className={className}>
          {descriptionKey && t(descriptionKey)}
          {action}
        </ProgressStatus>
      );
    case HOST_ERROR_STATES.includes(status):
      return (
        <ErrorStatus title={statusTitle} className={className}>
          <p>{t(descriptionKey)}</p>
          <p>{getHostErrorMessage(host)}</p>
          {action}
        </ErrorStatus>
      );
    case HOST_SUCCESS_STATES.includes(status):
      return (
        <SuccessStatus title={statusTitle} className={className}>
          {descriptionKey && t(descriptionKey)}
          {action}
        </SuccessStatus>
      );
    case HOST_INFO_STATES.includes(status):
      return (
        <InfoStatus title={statusTitle} className={className}>
          {descriptionKey && t(descriptionKey)}
          {action}
        </InfoStatus>
      );
    default: {
      const statusBody = <Status status={status} title={statusTitle} className={className} />;

      return descriptionKey || action ? (
        <PopoverStatus title={statusTitle} statusBody={statusBody}>
          {descriptionKey && t(descriptionKey)}
          {action}
        </PopoverStatus>
      ) : (
        statusBody
      );
    }
  }
};

type BareMetalHostStatusProps = StatusProps & {
  host?: BareMetalHostKind;
  nodeMaintenance?: K8sResourceKind;
  className?: string;
};

export default BareMetalHostStatus;

import * as React from 'react';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import {
  ProgressStatus,
  SuccessStatus,
  ErrorStatus,
  Status,
  PopoverStatus,
  InfoStatus,
} from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
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
import { getHostErrorMessage } from '../../selectors';
import { StatusProps } from '../types';
import MaintenancePopover from '../maintenance/MaintenancePopover';
import { BareMetalHostKind } from '../../types';
import { BareMetalHostModel } from '../../models';

export const HOST_STATUS_ACTIONS = {
  [HOST_STATUS_UNMANAGED]: (host: BareMetalHostKind) => (
    <p>
      <Link
        to={`${resourcePathFromModel(
          BareMetalHostModel,
          host.metadata.name,
          host.metadata.namespace,
        )}/edit?powerMgmt`}
      >
        Add credentials
      </Link>
    </p>
  ),
};

const BareMetalHostStatus: React.FC<BareMetalHostStatusProps> = ({
  status,
  title,
  description,
  host,
  nodeMaintenance,
}) => {
  const statusTitle = title || status;
  const action = HOST_STATUS_ACTIONS[status]?.(host);
  switch (true) {
    case [NODE_STATUS_STARTING_MAINTENANCE, NODE_STATUS_UNDER_MAINTENANCE].includes(status):
      return <MaintenancePopover title={statusTitle} nodeMaintenance={nodeMaintenance} />;
    case [NODE_STATUS_STOPPING_MAINTENANCE, ...HOST_PROGRESS_STATES].includes(status):
      return (
        <ProgressStatus title={statusTitle}>
          {description}
          {action}
        </ProgressStatus>
      );
    case HOST_ERROR_STATES.includes(status):
      return (
        <ErrorStatus title={statusTitle}>
          <p>{description}</p>
          <p>{getHostErrorMessage(host)}</p>
          {action}
        </ErrorStatus>
      );
    case HOST_SUCCESS_STATES.includes(status):
      return (
        <SuccessStatus title={statusTitle}>
          {description}
          {action}
        </SuccessStatus>
      );
    case HOST_INFO_STATES.includes(status):
      return (
        <InfoStatus title={statusTitle}>
          {description}
          {action}
        </InfoStatus>
      );
    default: {
      const statusBody = <Status status={status} title={statusTitle} />;

      return description || action ? (
        <PopoverStatus title={statusTitle} statusBody={statusBody}>
          {description}
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
};

export default BareMetalHostStatus;

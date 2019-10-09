import * as React from 'react';
import { Status } from '@console/shared';
import { HOST_STATUS_UNDER_MAINTENANCE, HOST_STATUS_STARTING_MAINTENANCE } from '../../constants';
import { StatusProps } from '../types';
import MaintenancePopover from '../maintenance/MaintenancePopover';

const BareMetalNodeStatus: React.FC<StatusProps> = ({ status, title, ...props }) => {
  const statusTitle = title || status;
  switch (true) {
    case [HOST_STATUS_STARTING_MAINTENANCE, HOST_STATUS_UNDER_MAINTENANCE].includes(status):
      return (
        <MaintenancePopover title={statusTitle} maintenance={props.maintenance} host={props.host} />
      );
    default:
      return <Status status={status} title={statusTitle} />;
  }
};

export default BareMetalNodeStatus;

import * as React from 'react';
import { Status, ProgressStatus } from '@console/shared';
import {
  NODE_STATUS_UNDER_MAINTENANCE,
  NODE_STATUS_STARTING_MAINTENANCE,
  NODE_STATUS_STOPPING_MAINTENANCE,
} from '../../constants';
import { StatusProps } from '../types';
import MaintenancePopover from '../maintenance/MaintenancePopover';

const BareMetalNodeStatus: React.FC<StatusProps> = ({ status, title, ...props }) => {
  const statusTitle = title || status;
  switch (true) {
    case [NODE_STATUS_STARTING_MAINTENANCE, NODE_STATUS_UNDER_MAINTENANCE].includes(status):
      return <MaintenancePopover title={statusTitle} maintenance={props.maintenance} />;
    case status === NODE_STATUS_STOPPING_MAINTENANCE:
      return <ProgressStatus title={statusTitle} />;
    default:
      return <Status status={status} title={statusTitle} />;
  }
};

export default BareMetalNodeStatus;

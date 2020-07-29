import * as React from 'react';
import { Status, ProgressStatus } from '@console/shared';
import {
  NODE_STATUS_UNDER_MAINTENANCE,
  NODE_STATUS_STARTING_MAINTENANCE,
  NODE_STATUS_STOPPING_MAINTENANCE,
} from '../../constants';
import { BareMetalHostStatusProps } from '../types';
import MaintenancePopover from '../maintenance/MaintenancePopover';
import { NODE_STATUS_SERVER_CSR } from '../../status/baremetal-node-status';
import CSRStatus from './CSRStatus';

const BareMetalNodeStatus: React.FC<BareMetalHostStatusProps> = ({
  status,
  title,
  nodeMaintenance,
  csr,
  className,
}) => {
  const statusTitle = title || status;
  switch (true) {
    case status === NODE_STATUS_SERVER_CSR:
      return <CSRStatus title={statusTitle} csr={csr} serverCSR />;
    case [NODE_STATUS_STARTING_MAINTENANCE, NODE_STATUS_UNDER_MAINTENANCE].includes(status):
      return (
        <MaintenancePopover
          title={statusTitle}
          nodeMaintenance={nodeMaintenance}
          className={className}
        />
      );
    case status === NODE_STATUS_STOPPING_MAINTENANCE:
      return <ProgressStatus title={statusTitle} className={className} />;
    default:
      return <Status status={status} title={statusTitle} className={className} />;
  }
};

export default BareMetalNodeStatus;

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Status, ProgressStatus } from '@console/shared';
import {
  NODE_STATUS_UNDER_MAINTENANCE,
  NODE_STATUS_STARTING_MAINTENANCE,
  NODE_STATUS_STOPPING_MAINTENANCE,
} from '../../constants';
import { NODE_STATUS_SERVER_CSR } from '../../status/baremetal-node-status';
import MaintenancePopover from '../maintenance/MaintenancePopover';
import { BareMetalHostStatusProps } from '../types';
import CSRStatus from './CSRStatus';

const BareMetalNodeStatus: React.FC<BareMetalHostStatusProps> = ({
  status,
  titleKey,
  nodeMaintenance,
  csr,
  className,
}) => {
  const { t } = useTranslation();
  const statusTitle = t(titleKey) || status;
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

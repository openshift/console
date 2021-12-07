import * as React from 'react';
import { OffIcon, PausedIcon, SyncAltIcon, InProgressIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';

import './vm-status-inventory-item.scss';

const iconMap = {
  Running: SyncAltIcon,
  Paused: PausedIcon,
  Stopped: OffIcon,
  Starting: InProgressIcon,
  Migrating: InProgressIcon,
  Stopping: InProgressIcon,
  Deleting: InProgressIcon,
  Provisioning: InProgressIcon,
  Terminating: InProgressIcon,
  CrashLoopBackOff: RedExclamationCircleIcon,
  ErrorUnschedulable: RedExclamationCircleIcon,
  ErrImagePull: RedExclamationCircleIcon,
  ImagePullBackOff: RedExclamationCircleIcon,
  ErrorPvcNotFound: RedExclamationCircleIcon,
  ErrorDataVolumeNotFound: RedExclamationCircleIcon,
  DataVolumeError: RedExclamationCircleIcon,
  Unknown: YellowExclamationTriangleIcon,
};

const getVMStatusIcon = (status: string): React.ComponentClass | React.FC =>
  iconMap[status] || iconMap.Unknown;

export type VMStatusInventoryItemProps = {
  status: string;
  count: number;
};

export const VMStatusInventoryItem: React.FC<VMStatusInventoryItemProps> = ({ status, count }) => {
  const Icon = getVMStatusIcon(status);
  const to = `/k8s/all-namespaces/virtualization?rowFilter-vm-status=${status}`;

  return (
    <div className="co-inventory-card__status">
      <span className="co-dashboard-icon kv-inventory-card__status-icon">{<Icon />}</span>
      <Link to={to} className="co-inventory-card__status-link">
        <span className="kv-inventory-card__status-text">{count}</span>
      </Link>
      <span>{status}</span>
    </div>
  );
};

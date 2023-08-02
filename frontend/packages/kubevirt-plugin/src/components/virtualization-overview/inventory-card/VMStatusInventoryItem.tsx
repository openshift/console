import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import { OffIcon } from '@patternfly/react-icons/dist/esm/icons/off-icon';
import { PausedIcon } from '@patternfly/react-icons/dist/esm/icons/paused-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { Link } from 'react-router-dom-v5-compat';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';

import './virt-overview-inventory-card.scss';

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
      <Link to={to}>
        <span className="kv-inventory-card__status-text">{count}</span>
      </Link>
      <span>{status}</span>
    </div>
  );
};

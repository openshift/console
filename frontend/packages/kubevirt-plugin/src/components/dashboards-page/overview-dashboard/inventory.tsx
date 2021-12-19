import * as React from 'react';
import { OffIcon } from '@patternfly/react-icons';
import { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { InventoryStatusGroup } from '@console/shared/src/components/dashboard/inventory-card/status-group';
import { StatusSimpleLabel } from '../../../constants/status-constants';
import {
  getVmStatusLabelFromPrintable,
  VMStatusSimpleLabel,
} from '../../../constants/vm/vm-status';
import { VMKind } from '../../../types';

import './inventory.scss';

export const getVMStatusGroups: StatusGroupMapper = (vms) => {
  const groups = {
    [InventoryStatusGroup.NOT_MAPPED]: {
      statusIDs: [VMStatusSimpleLabel.Running],
      count: 0,
      filterType: 'vm-status',
    },
    [InventoryStatusGroup.PROGRESS]: {
      statusIDs: [
        StatusSimpleLabel.Importing,
        VMStatusSimpleLabel.Starting,
        VMStatusSimpleLabel.Migrating,
        VMStatusSimpleLabel.Stopping,
        StatusSimpleLabel.Pending,
        VMStatusSimpleLabel.Deleting,
      ],
      count: 0,
      filterType: 'vm-status',
    },
    [InventoryStatusGroup.ERROR]: {
      statusIDs: [StatusSimpleLabel.Error],
      count: 0,
      filterType: 'vm-status',
    },
    [InventoryStatusGroup.WARN]: {
      statusIDs: [VMStatusSimpleLabel.Paused],
      count: 0,
      filterType: 'vm-status',
    },
    [InventoryStatusGroup.UNKNOWN]: {
      statusIDs: [StatusSimpleLabel.Other],
      count: 0,
      filterType: 'vm-status',
    },
    'vm-stopped': {
      statusIDs: [VMStatusSimpleLabel.Stopped],
      count: 0,
      filterType: 'vm-status',
    },
  };

  vms.forEach((vm: VMKind) => {
    const group =
      Object.keys(groups).find((key) =>
        groups[key].statusIDs.includes(getVmStatusLabelFromPrintable(vm?.status?.printableStatus)),
      ) || InventoryStatusGroup.UNKNOWN;
    groups[group].count++;
  });

  return groups;
};

export const VMOffGroupIcon: React.FC<{}> = () => (
  <OffIcon className="kubevirt-inventory-card__status-icon--off" />
);

import * as React from 'react';
import { OffIcon } from '@patternfly/react-icons';
import { getName } from '@console/shared/src/selectors/common';
import { PodKind, K8sResourceKind } from '@console/internal/module/k8s';
import { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { InventoryStatusGroup } from '@console/shared/src/components/dashboard/inventory-card/status-group';
import { getVMStatus } from '../../../statuses/vm/vm';
import { VMKind, VMIKind } from '../../../types';
import {
  VM_STATUS_V2V_CONVERSION_ERROR,
  VM_STATUS_RUNNING,
  VM_STATUS_OFF,
  VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
  VM_STATUS_IMPORTING,
  VM_STATUS_MIGRATING,
  VM_STATUS_STARTING,
  VM_STATUS_VMI_WAITING,
  VM_STATUS_V2V_CONVERSION_PENDING,
  VM_STATUS_POD_ERROR,
  VM_STATUS_ERROR,
  VM_STATUS_IMPORT_ERROR,
} from '../../../statuses/vm/constants';

import './inventory.scss';

const VM_STATUS_GROUP_MAPPER = {
  [InventoryStatusGroup.NOT_MAPPED]: [VM_STATUS_RUNNING],
  'vm-off': [VM_STATUS_OFF],
  [InventoryStatusGroup.PROGRESS]: [
    VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
    VM_STATUS_IMPORTING,
    VM_STATUS_MIGRATING,
    VM_STATUS_STARTING,
    VM_STATUS_VMI_WAITING,
    VM_STATUS_V2V_CONVERSION_PENDING,
  ],
  [InventoryStatusGroup.ERROR]: [
    VM_STATUS_V2V_CONVERSION_ERROR,
    VM_STATUS_POD_ERROR,
    VM_STATUS_ERROR,
    VM_STATUS_IMPORT_ERROR,
  ],
};

export const getVMStatusGroups: StatusGroupMapper = (
  vms,
  {
    vmis,
    pods,
    migrations,
  }: { vmis?: VMIKind[]; pods?: PodKind[]; migrations?: K8sResourceKind[] },
) => {
  const groups = {
    [InventoryStatusGroup.NOT_MAPPED]: {
      statusIDs: [],
      count: 0,
    },
    [InventoryStatusGroup.PROGRESS]: {
      statusIDs: [],
      count: 0,
    },
    [InventoryStatusGroup.ERROR]: {
      statusIDs: [],
      count: 0,
    },
    [InventoryStatusGroup.UNKNOWN]: {
      statusIDs: [],
      count: 0,
    },
    'vm-off': {
      statusIDs: [VM_STATUS_OFF],
      count: 0,
      filterType: 'vm-status',
    },
  };
  vms.forEach((vm: VMKind) => {
    const vmi = (vmis || []).find((instance) => getName(vm) === getName(instance));
    const { status } = getVMStatus({ vm, vmi, pods, migrations });
    const group =
      Object.keys(VM_STATUS_GROUP_MAPPER).find((key) =>
        VM_STATUS_GROUP_MAPPER[key].includes(status),
      ) || InventoryStatusGroup.UNKNOWN;
    groups[group].count++;
  });
  return groups;
};

export const VMOffGroupIcon: React.FC<{}> = () => (
  <OffIcon className="kubevirt-inventory-card__status-icon--off" />
);

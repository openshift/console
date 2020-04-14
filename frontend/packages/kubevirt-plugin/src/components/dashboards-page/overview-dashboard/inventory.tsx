import * as React from 'react';
import { OffIcon } from '@patternfly/react-icons';
import { getName } from '@console/shared/src/selectors/common';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { InventoryStatusGroup } from '@console/shared/src/components/dashboard/inventory-card/status-group';
import { getVMStatus } from '../../../statuses/vm/vm';
import { VMImportKind } from '../../../types/vm-import/ovirt/vm-import';
import { VMIKind, VMKind } from '../../../types';
import {
  VM_STATUS_ERROR,
  VM_STATUS_IMPORT_ERROR,
  VM_STATUS_IMPORT_PENDING,
  VM_STATUS_IMPORTING,
  VM_STATUS_MIGRATING,
  VM_STATUS_OFF,
  VM_STATUS_POD_ERROR,
  VM_STATUS_RUNNING,
  VM_STATUS_STARTING,
  VM_STATUS_STOPPING,
  VM_STATUS_V2V_CONVERSION_ERROR,
  VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
  VM_STATUS_V2V_CONVERSION_PENDING,
  VM_STATUS_V2V_VM_IMPORT_ERROR,
  VM_STATUS_VMI_WAITING,
} from '../../../statuses/vm/constants';

import './inventory.scss';

const VM_STATUS_GROUP_MAPPER = {
  [InventoryStatusGroup.NOT_MAPPED]: [VM_STATUS_RUNNING],
  'vm-off': [VM_STATUS_OFF],
  [InventoryStatusGroup.PROGRESS]: [
    VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
    VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
    VM_STATUS_IMPORTING,
    VM_STATUS_MIGRATING,
    VM_STATUS_STARTING,
    VM_STATUS_VMI_WAITING,
    VM_STATUS_V2V_CONVERSION_PENDING,
    VM_STATUS_IMPORT_PENDING,
    VM_STATUS_STOPPING,
  ],
  [InventoryStatusGroup.ERROR]: [
    VM_STATUS_V2V_CONVERSION_ERROR,
    VM_STATUS_V2V_VM_IMPORT_ERROR,
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
    vmImports,
  }: {
    vmis?: VMIKind[];
    pods?: PodKind[];
    migrations?: K8sResourceKind[];
    vmImports?: VMImportKind[];
  },
) => {
  const groups = {
    [InventoryStatusGroup.NOT_MAPPED]: {
      statusIDs: ['Running'],
      count: 0,
      filterType: 'vm-status',
    },
    [InventoryStatusGroup.PROGRESS]: {
      statusIDs: ['Importing', 'Starting', 'Migrating', 'Stopping', 'Pending'],
      count: 0,
      filterType: 'vm-status',
    },
    [InventoryStatusGroup.ERROR]: {
      statusIDs: ['Error'],
      count: 0,
      filterType: 'vm-status',
    },
    [InventoryStatusGroup.UNKNOWN]: {
      statusIDs: ['Other'],
      count: 0,
      filterType: 'vm-status',
    },
    'vm-off': {
      statusIDs: ['Off'],
      count: 0,
      filterType: 'vm-status',
    },
  };

  const vmStatuses = vms.map((vm: VMKind) => {
    const vmi = (vmis || []).find((instance) => getName(vm) === getName(instance));
    return getVMStatus({ vm, vmi, pods, migrations, vmImports }).status;
  });

  const vmisWithoutVM = (vmis || []).filter(
    (instance) => !vms.find((vm) => getName(vm) === getName(instance)),
  );
  const vmiStatuses = vmisWithoutVM.map(
    (vmi) => getVMStatus({ vm: undefined, vmi, pods, migrations, vmImports: undefined }).status,
  );

  [...vmStatuses, ...vmiStatuses].forEach((status) => {
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

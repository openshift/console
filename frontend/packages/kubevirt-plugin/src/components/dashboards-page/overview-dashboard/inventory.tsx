import * as React from 'react';
import { OffIcon } from '@patternfly/react-icons';
import { getName } from '@console/shared/src/selectors/common';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { InventoryStatusGroup } from '@console/shared/src/components/dashboard/inventory-card/status-group';
import { getVMStatus } from '../../../statuses/vm/vm-status';
import { VMImportKind } from '../../../types/vm-import/ovirt/vm-import';
import { VMIKind, VMKind } from '../../../types';
import { VMStatusSimpleLabel } from '../../../constants/vm/vm-status';
import { StatusSimpleLabel } from '../../../constants/status-simple-label';

import './inventory.scss';

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
    'vm-off': {
      statusIDs: [VMStatusSimpleLabel.Off],
      count: 0,
      filterType: 'vm-status',
    },
  };

  const vmSimpleStatuses = vms.map((vm: VMKind) => {
    const vmi = (vmis || []).find((instance) => getName(vm) === getName(instance));
    return getVMStatus({ vm, vmi, pods, migrations, vmImports }).status.getSimpleLabel();
  });

  const vmisWithoutVM = (vmis || []).filter(
    (instance) => !vms.find((vm) => getName(vm) === getName(instance)),
  );
  const vmiSimpleStatuses = vmisWithoutVM.map((vmi) =>
    getVMStatus({
      vm: undefined,
      vmi,
      pods,
      migrations,
      vmImports: undefined,
    }).status.getSimpleLabel(),
  );

  [...vmSimpleStatuses, ...vmiSimpleStatuses].forEach((simpleStatus) => {
    const group =
      Object.keys(groups).find((key) => groups[key].statusIDs.includes(simpleStatus)) ||
      InventoryStatusGroup.UNKNOWN;
    groups[group].count++;
  });

  return groups;
};

export const VMOffGroupIcon: React.FC<{}> = () => (
  <OffIcon className="kubevirt-inventory-card__status-icon--off" />
);

import * as React from 'react';
import { Link } from 'react-router-dom';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { getName, getNamespace } from '@console/shared';
import InventoryItem from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { resourcePath } from '@console/internal/components/utils';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { getVMLikeModel } from '../../../selectors/vm/vmlike';
import { getNetworks, getDisks } from '../../../selectors/vm';
import { getVMINetworks, getVMIDisks } from '../../../selectors/vmi';
import { VM_DETAIL_DISKS_HREF, VM_DETAIL_NETWORKS_HREF, DiskType } from '../../../constants';

export const VMInventoryCard: React.FC<VMInventoryCardProps> = () => {
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi } = vmDashboardContext;
  const vmiLike = vm || vmi;

  const isLoading = !vmiLike;
  const name = getName(vmiLike);
  const namespace = getNamespace(vmiLike);

  // prefer vmi over vm if available (means: is running)
  const nicCount = vm ? getNetworks(vm).length : getVMINetworks(vmi).length;
  const disks = vm ? getDisks(vm) : getVMIDisks(vmi);
  const diskCount = disks.filter((d) => d?.disk).length;
  const cdromCount = disks.filter((d) => d?.cdrom).length;
  // TODO: per design, snapshots should be added here (snapshots are not implemented at all atm)

  const basePath = resourcePath(getVMLikeModel(vmiLike).kind, name, namespace);
  const DisksTitle = React.useCallback(
    ({ children }) => (
      <Link
        to={`${basePath}/${VM_DETAIL_DISKS_HREF}?rowFilter-disk-types=${DiskType.DISK.getValue()}`}
      >
        {children}
      </Link>
    ),
    [basePath],
  );
  const CDROMTitle = React.useCallback(
    ({ children }) => (
      <Link
        to={`${basePath}/${VM_DETAIL_DISKS_HREF}?rowFilter-disk-types=${DiskType.CDROM.getValue()}`}
      >
        {children}
      </Link>
    ),
    [basePath],
  );
  const NicsTitle = React.useCallback(
    ({ children }) => <Link to={`${basePath}/${VM_DETAIL_NETWORKS_HREF}`}>{children}</Link>,
    [basePath],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Inventory</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={isLoading}>
        <InventoryItem
          isLoading={isLoading}
          title="NIC"
          count={nicCount}
          TitleComponent={NicsTitle}
        />
        <InventoryItem
          isLoading={isLoading}
          title="Disk"
          count={diskCount}
          TitleComponent={DisksTitle}
        />
        <InventoryItem
          isLoading={isLoading}
          title="CD-ROM"
          count={cdromCount}
          TitleComponent={CDROMTitle}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

type VMInventoryCardProps = DashboardItemProps;

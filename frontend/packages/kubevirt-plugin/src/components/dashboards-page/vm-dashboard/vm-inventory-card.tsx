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
import { VM_DETAIL_DISKS_HREF, VM_DETAIL_NETWORKS_HREF } from '../../../constants';

export const VMInventoryCard: React.FC<VMInventoryCardProps> = () => {
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi } = vmDashboardContext;
  const vmLike = vm || vmi;

  const isLoading = !vmLike;
  const name = getName(vmLike);
  const namespace = getNamespace(vmLike);

  // prefer vmi over vm if available (means: is running)
  const nicCount = vm ? getNetworks(vm).length : getVMINetworks(vmi).length;
  const diskCount = vm ? getDisks(vm).length : getVMIDisks(vmi).length;
  // TODO: per design, snapshots should be added here (snapshots are not implemented at all atm)

  const basePath = resourcePath(getVMLikeModel(vmLike).kind, name, namespace);
  const DisksTitle = React.useCallback(
    ({ children }) => <Link to={`${basePath}/${VM_DETAIL_DISKS_HREF}`}>{children}</Link>,
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
      </DashboardCardBody>
    </DashboardCard>
  );
};

type VMInventoryCardProps = DashboardItemProps;

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
import { getNetworks, getDisks } from '../../../selectors/vm';
import { getVMINetworks, getVMIDisks } from '../../../selectors/vmi';
import { VirtualMachineModel } from '../../../models';
import { VM_DETAIL_DISKS_HREF, VM_DETAIL_NETWORKS_HREF } from '../../../constants';

export const VMInventoryCard: React.FC<VMInventoryCardProps> = () => {
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi } = vmDashboardContext;

  const isLoading = !vm;
  const name = getName(vm);
  const namespace = getNamespace(vm);

  // prefer vmi over vm if available (means: is running)
  const nicCount = vmi && vmi.spec ? getVMINetworks(vmi).length : getNetworks(vm).length;
  const diskCount = vmi && vmi.spec ? getVMIDisks(vmi).length : getDisks(vm).length;
  // TODO: per design, snapshots should be added here (snapshots are not implemented at all atm)

  const basePath = resourcePath(VirtualMachineModel.kind, name, namespace);
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

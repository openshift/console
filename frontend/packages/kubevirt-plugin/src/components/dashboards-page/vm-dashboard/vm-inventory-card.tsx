import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import { resourcePath } from '@console/internal/components/utils';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { getName, getNamespace } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import InventoryItem from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import {
  DiskType,
  VM_DETAIL_DISKS_HREF,
  VM_DETAIL_NETWORKS_HREF,
  VM_DETAIL_SNAPSHOTS,
} from '../../../constants';
import { VirtualMachineSnapshotModel } from '../../../models';
import { getVmSnapshotVmName } from '../../../selectors/snapshot/snapshot';
import { getDisks, getNetworks } from '../../../selectors/vm';
import { getVMLikeModel } from '../../../selectors/vm/vmlike';
import { getVMIDisks, getVMINetworks } from '../../../selectors/vmi';
import { VMSnapshot } from '../../../types';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';

export const VMInventoryCard: React.FC<VMInventoryCardProps> = () => {
  const { t } = useTranslation();
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi, isVMPage } = vmDashboardContext;
  const vmiLike = isVMPage ? vm : vmi;

  const isLoading = !vmiLike;
  const name = getName(vmiLike);
  const namespace = getNamespace(vmiLike);

  // prefer vmi over vm if available (means: is running)
  const nicCount = isVMPage ? getNetworks(vm).length : getVMINetworks(vmi).length;
  const disks = isVMPage ? getDisks(vm) : getVMIDisks(vmi);
  const diskCount = disks.filter((d) => d?.disk).length;
  const cdromCount = disks.filter((d) => d?.cdrom).length;
  const lunCount = disks.filter((d) => d?.lun).length;

  const snapshotResource: WatchK8sResource = React.useMemo(
    () => ({
      isList: true,
      kind: VirtualMachineSnapshotModel.kind,
      namespaced: true,
      namespace,
    }),
    [namespace],
  );

  const [snapshots, snapshotsLoaded, snapshotsError] = useK8sWatchResource<VMSnapshot[]>(
    snapshotResource,
  );
  const filteredSnapshots = snapshots.filter((snap) => getVmSnapshotVmName(snap) === name);
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
  const LUNTitle = React.useCallback(
    ({ children }) => (
      <Link
        to={`${basePath}/${VM_DETAIL_DISKS_HREF}?rowFilter-disk-types=${DiskType.LUN.getValue()}`}
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
  const SnapshotsTitle = React.useCallback(
    ({ children }) => <Link to={`${basePath}/${VM_DETAIL_SNAPSHOTS}`}>{children}</Link>,
    [basePath],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('kubevirt-plugin~Inventory')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={isLoading}>
        {nicCount > 0 && (
          <InventoryItem
            isLoading={isLoading}
            title={t('kubevirt-plugin~NIC', { count: nicCount })}
            titlePlural={t('kubevirt-plugin~NIC', { count: nicCount })}
            count={nicCount}
            TitleComponent={NicsTitle}
            key="nic-inventory-item"
          />
        )}
        {diskCount > 0 && (
          <InventoryItem
            isLoading={isLoading}
            title={t('kubevirt-plugin~Disk', { count: diskCount })}
            titlePlural={t('kubevirt-plugin~Disk', { count: diskCount })}
            count={diskCount}
            TitleComponent={DisksTitle}
            key="disk-inventory-item"
          />
        )}
        {cdromCount > 0 && (
          <InventoryItem
            isLoading={isLoading}
            title={t('kubevirt-plugin~CD-ROM', { count: cdromCount })}
            titlePlural={t('kubevirt-plugin~CD-ROM', { count: cdromCount })}
            count={cdromCount}
            TitleComponent={CDROMTitle}
            key="cdrom-inventory-item"
          />
        )}
        {lunCount > 0 && (
          <InventoryItem
            isLoading={isLoading}
            title={t('kubevirt-plugin~LUN', { count: lunCount })}
            titlePlural={t('kubevirt-plugin~LUN', { count: lunCount })}
            count={lunCount}
            TitleComponent={LUNTitle}
            key="lun-inventory-item"
          />
        )}
        {filteredSnapshots?.length > 0 && (
          <InventoryItem
            isLoading={isLoading || !snapshotsLoaded}
            error={snapshotsError}
            title={t('kubevirt-plugin~Snapshot', { count: filteredSnapshots.length })}
            titlePlural={t('kubevirt-plugin~Snapshot', { count: filteredSnapshots.length })}
            count={filteredSnapshots.length}
            TitleComponent={SnapshotsTitle}
            key="snapshots-inventory-item"
          />
        )}
      </DashboardCardBody>
    </DashboardCard>
  );
};

type VMInventoryCardProps = DashboardItemProps;

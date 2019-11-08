import * as React from 'react';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import { getName, getNamespace, getUID, getCreationTimestamp, getNodeName } from '@console/shared';
import {
  ResourceLink,
  Timestamp,
  NodeLink,
  resourcePath,
} from '@console/internal/components/utils';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { isVMRunning } from '../../../selectors/vm';
import { getVMStatus } from '../../../statuses/vm/vm';
import { VirtualMachineModel } from '../../../models';
import { getVmiIpAddressesString } from '../../ip-addresses';
import { VM_DETAIL_OVERVIEW_HREF } from '../../../constants';

export const VMDetailsCard: React.FC<VMDetailsCardProps> = () => {
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi, pods, migrations } = vmDashboardContext;

  const vmStatus = getVMStatus({ vm, vmi, pods, migrations });
  const { launcherPod } = vmStatus;

  const ipAddrs = getVmiIpAddressesString(vmi, vmStatus);

  const isNodeLoading = !vm || !pods || !vmStatus;
  const name = getName(vm);
  const namespace = getNamespace(vm);

  const viewAllLink = `${resourcePath(
    VirtualMachineModel.kind,
    name,
    namespace,
  )}/${VM_DETAIL_OVERVIEW_HREF}`;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Details</DashboardCardTitle>
        <DashboardCardLink to={viewAllLink}>View all</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={false}>
        <DetailsBody>
          <DetailItem title="Name" error={false} isLoading={!vm} valueClassName="co-select-to-copy">
            {name}
          </DetailItem>
          <DetailItem title="Namespace" error={false} isLoading={!vm}>
            <ResourceLink kind="Namespace" name={namespace} title={getUID(vm)} namespace={null} />
          </DetailItem>
          <DetailItem title="Created" error={false} isLoading={!vm}>
            <Timestamp timestamp={getCreationTimestamp(vm)} />
          </DetailItem>
          <DetailItem
            title="Node"
            error={!isNodeLoading && (!launcherPod || !isVMRunning(vm))}
            isLoading={isNodeLoading}
          >
            {launcherPod && <NodeLink name={getNodeName(launcherPod)} />}
          </DetailItem>
          <DetailItem
            title="IP Address"
            error={!ipAddrs}
            isLoading={!vm}
            valueClassName="co-select-to-copy"
          >
            {ipAddrs}
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type VMDetailsCardProps = DashboardItemProps;

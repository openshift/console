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
import { VirtualMachineModel } from '../../../models';
import { getVmiIpAddresses } from '../../../selectors/vmi/ip-address';
import { VM_DETAIL_OVERVIEW_HREF } from '../../../constants';
import { findVMPod } from '../../../selectors/pod/selectors';

export const VMDetailsCard: React.FC<VMDetailsCardProps> = () => {
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi, pods } = vmDashboardContext;
  const vmLike = vm || vmi;

  const launcherPod = findVMPod(vmLike, pods);

  const ipAddrs = getVmiIpAddresses(vmi).join(', ');

  const isNodeLoading = !vmLike || !pods;
  const name = getName(vmLike);
  const namespace = getNamespace(vmLike);

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
          <DetailItem
            title="Name"
            error={false}
            isLoading={!vmLike}
            valueClassName="co-select-to-copy"
          >
            {name}
          </DetailItem>
          <DetailItem title="Namespace" error={false} isLoading={!vmLike}>
            <ResourceLink
              kind="Namespace"
              name={namespace}
              title={getUID(vmLike)}
              namespace={null}
            />
          </DetailItem>
          <DetailItem title="Created" error={false} isLoading={!vmLike}>
            <Timestamp timestamp={getCreationTimestamp(vmLike)} />
          </DetailItem>
          <DetailItem title="Node" error={!isNodeLoading && !launcherPod} isLoading={isNodeLoading}>
            {launcherPod && <NodeLink name={getNodeName(launcherPod)} />}
          </DetailItem>
          <DetailItem
            title="IP Address"
            error={!ipAddrs}
            isLoading={!vmLike}
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

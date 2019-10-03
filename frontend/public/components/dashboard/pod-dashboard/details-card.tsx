import * as React from 'react';
import { getName, getNamespace, getUID, getCreationTimestamp } from '@console/shared';
import { getNodeName, podIpAddress } from '@console/shared/src/selectors/pod';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import { PodModel } from '../../../models';
import { resourcePath, ResourceLink, Timestamp, NodeLink } from '../../utils';
import { POD_DETAIL_OVERVIEW_HREF } from '../../utils/href';
import { PodDashboardContext } from './pod-dashboard-context';
import { DashboardItemProps } from '../with-dashboard-resources';

export const DetailsCard: React.FC<DetailsCardProps> = () => {
  const podDashboardContext = React.useContext(PodDashboardContext);
  const { pod } = podDashboardContext;

  const name = getName(pod);
  const namespace = getNamespace(pod);

  const viewAllLink = `${resourcePath(PodModel.kind, name, namespace)}/${POD_DETAIL_OVERVIEW_HREF}`;

  const ip = podIpAddress(pod);
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Details</DashboardCardTitle>
        <DashboardCardLink to={viewAllLink}>View all</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={false}>
        <DetailsBody>
          <DetailItem title="Name" error={false} isLoading={!pod}>
            {name}
          </DetailItem>
          <DetailItem title="Namespace" error={false} isLoading={!pod}>
            <ResourceLink kind="Namespace" name={namespace} title={getUID(pod)} />
          </DetailItem>
          <DetailItem title="Created" error={false} isLoading={!pod}>
            <Timestamp timestamp={getCreationTimestamp(pod)} />
          </DetailItem>
          <DetailItem title="Node" isLoading={!pod}>
            <NodeLink name={getNodeName(pod)} />
          </DetailItem>
          <DetailItem title="IP Address" error={!ip} isLoading={!pod}>
            {ip}
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type DetailsCardProps = DashboardItemProps;

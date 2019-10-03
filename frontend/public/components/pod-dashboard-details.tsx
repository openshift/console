import * as React from 'react';
import { getName, getNamespace, getUID, getCreationTimestamp } from '@console/shared';
import { getNodeName, podIpAddress } from '@console/shared/src/selectors/pod';
import { PodModel } from '../models';
import { resourcePath, ResourceLink, Timestamp, NodeLink } from './utils';
import { POD_DETAIL_OVERVIEW_HREF } from './utils/href';
import {
  DashboardCard,
  DashboardCardTitle,
  DashboardCardLink,
  DashboardCardHeader,
  DashboardCardBody,
} from './dashboard/dashboard-card';
import { DetailsBody, DetailItem } from './dashboard/details-card';
import { DashboardItemProps } from './dashboards-page/with-dashboard-resources';
import { PodDashboardContext } from './pod-dashboard-context';

export const PodDashboardDetailsCard: React.FC<PodDashboardDetailsCardProps> = () => {
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

type PodDashboardDetailsCardProps = DashboardItemProps;

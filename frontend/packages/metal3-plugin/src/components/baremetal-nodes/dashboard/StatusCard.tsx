import * as React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { NodeDashboardContext } from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import { HealthChecksItem } from '@console/app/src/components/nodes/node-dashboard/StatusCard';

import { BareMetalNodeDashboardContext } from './BareMetalNodeDashboardContext';
import { bareMetalNodeStatus } from '../../../status/baremetal-node-status';
import BareMetalNodeStatus from '../BareMetalNodeStatus';

const StatusCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const { nodeMaintenance } = React.useContext(BareMetalNodeDashboardContext);
  const status = bareMetalNodeStatus({ node: obj, nodeMaintenance });
  return (
    <DashboardCard gradient data-test-id="status-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={!obj}>
        <HealthBody>
          <Gallery className="co-overview-status__health" gutter="md">
            <GalleryItem>
              <BareMetalNodeStatus
                {...status}
                nodeMaintenance={nodeMaintenance}
                className="co-node-status__health"
              />
            </GalleryItem>
            <GalleryItem>
              <HealthChecksItem />
            </GalleryItem>
          </Gallery>
        </HealthBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default StatusCard;

import * as React from 'react';
import { Gallery, GalleryItem, Stack, StackItem } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { NodeDashboardContext } from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import { HealthChecksItem } from '@console/app/src/components/nodes/node-dashboard/NodeHealth';
import NodeAlerts from '@console/app/src/components/nodes/node-dashboard/NodeAlerts';
import { useFlag } from '@console/shared/src/hooks/flag';
import { StatusItem } from '@console/shared/src/components/dashboard/status-card/AlertItem';
import { BlueInfoCircleIcon } from '@console/shared';
import { resourcePathFromModel } from '@console/internal/components/utils';

import { BareMetalNodeDashboardContext } from './BareMetalNodeDashboardContext';
import { bareMetalNodeStatus } from '../../../status/baremetal-node-status';
import BareMetalNodeStatus from '../BareMetalNodeStatus';
import { BMO_ENABLED_FLAG } from '../../../features';
import { hasPowerManagement } from '../../../selectors';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostKind } from '../../../types';

const POWER_MGMT_MSG =
  'Power operations cannot be performed on this host until Baseboard Management Controller (BMC) credentials are provided for the underlying host.';

const POWER_MGMT_ALERT = (host: BareMetalHostKind) => ({
  title: 'Power management not available',
  message: (
    <Stack hasGutter>
      <StackItem>{POWER_MGMT_MSG}</StackItem>
      <StackItem>
        <Link
          to={`${resourcePathFromModel(
            BareMetalHostModel,
            host.metadata.name,
            host.metadata.namespace,
          )}/edit?powerMgmt`}
        >
          Add credentials
        </Link>
      </StackItem>
    </Stack>
  ),
});

const BMO_DISABLED_ALERT = {
  title: 'Bare Metal Operator not available',
  message: 'The Bare Metal Operator that enables this capability is not available or disabled.',
};

const getDisabledAlert = (bmoEnabled: boolean, hasPowerMgmt: boolean, host: BareMetalHostKind) => {
  if (!bmoEnabled) {
    return BMO_DISABLED_ALERT;
  }
  if (host && !hasPowerMgmt) {
    return POWER_MGMT_ALERT(host);
  }
  return undefined;
};

const StatusCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const { nodeMaintenance, csr, host } = React.useContext(BareMetalNodeDashboardContext);
  const bmoEnabled = useFlag(BMO_ENABLED_FLAG);
  const status = bareMetalNodeStatus({ node: obj, nodeMaintenance, csr });
  const hasPowerMgmt = hasPowerManagement(host);
  return (
    <DashboardCard gradient data-test-id="status-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={!obj}>
        <HealthBody>
          <Gallery className="co-overview-status__health" hasGutter>
            <GalleryItem>
              <BareMetalNodeStatus
                {...status}
                nodeMaintenance={nodeMaintenance}
                className="co-node-health__status"
                csr={csr}
              />
            </GalleryItem>
            <GalleryItem>
              <HealthChecksItem disabledAlert={getDisabledAlert(bmoEnabled, hasPowerMgmt, host)} />
            </GalleryItem>
          </Gallery>
        </HealthBody>
        <NodeAlerts>
          {host && !hasPowerMgmt && (
            <StatusItem Icon={BlueInfoCircleIcon} message={POWER_MGMT_MSG}>
              <Link
                to={`${resourcePathFromModel(
                  BareMetalHostModel,
                  host.metadata.name,
                  host.metadata.namespace,
                )}/edit?powerMgmt`}
              >
                Add credentials
              </Link>
            </StatusItem>
          )}
        </NodeAlerts>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default StatusCard;

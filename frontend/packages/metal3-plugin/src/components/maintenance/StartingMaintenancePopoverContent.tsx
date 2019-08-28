import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/internal/components/utils';
import { Progress, ProgressSize, Alert, Expandable, Button } from '@patternfly/react-core';
import {
  getNodeMaintenanceReason,
  getNodeMaintenanceCreationTimestamp,
  getNodeMaintenanceProgressPercent,
  getNodeMaintenanceLastError,
  getNodeMaintenancePendingPods,
} from '../../selectors';
import stopNodeMaintenanceModal from '../modals/stop-node-maintenance-modal';
import MaintenancePopoverPodList from './MaintenancePopoverPodList';

type StartingMaintenancePopoverContentProps = {
  maintenance: K8sResourceKind;
  hostName: string;
};

const StartingMaintenancePopoverContent: React.FC<StartingMaintenancePopoverContentProps> = ({
  maintenance,
  hostName,
}) => {
  const [workloadsExpanded, setWorkloadsExpanded] = React.useState(false);

  const reason = getNodeMaintenanceReason(maintenance);
  const creationTimestamp = getNodeMaintenanceCreationTimestamp(maintenance);
  const lastError = getNodeMaintenanceLastError(maintenance);
  const pendingPods = getNodeMaintenancePendingPods(maintenance);

  return (
    <>
      <p>
        This host is entering maintenance. The cluster will automatically rebuild host&apos;s data
        30 minutes after entering maintenance.
      </p>
      <dl>
        <dt>Maintenance reason:</dt>
        <dd>{reason}</dd>
        <dt>Requested:</dt>
        <dd>
          <Timestamp timestamp={creationTimestamp} />
        </dd>
      </dl>
      <br />
      {lastError && (
        <>
          <Alert variant="warning" title="Workloads failing to move" isInline>
            {lastError}
          </Alert>
          <br />
        </>
      )}
      <Progress
        value={getNodeMaintenanceProgressPercent(maintenance)}
        title="Moving workloads"
        size={ProgressSize.sm}
      />
      <br />
      <Expandable
        toggleText={`Show remaining workloads (${pendingPods.length})`}
        onToggle={() => setWorkloadsExpanded(!workloadsExpanded)}
        isExpanded={workloadsExpanded}
      >
        <MaintenancePopoverPodList pods={pendingPods} />
      </Expandable>
      <br />
      <Button
        variant="link"
        onClick={() => stopNodeMaintenanceModal(maintenance, hostName)}
        isInline
      >
        Stop
      </Button>
    </>
  );
};

export default StartingMaintenancePopoverContent;

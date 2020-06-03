import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/internal/components/utils';
import { Progress, ProgressSize, Alert, ExpandableSection, Button } from '@patternfly/react-core';
import {
  getNodeMaintenanceReason,
  getNodeMaintenanceCreationTimestamp,
  getNodeMaintenanceProgressPercent,
  getNodeMaintenanceLastError,
  getNodeMaintenancePendingPods,
} from '../../selectors';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';
import MaintenancePopoverPodList from './MaintenancePopoverPodList';

type StartingMaintenancePopoverContentProps = {
  nodeMaintenance: K8sResourceKind;
};

const StartingMaintenancePopoverContent: React.FC<StartingMaintenancePopoverContentProps> = ({
  nodeMaintenance,
}) => {
  const reason = getNodeMaintenanceReason(nodeMaintenance);
  const creationTimestamp = getNodeMaintenanceCreationTimestamp(nodeMaintenance);
  const lastError = getNodeMaintenanceLastError(nodeMaintenance);
  const pendingPods = getNodeMaintenancePendingPods(nodeMaintenance);

  return (
    <>
      <p>
        Node is entering maintenance. The cluster will automatically rebuild node&apos;s data 30
        minutes after entering maintenance.
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
        value={getNodeMaintenanceProgressPercent(nodeMaintenance)}
        title="Moving workloads"
        size={ProgressSize.sm}
      />
      <br />
      <ExpandableSection toggleText={`Show remaining workloads (${pendingPods.length})`}>
        <MaintenancePopoverPodList pods={pendingPods} />
      </ExpandableSection>
      <br />
      <Button variant="link" onClick={() => stopNodeMaintenanceModal(nodeMaintenance)} isInline>
        Stop
      </Button>
    </>
  );
};

export default StartingMaintenancePopoverContent;

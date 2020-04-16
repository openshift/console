import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/internal/components/utils';
import { Button } from '@patternfly/react-core';
import { getNodeMaintenanceReason, getNodeMaintenanceCreationTimestamp } from '../../selectors';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';

type UnderMaintenancePopoverContentProps = {
  nodeMaintenance: K8sResourceKind;
};

const UnderMaintenancePopoverContent: React.FC<UnderMaintenancePopoverContentProps> = ({
  nodeMaintenance,
}) => {
  const reason = getNodeMaintenanceReason(nodeMaintenance);
  const creationTimestamp = getNodeMaintenanceCreationTimestamp(nodeMaintenance);

  return (
    <>
      <p>
        Node is under maintenance. The cluster will automatically rebuild node&apos;s data 30
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
      <Button variant="link" onClick={() => stopNodeMaintenanceModal(nodeMaintenance)} isInline>
        Stop maintenance
      </Button>
    </>
  );
};

export default UnderMaintenancePopoverContent;

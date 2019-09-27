import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/internal/components/utils';
import { Button } from '@patternfly/react-core';
import { getNodeMaintenanceReason, getNodeMaintenanceCreationTimestamp } from '../../selectors';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';

type UnderMaintenancePopoverContentProps = {
  maintenance: K8sResourceKind;
  hostName: string;
};

const UnderMaintenancePopoverContent: React.FC<UnderMaintenancePopoverContentProps> = ({
  maintenance,
  hostName,
}) => {
  const reason = getNodeMaintenanceReason(maintenance);
  const creationTimestamp = getNodeMaintenanceCreationTimestamp(maintenance);

  return (
    <>
      <p>
        This host is under maintenance. The cluster will automatically rebuild host&apos;s data 30
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
      <Button
        variant="link"
        onClick={() => stopNodeMaintenanceModal(maintenance, hostName)}
        isInline
      >
        Stop maintenance
      </Button>
    </>
  );
};

export default UnderMaintenancePopoverContent;

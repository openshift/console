import * as React from 'react';
import { Button } from 'patternfly-react';
import { AddCircleOIcon, MaintenanceIcon } from '@patternfly/react-icons';
import {
  ProgressStatus,
  SuccessStatus,
  ErrorStatus,
  Status,
  StatusIconAndText,
} from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { RequireCreatePermission } from '@console/internal/components/utils';
import { HostMultiStatus } from '../utils/host-status';
import {
  HOST_STATUS_DISCOVERED,
  HOST_PROGRESS_STATES,
  HOST_ERROR_STATES,
  HOST_SUCCESS_STATES,
  HOST_STATUS_UNDER_MAINTENANCE,
} from '../constants';
import { BaremetalHostModel } from '../models';

// TODO(jtomasek): Update this with onClick handler once add discovered host functionality
// is available
export const AddDiscoveredHostButton: React.FC<{ host: K8sResourceKind }> = (
  { host }, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const {
    metadata: { namespace },
  } = host;

  return (
    <RequireCreatePermission model={BaremetalHostModel} namespace={namespace}>
      <Button bsStyle="link">
        <StatusIconAndText icon={<AddCircleOIcon />} title="Add host" />
      </Button>
    </RequireCreatePermission>
  );
};

type BaremetalHostStatusProps = {
  host?: K8sResourceKind;
  status: HostMultiStatus;
};

const BaremetalHostStatus = ({
  host,
  status: { status, title, errorMessage },
}: BaremetalHostStatusProps) => {
  const statusTitle = title || status;

  switch (true) {
    case status === HOST_STATUS_DISCOVERED:
      return <AddDiscoveredHostButton host={host} />;
    case status === HOST_STATUS_UNDER_MAINTENANCE:
      return <StatusIconAndText icon={<MaintenanceIcon />} title={statusTitle} />;
    case HOST_PROGRESS_STATES.includes(status):
      return <ProgressStatus title={statusTitle} />;
    case HOST_SUCCESS_STATES.includes(status):
      return <SuccessStatus title={statusTitle} />;
    case HOST_ERROR_STATES.includes(status):
      return <ErrorStatus title={statusTitle}>{errorMessage}</ErrorStatus>;
    default:
      return <Status status={status} title={statusTitle} />;
  }
};

export default BaremetalHostStatus;

import * as React from 'react';
import { Button } from 'patternfly-react';
import { AddCircleOIcon } from '@patternfly/react-icons';
import {
  ProgressStatus,
  SuccessStatus,
  ErrorStatus,
  Status,
  StatusIconAndText,
  getNamespace,
} from '@console/shared';
import { RequireCreatePermission } from '@console/internal/components/utils';
import {
  HOST_STATUS_DISCOVERED,
  HOST_PROGRESS_STATES,
  HOST_ERROR_STATES,
  HOST_SUCCESS_STATES,
  NODE_STATUS_UNDER_MAINTENANCE,
  NODE_STATUS_STARTING_MAINTENANCE,
  NODE_STATUS_STOPPING_MAINTENANCE,
  HOST_STATUS_INSPECTING,
  HOST_STATUS_DEPROVISIONING,
  HOST_STATUS_AVAILABLE,
  HOST_STATUS_READY,
  HOST_STATUS_PROVISIONING,
} from '../../constants';
import { BareMetalHostModel } from '../../models';
import { getHostErrorMessage } from '../../selectors';
import { StatusProps } from '../types';
import MaintenancePopover from '../maintenance/MaintenancePopover';
import { BareMetalHostKind } from '../../types';

// TODO(jtomasek): Update this with onClick handler once add discovered host functionality
// is available
export const AddDiscoveredHostButton: React.FC<{ host: BareMetalHostKind }> = (
  { host }, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const namespace = getNamespace(host);

  return (
    <RequireCreatePermission model={BareMetalHostModel} namespace={namespace}>
      <Button bsStyle="link">
        <StatusIconAndText icon={<AddCircleOIcon />} title="Add host" />
      </Button>
    </RequireCreatePermission>
  );
};

const BareMetalHostStatus: React.FC<StatusProps> = ({ status, title, ...props }) => {
  const statusTitle = title || status;
  switch (true) {
    case status === HOST_STATUS_DISCOVERED:
      return <AddDiscoveredHostButton host={props.host} />;
    case [NODE_STATUS_STARTING_MAINTENANCE, NODE_STATUS_UNDER_MAINTENANCE].includes(status):
      return <MaintenancePopover title={statusTitle} maintenance={props.maintenance} />;
    case status === HOST_STATUS_INSPECTING:
      return (
        <ProgressStatus title={statusTitle}>
          The hardware details of the host are being collected. This will take a while. The host
          will become available when finished.
        </ProgressStatus>
      );
    case status === HOST_STATUS_PROVISIONING:
      return (
        <ProgressStatus title={statusTitle}>
          An image is being written to the host&apos;s disk(s). This will take a while.
        </ProgressStatus>
      );
    case status === HOST_STATUS_DEPROVISIONING:
      return (
        <ProgressStatus title={statusTitle}>
          The image is being wiped from the host&apos;s disk(s). This may take a while.
        </ProgressStatus>
      );
    case [NODE_STATUS_STOPPING_MAINTENANCE, ...HOST_PROGRESS_STATES].includes(status):
      return <ProgressStatus title={statusTitle} />;
    case HOST_ERROR_STATES.includes(status):
      return <ErrorStatus title={statusTitle}>{getHostErrorMessage(props.host)}</ErrorStatus>;
    case [HOST_STATUS_AVAILABLE, HOST_STATUS_READY].includes(status):
      return (
        <SuccessStatus title={statusTitle}>
          The host is available to be provisioned as a node.
        </SuccessStatus>
      );
    case HOST_SUCCESS_STATES.includes(status):
      return <SuccessStatus title={statusTitle} />;
    default:
      return <Status status={status} title={statusTitle} />;
  }
};

export default BareMetalHostStatus;

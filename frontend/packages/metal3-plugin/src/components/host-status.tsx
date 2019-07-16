import * as React from 'react';
import { Button } from 'patternfly-react';
import { AddCircleOIcon, SyncAltIcon, UnknownIcon } from '@patternfly/react-icons';

import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  StatusIconAndText,
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
} from '@console/internal/components/utils/status-icon';
import { RequireCreatePermission } from '@console/internal/components/utils';
import { getHostStatus } from '../utils/host-status';

import {
  HOST_STATUS_DISCOVERED,
  HOST_PROGRESS_STATES,
  HOST_ERROR_STATES,
  HOST_SUCCESS_STATES,
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
        <StatusIconAndText status="Add host" icon={<AddCircleOIcon />} />
      </Button>
    </RequireCreatePermission>
  );
};

type BaremetalHostStatusProps = {
  host: K8sResourceKind;
  machine?: K8sResourceKind;
  node?: K8sResourceKind;
};

const BaremetalHostStatus = ({ host }: BaremetalHostStatusProps) => {
  const hostStatus = getHostStatus(host);
  const { status, title } = hostStatus;

  switch (true) {
    case status === HOST_STATUS_DISCOVERED:
      return <AddDiscoveredHostButton host={host} />;
    case HOST_PROGRESS_STATES.includes(status):
      return <StatusIconAndText status={title} icon={<SyncAltIcon />} />;
    case HOST_SUCCESS_STATES.includes(status):
      return <StatusIconAndText status={title} icon={<GreenCheckCircleIcon />} />;
    case HOST_ERROR_STATES.includes(status):
      return <StatusIconAndText status={title} icon={<RedExclamationCircleIcon />} />;
    default:
      return <StatusIconAndText status={title} icon={<UnknownIcon />} />;
  }
};

export default BaremetalHostStatus;

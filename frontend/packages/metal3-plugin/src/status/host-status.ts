import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { getHostOperationalStatus, getHostProvisioningState, getHostErrorType } from '../selectors';
import {
  HOST_STATUS_TITLES,
  HOST_STATUS_DESCRIPTIONS,
  HOST_STATUS_ERROR,
  HOST_STATUS_DISCOVERED,
  HOST_PROGRESS_STATES,
  HOST_STATUS_DEPROVISIONING,
  HOST_STATUS_UNKNOWN,
} from '../constants';
import { StatusProps } from '../components/types';
import { BareMetalHostKind } from '../types';
import { getNodeMaintenanceStatus } from './node-maintenance-status';

export const getBareMetalHostStatus = (host: BareMetalHostKind) => {
  const operationalStatus = getHostOperationalStatus(host);
  const provisioningState = getHostProvisioningState(host);
  const errorType = getHostErrorType(host);

  let hostStatus;

  if (operationalStatus === HOST_STATUS_ERROR) {
    if (errorType) {
      hostStatus = errorType;
    } else {
      hostStatus = HOST_STATUS_ERROR;
    }
  } else if (operationalStatus === HOST_STATUS_DISCOVERED) {
    hostStatus = HOST_STATUS_DISCOVERED;
  } else if (provisioningState) {
    hostStatus = provisioningState;
  } else {
    hostStatus = HOST_STATUS_UNKNOWN;
  }

  return {
    status: hostStatus,
    title: HOST_STATUS_TITLES[hostStatus] || hostStatus,
    description: HOST_STATUS_DESCRIPTIONS[hostStatus],
    host,
  };
};

type HostStatusProps = {
  host: BareMetalHostKind;
  machine?: MachineKind;
  node?: NodeKind;
  nodeMaintenance?: K8sResourceKind;
};

export const getHostStatus = ({ host, nodeMaintenance }: HostStatusProps): StatusProps => {
  const hostStatus = getBareMetalHostStatus(host);
  if (hostStatus.status === HOST_STATUS_DEPROVISIONING) return hostStatus;
  return getNodeMaintenanceStatus(nodeMaintenance) || hostStatus;
};

export const isHostInProgressState = (host: BareMetalHostKind): boolean =>
  HOST_PROGRESS_STATES.includes(getBareMetalHostStatus(host).status);

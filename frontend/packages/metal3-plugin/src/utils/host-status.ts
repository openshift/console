import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { getDeletetionTimestamp } from '@console/shared/src/selectors';
import {
  getHostOperationalStatus,
  getHostProvisioningState,
  getNodeMaintenancePhase,
} from '../selectors';
import {
  HOST_STATUS_TITLES,
  HOST_STATUS_UNDER_MAINTENANCE,
  HOST_STATUS_STOPPING_MAINTENANCE,
  HOST_STATUS_READY,
  HOST_STATUS_REGISTRATION_ERROR,
  HOST_STATUS_REGISTERING,
  HOST_STATUS_ERROR,
  HOST_STATUS_PROVISIONING,
  HOST_STATUS_PROVISIONING_ERROR,
  HOST_STATUS_STARTING_MAINTENANCE,
  // HOST_STATUS_STARTING_MAINTENANCE,
} from '../constants';
import { HostMultiStatus } from '../components/types';

const getMaintenanceStatus = (maintenance: K8sResourceKind, host: K8sResourceKind) => {
  if (maintenance) {
    if (getDeletetionTimestamp(maintenance)) {
      return {
        status: HOST_STATUS_STOPPING_MAINTENANCE,
        title: HOST_STATUS_TITLES[HOST_STATUS_STOPPING_MAINTENANCE],
        maintenance,
        host,
      };
    }
    if (getNodeMaintenancePhase(maintenance) === 'Succeeded') {
      return {
        status: HOST_STATUS_UNDER_MAINTENANCE,
        title: HOST_STATUS_TITLES[HOST_STATUS_UNDER_MAINTENANCE],
        maintenance,
        host,
      };
    }
    return {
      status: HOST_STATUS_STARTING_MAINTENANCE,
      title: HOST_STATUS_TITLES[HOST_STATUS_STARTING_MAINTENANCE],
      maintenance,
      host,
    };
  }
  return null;
};

const getBaremetalHostStatus = (host: K8sResourceKind) => {
  const operationalStatus = getHostOperationalStatus(host);
  const provisioningState = getHostProvisioningState(host);

  let hostStatus;

  if (operationalStatus === HOST_STATUS_ERROR) {
    switch (provisioningState) {
      case HOST_STATUS_REGISTERING:
        hostStatus = HOST_STATUS_REGISTRATION_ERROR;
        break;
      case HOST_STATUS_PROVISIONING:
        hostStatus = HOST_STATUS_PROVISIONING_ERROR;
        break;
      default:
        hostStatus = HOST_STATUS_ERROR;
    }
  } else {
    hostStatus = provisioningState;
  }

  return {
    status: hostStatus,
    title: HOST_STATUS_TITLES[hostStatus] || hostStatus,
    host,
  };
};

type HostStatusProps = {
  host: K8sResourceKind;
  machine?: MachineKind;
  node?: NodeKind;
  nodeMaintenance?: K8sResourceKind;
};

export const getHostStatus = ({ host, nodeMaintenance }: HostStatusProps): HostMultiStatus =>
  getMaintenanceStatus(nodeMaintenance, host) || getBaremetalHostStatus(host);

export const canHostAddMachine = (status: string): boolean => [HOST_STATUS_READY].includes(status);

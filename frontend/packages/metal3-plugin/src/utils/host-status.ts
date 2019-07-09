import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';

import { getDeletetionTimestamp } from '@console/shared';
import {
  getHostOperationalStatus,
  getHostProvisioningState,
  getHostErrorMessage,
} from '../selectors';

import {
  HOST_STATUS_TITLES,
  HOST_STATUS_UNDER_MAINTENANCE,
  HOST_STATUS_STOPPING_MAINTENANCE,
  HOST_STATUS_READY,
} from '../constants';

const isUnderMaintanance = (maintenance) => {
  if (maintenance && !getDeletetionTimestamp(maintenance)) {
    return {
      status: HOST_STATUS_UNDER_MAINTENANCE,
      title: HOST_STATUS_TITLES[HOST_STATUS_UNDER_MAINTENANCE],
      maintenance,
    };
  }
  return null;
};

const isStoppingMaintanance = (maintenance) => {
  if (maintenance && getDeletetionTimestamp(maintenance)) {
    return {
      status: HOST_STATUS_STOPPING_MAINTENANCE,
      title: HOST_STATUS_TITLES[HOST_STATUS_STOPPING_MAINTENANCE],
      maintenance,
    };
  }
  return null;
};

const getBaremetalHostStatus = (host: K8sResourceKind) => {
  const operationalStatus = getHostOperationalStatus(host);
  const provisioningState = getHostProvisioningState(host);

  const hostStatus = provisioningState || operationalStatus || undefined;
  return {
    status: hostStatus,
    title: HOST_STATUS_TITLES[hostStatus] || hostStatus,
    errorMessage: getHostErrorMessage(host),
  };
};

export type HostMultiStatus = {
  status: string;
  title: string;
  errorMessage?: string;
};

export const getHostStatus = ({ host, nodeMaintenance }: HostStatusProps): HostMultiStatus => {
  // TODO(jtomasek): make this more robust by including node/machine status
  return (
    isUnderMaintanance(nodeMaintenance) ||
    isStoppingMaintanance(nodeMaintenance) ||
    getBaremetalHostStatus(host)
  );
};

type HostStatusProps = {
  host: K8sResourceKind;
  machine?: MachineKind;
  node?: NodeKind;
  nodeMaintenance?: K8sResourceKind;
};

export const canHostAddMachine = (status: string): boolean => [HOST_STATUS_READY].includes(status);

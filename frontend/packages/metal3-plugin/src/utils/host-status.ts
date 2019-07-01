import { K8sResourceKind } from '@console/internal/module/k8s';

import {
  getHostOperationalStatus,
  getHostProvisioningState,
  getHostErrorMessage,
  // isNodeUnschedulable,
} from '../selectors';

import {
  HOST_STATUS_TITLES,
  HOST_STATUS_READY,
  // HOST_STATUS_STARTING_MAINTENANCE,
} from '../constants';

// import { NOT_HANDLED } from '../common';

// const isStartingMaintenance = (node) => {
//   if (isNodeUnschedulable(node)) {
//     return {
//       status: HOST_STATUS_STARTING_MAINTENANCE,
//       text: HOST_STATUS_TITLES[HOST_STATUS_STARTING_MAINTENANCE],
//     };
//   }
//   return NOT_HANDLED;
// };

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

export const getHostStatus = (
  host: K8sResourceKind,
  // machine?: MachineKind,
  // node?: NodeKind,
) => {
  // TODO(jtomasek): make this more robust by including node/machine status
  // return isStartingMaintenance(node) || getBaremetalHostStatus(host);
  return getBaremetalHostStatus(host);
};

export const getSimpleHostStatus = (
  host: K8sResourceKind,
  // machine?: MachineKind,
  // node?: NodeKind,
): string => getHostStatus(host).status;

export const canHostAddMachine = (host: K8sResourceKind): boolean =>
  [HOST_STATUS_READY].includes(getSimpleHostStatus(host));
// export const canHostStartMaintenance = (hostNode: NodeKind) => hostNode && !isNodeUnschedulable(hostNode);
// export const canHostStopMaintenance = (hostNode: NodeKind) => isNodeUnschedulable(hostNode);

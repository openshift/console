import * as _ from 'lodash';

import { K8sResourceKind, MachineKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared';

type BaremetalHostDisk = {
  sizeGiB: number;
};

export const getHostOperationalStatus = (host: K8sResourceKind) =>
  _.get(host, 'status.operationalStatus');
export const getHostProvisioningState = (host: K8sResourceKind) =>
  _.get(host, 'status.provisioning.state');
export const getHostMachineName = (host: K8sResourceKind) => _.get(host, 'spec.machineRef.name');
export const getHostBMCAddress = (host: K8sResourceKind) => _.get(host, 'spec.bmc.address');
export const isHostOnline = (host: K8sResourceKind) => _.get(host, 'spec.online', false);
export const getHostNICs = (host: K8sResourceKind) => _.get(host, 'status.hardware.nics', []);
export const getHostStorage = (host: K8sResourceKind) => _.get(host, 'status.hardware.storage', []);
export const getHostCPU = (host: K8sResourceKind) => _.get(host, 'status.hardware.cpu', {});
export const getHostRAM = (host: K8sResourceKind) => _.get(host, 'status.hardware.ramGiB');
export const getHostErrorMessage = (host: K8sResourceKind) => _.get(host, 'status.errorMessage');
export const getHostDescription = (host: K8sResourceKind) => _.get(host, 'spec.description', '');
export const isHostPoweredOn = (host: K8sResourceKind) => _.get(host, 'status.poweredOn', false);
export const getHostTotalStorageCapacity = (host: K8sResourceKind) =>
  _.reduce(getHostStorage(host), (sum: number, disk: BaremetalHostDisk) => sum + disk.sizeGiB, 0);
export const getHostMachine = (host: K8sResourceKind, machines: MachineKind[]) =>
  machines.find((machine: MachineKind) => getHostMachineName(host) === getName(machine));

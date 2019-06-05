import * as _ from 'lodash-es';

import { K8sResourceKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared';

export const getOperationalStatus = (host) => _.get(host, 'status.operationalStatus');
export const getProvisioningState = (host) => _.get(host, 'status.provisioning.state');
export const getHostMachineName = (host) => _.get(host, 'spec.machineRef.name');
export const getHostBMCAddress = (host) => _.get(host, 'spec.bmc.address');
export const isHostOnline = (host) => _.get(host, 'spec.online', false);
export const getHostNICs = (host) => _.get(host, 'status.hardware.nics', []);
export const getHostStorage = (host) => _.get(host, 'status.hardware.storage', []);
export const getHostCPUs = (host) => _.get(host, 'status.hardware.cpus', []);
export const getHostRAM = (host) => _.get(host, 'status.hardware.ramGiB');
export const getHostErrorMessage = (host) => _.get(host, 'status.errorMessage');
export const getHostDescription = (host) => _.get(host, 'spec.description', '');
export const isHostPoweredOn = (host) => _.get(host, 'status.poweredOn', false);
export const getHostTotalStorageCapacity = (host) =>
  _.reduce(getHostStorage(host), (sum, disk) => sum + disk.sizeGiB, 0);
export const getHostMachine = (host: K8sResourceKind, machines: K8sResourceKind[]) =>
  machines.find((machine) => getHostMachineName(host) === getName(machine));

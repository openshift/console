import * as _ from 'lodash';
import { K8sResourceKind, MachineKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared/src/selectors';
import { BaremetalHostDisk } from '../types';
import {
  HOST_POWER_STATUS_POWERED_ON,
  HOST_POWER_STATUS_POWERING_OFF,
  HOST_POWER_STATUS_POWERING_ON,
  HOST_POWER_STATUS_POWERED_OFF,
} from '../constants';

export * from './node-maintanance';

export const getHostOperationalStatus = (host: K8sResourceKind) =>
  _.get(host, 'status.operationalStatus');
export const getHostProvisioningState = (host: K8sResourceKind) =>
  _.get(host, 'status.provisioning.state');
export const getHostMachineName = (host: K8sResourceKind) => _.get(host, 'spec.consumerRef.name');
export const getHostBMCAddress = (host: K8sResourceKind) => _.get(host, 'spec.bmc.address');
export const isHostOnline = (host: K8sResourceKind): boolean => _.get(host, 'spec.online', false);
export const getHostNICs = (host: K8sResourceKind) => _.get(host, 'status.hardware.nics', []);
export const getHostStorage = (host: K8sResourceKind) => _.get(host, 'status.hardware.storage', []);
export const getHostCPU = (host: K8sResourceKind) => _.get(host, 'status.hardware.cpu', {});
export const getHostRAMMiB = (host: K8sResourceKind) => _.get(host, 'status.hardware.ramMebibytes');
export const getHostErrorMessage = (host: K8sResourceKind) => _.get(host, 'status.errorMessage');
export const getHostDescription = (host: K8sResourceKind) => _.get(host, 'spec.description', '');
export const isHostPoweredOn = (host: K8sResourceKind): boolean =>
  _.get(host, 'status.poweredOn', false);
export const getHostPowerStatus = (host: K8sResourceKind) => {
  const isOnline = isHostOnline(host);
  const isPoweredOn = isHostPoweredOn(host);
  if (isOnline && isPoweredOn) return HOST_POWER_STATUS_POWERED_ON;
  if (!isOnline && isPoweredOn) return HOST_POWER_STATUS_POWERING_OFF;
  if (isOnline && !isPoweredOn) return HOST_POWER_STATUS_POWERING_ON;
  return HOST_POWER_STATUS_POWERED_OFF;
};
export const getHostVendorInfo = (host: K8sResourceKind) =>
  _.get(host, 'status.hardware.systemVendor', {});
export const getHostTotalStorageCapacity = (host: K8sResourceKind) =>
  _.reduce(getHostStorage(host), (sum: number, disk: BaremetalHostDisk) => sum + disk.sizeBytes, 0);
export const getHostBios = (host: K8sResourceKind) => _.get(host, 'status.hardware.firmware.bios');

export const getHostMachine = (host: K8sResourceKind, machines: MachineKind[] = []) =>
  machines.find((machine: MachineKind) => getHostMachineName(host) === getName(machine));

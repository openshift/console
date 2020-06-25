import * as _ from 'lodash';
import { getName, getAnnotations } from '@console/shared/src/selectors/common';
import { MachineKind } from '@console/internal/module/k8s';
import {
  BareMetalHostDisk,
  BareMetalHostNIC,
  BareMetalHostCPU,
  BareMetalHostSystemVendor,
  BareMetalHostBios,
  BareMetalHostKind,
} from '../types';
import {
  HOST_POWER_STATUS_POWERED_ON,
  HOST_POWER_STATUS_POWERING_OFF,
  HOST_POWER_STATUS_POWERING_ON,
  HOST_POWER_STATUS_POWERED_OFF,
  HOST_STATUS_UNMANAGED,
} from '../constants';

const ANNOTATION_HOST_RESTART = 'reboot.metal3.io';

export const getHostOperationalStatus = (host: BareMetalHostKind): string =>
  _.get(host, 'status.operationalStatus');
export const getHostErrorType = (host: BareMetalHostKind): string => host.status?.errorType;
export const getHostProvisioningState = (host: BareMetalHostKind): string =>
  _.get(host, 'status.provisioning.state');
export const getHostMachineName = (host: BareMetalHostKind): string =>
  _.get(host, 'spec.consumerRef.name');
export const getHostBMCAddress = (host: BareMetalHostKind): string =>
  _.get(host, 'spec.bmc.address');
export const getHostDisableCertificateVerification = (host: BareMetalHostKind): boolean =>
  _.get(host, 'spec.bmc.disableCertificateVerification', false);
export const getHostBootMACAddress = (host: BareMetalHostKind) =>
  _.get(host, 'spec') && host.spec.bootMACAddress;
export const isHostOnline = (host: BareMetalHostKind): boolean => _.get(host, 'spec.online', false);
export const getHostNICs = (host: BareMetalHostKind): BareMetalHostNIC[] =>
  _.get(host, 'status.hardware.nics', []);
export const getHostStorage = (host: BareMetalHostKind): BareMetalHostDisk[] =>
  _.get(host, 'status.hardware.storage', []);
export const getHostCPU = (host: BareMetalHostKind): BareMetalHostCPU =>
  _.get(host, 'status.hardware.cpu', {});
export const getHostRAMMiB = (host: BareMetalHostKind): number =>
  _.get(host, 'status.hardware.ramMebibytes');
export const getHostErrorMessage = (host: BareMetalHostKind): string =>
  _.get(host, 'status.errorMessage');
export const getHostDescription = (host: BareMetalHostKind): string =>
  _.get(host, 'spec.description', '');
export const isHostPoweredOn = (host: BareMetalHostKind): boolean =>
  _.get(host, 'status.poweredOn', false);
export const isHostScheduledForRestart = (host: BareMetalHostKind) =>
  !!Object.getOwnPropertyNames(getAnnotations(host, {})).find(
    (annotation) =>
      annotation === ANNOTATION_HOST_RESTART ||
      annotation.startsWith(`${ANNOTATION_HOST_RESTART}/`),
  );
export const getHostPowerStatus = (host: BareMetalHostKind): string => {
  const isOnline = isHostOnline(host);
  const isPoweredOn = isHostPoweredOn(host);
  if (isOnline && isPoweredOn) return HOST_POWER_STATUS_POWERED_ON;
  if (!isOnline && isPoweredOn) return HOST_POWER_STATUS_POWERING_OFF;
  if (isOnline && !isPoweredOn) return HOST_POWER_STATUS_POWERING_ON;
  return HOST_POWER_STATUS_POWERED_OFF;
};
export const getHostVendorInfo = (host: BareMetalHostKind): BareMetalHostSystemVendor =>
  _.get(host, 'status.hardware.systemVendor', {});
export const getHostTotalStorageCapacity = (host: BareMetalHostKind): number =>
  _.reduce(
    getHostStorage(host),
    (sum: number, disk: BareMetalHostDisk): number => sum + disk.sizeBytes,
    0,
  );
export const getHostBios = (host: BareMetalHostKind): BareMetalHostBios =>
  _.get(host, 'status.hardware.firmware.bios');

export const getHostMachine = (
  host: BareMetalHostKind,
  machines: MachineKind[] = [],
): MachineKind =>
  machines.find((machine: MachineKind) => getHostMachineName(host) === getName(machine));

export const hasPowerManagement = (host: BareMetalHostKind): boolean =>
  getHostProvisioningState(host) !== HOST_STATUS_UNMANAGED;

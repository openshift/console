import { InstanceConfig, VMImportConfig } from '../../tests/types/types';
import {
  IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  IMPORT_WIZARD_CONN_NAME_PREFIX,
} from '../../tests/utils/constants/common';
import { Workload, OperatingSystem, Flavor } from '../../tests/utils/constants/wizard';

const { V2V_INSTANCE_HOSTNAME, V2V_INSTANCE_USERNAME, V2V_INSTANCE_PASSWORD } = process.env;

const newInstanceConfig: InstanceConfig = {
  instance: IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  hostname: V2V_INSTANCE_HOSTNAME,
  username: V2V_INSTANCE_USERNAME,
  password: V2V_INSTANCE_PASSWORD,
  saveInstance: false,
};

const exInstanceConfig: InstanceConfig = {
  instance: IMPORT_WIZARD_CONN_NAME_PREFIX,
  hostname: V2V_INSTANCE_HOSTNAME,
  username: V2V_INSTANCE_USERNAME,
  password: V2V_INSTANCE_PASSWORD,
  saveInstance: false,
};

export const vmwareVMConfig: VMImportConfig = {
  name: 'v2v-rhel7-igor-imported',
  sourceVMName: 'v2v-rhel7-igor',
  provider: 'VMware',
  instanceConfig: newInstanceConfig,
  operatingSystem: OperatingSystem.RHEL7,
  workloadProfile: Workload.DESKTOP,
};

export const vmwareVMMultiNicConfig: VMImportConfig = {
  name: 'v2v-rhel7-2nic-2disk-igor-imported',
  sourceVMName: 'v2v-rhel7-2nic-2disk-igor',
  provider: 'VMware',
  instanceConfig: newInstanceConfig,
  operatingSystem: OperatingSystem.RHEL7,
  workloadProfile: Workload.SERVER,
};

export const importConfigs = [vmwareVMConfig, vmwareVMMultiNicConfig];

// Configuration for 2 VMs created one by one to re-use existing VMWare instance
export const vmware2VMsConfig1: VMImportConfig = {
  name: 'v2v-rhel7-imported-1',
  sourceVMName: 'v2v-rhel7-igor',
  provider: 'VMware',
  instanceConfig: newInstanceConfig,
  operatingSystem: OperatingSystem.RHEL7,
  workloadProfile: Workload.SERVER,
};

export const vmware2VMsConfig2: VMImportConfig = {
  name: 'v2v-rhel7-imported-2',
  sourceVMName: 'v2v-rhel7-igor',
  provider: 'VMware',
  instanceConfig: exInstanceConfig,
  operatingSystem: OperatingSystem.RHEL7,
  workloadProfile: Workload.SERVER,
};

// Config for migrating Windows 10 VM
const importedWindowsVm = 'v2v-win10-imported';
const sourceWindowsVm = 'v2v-win10';

export const vmwareWindowsVMConfig: VMImportConfig = {
  name: importedWindowsVm,
  sourceVMName: sourceWindowsVm,
  provider: 'VMware',
  instanceConfig: newInstanceConfig,
  operatingSystem: OperatingSystem.WINDOWS_10,
  workloadProfile: Workload.DESKTOP,
};

// Configurations for importing VMs with different flavors and workload profiles
const importedVmName = 'smal-rhel7-imported';
const sourceVMName = 'smal-rhel7';

function getFlavorConfig(currentFlavor: Flavor, currentProfile: Workload) {
  return {
    name: importedVmName,
    sourceVMName,
    provider: 'VMware',
    instanceConfig: newInstanceConfig,
    operatingSystem: OperatingSystem.RHEL7,
    workloadProfile: currentProfile,
    flavorConfig: {
      flavor: currentFlavor,
    },
  };
}

export const flavorWorkloadConfigs = [];

const flavors = [Flavor.TINY, Flavor.SMALL, Flavor.MEDIUM, Flavor.LARGE];
const profiles = [Workload.DESKTOP, Workload.SERVER, Workload.HIGH_PERFORMANCE];

flavors.forEach((currentFlavor) => {
  profiles.forEach((currentProfile) => {
    flavorWorkloadConfigs.push(getFlavorConfig(currentFlavor, currentProfile));
  });
});

import { InstanceConfig, VMImportConfig } from '../../tests/types/types';
import {
  IMPORT_WIZARD_CONN_NAME_PREFIX,
  IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
} from '../../tests/utils/constants/common';
import { Flavor, OperatingSystem, Workload } from '../../tests/utils/constants/wizard';

const {
  V2V_VMWARE_INSTANCE_API_URL,
  V2V_VMWARE_INSTANCE_USERNAME,
  V2V_VMWARE_INSTANCE_PASSWORD,
} = process.env;

const vmProvider = 'VMware';

const importedRhelVmName = 'v2v-rhel7-igor-imported';
const sourceRhelVMName = 'v2v-rhel7-igor';

const importedWindowsVm = 'v2v-win10-imported';
const sourceWindowsVm = 'win10-vm';

const newInstanceConfig: InstanceConfig = {
  instance: IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  hostname: V2V_VMWARE_INSTANCE_API_URL,
  username: V2V_VMWARE_INSTANCE_USERNAME,
  password: V2V_VMWARE_INSTANCE_PASSWORD,
  saveInstance: true,
};

const exInstanceConfig: InstanceConfig = {
  instance: IMPORT_WIZARD_CONN_NAME_PREFIX,
  hostname: V2V_VMWARE_INSTANCE_API_URL,
  username: V2V_VMWARE_INSTANCE_USERNAME,
  password: V2V_VMWARE_INSTANCE_PASSWORD,
  saveInstance: false,
};

export const vmwareVMConfig: VMImportConfig = {
  name: importedRhelVmName,
  description: 'Basic import from VMWare',
  sourceVMName: sourceRhelVMName,
  provider: vmProvider,
  instanceConfig: newInstanceConfig,
  operatingSystem: OperatingSystem.RHEL7,
  workloadProfile: Workload.SERVER,
  flavorConfig: {
    flavor: Flavor.SMALL,
  },
};

export const vmwareSecondVMConfig: VMImportConfig = {
  name: 'v2v-rhel7-igor-imported-second',
  description:
    'Basic import from VMWare, re-use of existing vmware instance, vm should start on creation',
  sourceVMName: sourceRhelVMName,
  provider: vmProvider,
  instanceConfig: exInstanceConfig,
  operatingSystem: OperatingSystem.RHEL7,
  workloadProfile: Workload.SERVER,
  startOnCreation: false,
  flavorConfig: {
    flavor: Flavor.SMALL,
  },
};

export const vmwareVMMultiNicConfig: VMImportConfig = {
  name: 'v2v-rhel7-2nic-2disk-igor-imported',
  sourceVMName: 'v2v-rhel7-2nic-2disk-igor',
  provider: vmProvider,
  instanceConfig: exInstanceConfig,
  operatingSystem: OperatingSystem.RHEL7,
  workloadProfile: Workload.SERVER,
  flavorConfig: {
    flavor: Flavor.SMALL,
  },
};

export const importConfigs = [vmwareVMConfig, vmwareVMMultiNicConfig];

// Configuration for 2 VMs created one by one to re-use existing VMWare instance
export const vmware2VMsConfig1: VMImportConfig = {
  name: importedRhelVmName,
  sourceVMName: sourceRhelVMName,
  provider: vmProvider,
  instanceConfig: exInstanceConfig,
  operatingSystem: OperatingSystem.RHEL7,
  workloadProfile: Workload.SERVER,
  flavorConfig: {
    flavor: Flavor.SMALL,
  },
};

export const vmware2VMsConfig2: VMImportConfig = {
  name: importedRhelVmName,
  sourceVMName: sourceRhelVMName,
  provider: vmProvider,
  instanceConfig: exInstanceConfig,
  operatingSystem: OperatingSystem.RHEL7,
  workloadProfile: Workload.SERVER,
  flavorConfig: {
    flavor: Flavor.SMALL,
  },
};

// Config for migrating Windows 10 VM

export const vmwareWindowsVMConfig: VMImportConfig = {
  name: importedWindowsVm,
  sourceVMName: sourceWindowsVm,
  provider: vmProvider,
  instanceConfig: exInstanceConfig,
  operatingSystem: OperatingSystem.WINDOWS_10,
  workloadProfile: Workload.DESKTOP,
  flavorConfig: {
    flavor: Flavor.MEDIUM,
  },
};

// Configurations for importing VMs with different flavors and workload profiles

function getFlavorConfig(currentFlavor: Flavor, currentProfile: Workload) {
  return {
    name: importedRhelVmName,
    description: `Flavor: ${currentFlavor}, Profile: ${currentProfile}`,
    sourceVMName: sourceRhelVMName,
    provider: vmProvider,
    instanceConfig: exInstanceConfig,
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

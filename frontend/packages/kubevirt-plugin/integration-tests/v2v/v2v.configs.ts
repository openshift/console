import { VMImportConfig } from '../tests/utils/types';
import {
  IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  IMPORT_WIZARD_CONN_NAME_PREFIX,
} from '../tests/utils/consts';
import { OperatingSystem, WorkloadProfile, Flavor } from '../tests/utils/constants/wizard';

const { V2V_INSTANCE_HOSTNAME, V2V_INSTANCE_USERNAME, V2V_INSTANCE_PASSWORD } = process.env;

export const vmwareVMConfig: VMImportConfig = {
  name: 'v2v-rhel7-igor-imported',
  sourceVMName: 'v2v-rhel7-igor',
  provider: 'VMware',
  instanceConfig: {
    instance: IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
    hostname: V2V_INSTANCE_HOSTNAME,
    username: V2V_INSTANCE_USERNAME,
    password: V2V_INSTANCE_PASSWORD,
    saveInstance: false,
  },
  operatingSystem: OperatingSystem.RHEL7_6,
  workloadProfile: WorkloadProfile.SERVER,
};

export const vmwareVMMultiNicConfig: VMImportConfig = {
  name: 'v2v-rhel7-2nic-2disk-igor-imported',
  sourceVMName: 'v2v-rhel7-2nic-2disk-igor',
  provider: 'VMware',
  instanceConfig: {
    instance: IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
    hostname: V2V_INSTANCE_HOSTNAME,
    username: V2V_INSTANCE_USERNAME,
    password: V2V_INSTANCE_PASSWORD,
    saveInstance: true,
  },
  operatingSystem: OperatingSystem.RHEL7_6,
  workloadProfile: WorkloadProfile.SERVER,
};

export const importConfigs = [vmwareVMConfig, vmwareVMMultiNicConfig];

// Configuration for 2 VMs created one by one to re-use existing VMWare instance
export const vmware2VMsConfig1: VMImportConfig = {
  name: 'v2v-rhel7-igor-imported',
  sourceVMName: 'v2v-rhel7-igor',
  provider: 'VMware',
  instanceConfig: {
    instance: IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
    hostname: V2V_INSTANCE_HOSTNAME,
    username: V2V_INSTANCE_USERNAME,
    password: V2V_INSTANCE_PASSWORD,
    saveInstance: false,
  },
  operatingSystem: OperatingSystem.RHEL7_6,
  workloadProfile: WorkloadProfile.SERVER,
};

export const vmware2VMsConfig2: VMImportConfig = {
  name: 'v2v-rhel7-igor-imported',
  sourceVMName: 'v2v-rhel7-igor',
  provider: 'VMware',
  instanceConfig: {
    instance: IMPORT_WIZARD_CONN_NAME_PREFIX,
    hostname: V2V_INSTANCE_HOSTNAME,
    username: V2V_INSTANCE_USERNAME,
    password: V2V_INSTANCE_PASSWORD,
    saveInstance: false,
  },
  operatingSystem: OperatingSystem.RHEL7_6,
  workloadProfile: WorkloadProfile.SERVER,
};

export const import2VMsConfigs = [vmware2VMsConfig1, vmware2VMsConfig2];

// Configurations for importing VMs with different flavors and workload profiles
const importedVmName = 'smal-rhel7-imported';
const sourceVMName = 'smal-rhel7';

function getFlavorConfig(currentFlavor: Flavor, currentProfile: WorkloadProfile) {
  const currentFlavorWorkloadConfig = {
    name: importedVmName,
    sourceVMName,
    provider: 'VMware',
    instanceConfig: {
      instance: IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
      hostname: V2V_INSTANCE_HOSTNAME,
      username: V2V_INSTANCE_USERNAME,
      password: V2V_INSTANCE_PASSWORD,
      saveInstance: false,
    },
    operatingSystem: OperatingSystem.RHEL7_6,
    workloadProfile: currentProfile,
    flavorConfig: {
      flavor: currentFlavor,
    },
  };
  return currentFlavorWorkloadConfig;
}

export const flavorWorkloadConfigs = [];

const flavors = [Flavor.TINY, Flavor.SMALL, Flavor.MEDIUM, Flavor.LARGE];
const profiles = [
  WorkloadProfile.DESKTOP,
  WorkloadProfile.SERVER,
  WorkloadProfile.HIGH_PERFORMANCE,
];

flavors.forEach((currentFlavor) => {
  profiles.forEach((currentProfile) => {
    flavorWorkloadConfigs.push(getFlavorConfig(currentFlavor, currentProfile));
  });
});

import { InstanceConfig, VMImportConfig } from '../../tests/types/types';
import {
  IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  IMPORT_WIZARD_CONN_NAME_PREFIX,
} from '../../tests/utils/constants/common';

const {
  V2V_RHV_INSTANCE_API_URL,
  V2V_RHV_INSTANCE_USERNAME,
  V2V_RHV_INSTANCE_PASSWORD,
  V2V_RHV_INSTANCE_CA_CERT,
  V2V_RHV_INSTANCE_CLUSTER,
} = process.env;

const newInstanceConfig: InstanceConfig = {
  instance: IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  apiUrl: V2V_RHV_INSTANCE_API_URL,
  username: V2V_RHV_INSTANCE_USERNAME,
  password: V2V_RHV_INSTANCE_PASSWORD,
  certificate: V2V_RHV_INSTANCE_CA_CERT,
  cluster: V2V_RHV_INSTANCE_CLUSTER,
  saveInstance: false,
};

const exInstanceConfig: InstanceConfig = {
  instance: IMPORT_WIZARD_CONN_NAME_PREFIX,
  apiUrl: V2V_RHV_INSTANCE_API_URL,
  username: V2V_RHV_INSTANCE_USERNAME,
  password: V2V_RHV_INSTANCE_PASSWORD,
  certificate: V2V_RHV_INSTANCE_CA_CERT,
  cluster: V2V_RHV_INSTANCE_CLUSTER,
  saveInstance: false,
};

export const vmName = 'v2v-cirros';
export const vmNameSecond = 'v2v-cirros-vm-for-tests';
export const RHV = 'Red Hat Virtualization (RHV)';

export const rhvVMConfigStartOnCreate: VMImportConfig = {
  name: 'v2v-rhel7-vm-migrated-start',
  description: 'Automated test for migration from RHV with start on create',
  sourceVMName: vmName,
  provider: RHV,
  instanceConfig: newInstanceConfig,
  advancedEdit: true,
  startOnCreation: true,
};

export const rhvVMConfigNoStartOnCreate: VMImportConfig = {
  name: 'v2v-rhel7-vm-migrated-no-start',
  description: 'Automated test for migration from RHV reusing existing instance',
  sourceVMName: vmName,
  provider: RHV,
  instanceConfig: newInstanceConfig,
  advancedEdit: true,
  startOnCreation: false,
};

export const sriovVMConfigNoStartOnCreate: VMImportConfig = {
  name: 'v2v-rhel7-vm-migrated-no-start',
  description: 'Automated test for migration from RHV reusing existing instance',
  sourceVMName: 'v2v-migration-sriov',
  provider: RHV,
  instanceConfig: newInstanceConfig,
  advancedEdit: true,
  startOnCreation: false,
};

export const rhvVMMultiNicConfig: VMImportConfig = {
  name: 'v2v-cirros-vm-for-test-2disks2nics',
  sourceVMName: 'v2v-cirros-vm-for-test-2disks2nics',
  provider: 'Red Hat Virtualization (RHV)',
  advancedEdit: false,
  instanceConfig: exInstanceConfig,
};

// Configuration for 2 VMs created one by one to re-use existing RHV instance
export const rhvVMConfigSecond: VMImportConfig = {
  name: 'rhel7-vm-second',
  description: 'Automated test for migration from RHV reusing existing instance',
  sourceVMName: vmNameSecond,
  provider: RHV,
  instanceConfig: exInstanceConfig,
  advancedEdit: true,
  startOnCreation: false,
};

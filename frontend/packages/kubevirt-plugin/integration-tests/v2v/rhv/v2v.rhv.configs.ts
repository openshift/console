import { InstanceConfig, VMImportConfig } from '../../tests/types/types';
import {
  IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  IMPORT_WIZARD_CONN_NAME_PREFIX,
} from '../../tests/utils/constants/common';

const {
  V2V_INSTANCE_API_URL,
  V2V_INSTANCE_USERNAME,
  V2V_INSTANCE_PASSWORD,
  V2V_INSTANCE_CA_CERT,
  V2V_INSTANCE_CLUSTER,
} = process.env;

const newInstanceConfig: InstanceConfig = {
  instance: IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  apiUrl: V2V_INSTANCE_API_URL,
  username: V2V_INSTANCE_USERNAME,
  password: V2V_INSTANCE_PASSWORD,
  certificate: V2V_INSTANCE_CA_CERT,
  cluster: V2V_INSTANCE_CLUSTER,
  saveInstance: false,
};

const exInstanceConfig: InstanceConfig = {
  instance: IMPORT_WIZARD_CONN_NAME_PREFIX,
  apiUrl: V2V_INSTANCE_API_URL,
  username: V2V_INSTANCE_USERNAME,
  password: V2V_INSTANCE_PASSWORD,
  certificate: V2V_INSTANCE_CA_CERT,
  cluster: V2V_INSTANCE_CLUSTER,
  saveInstance: false,
};

export const vmName = 'cirros-vm-for-tests';
export const RHV = 'Red Hat Virtualization (RHV)';

export const rhvVMConfigStartOnCreate: VMImportConfig = {
  name: 'cirros-vm-migrated-rhv',
  description: 'Automated test for migration from RHV',
  sourceVMName: vmName,
  provider: RHV,
  instanceConfig: newInstanceConfig,
  startOnCreation: true,
};

export const rhvVMConfigNoStartOnCreate: VMImportConfig = {
  name: 'cirros-vm-migrated-rhv',
  description: 'Automated test for migration from RHV',
  sourceVMName: vmName,
  provider: RHV,
  instanceConfig: newInstanceConfig,
  startOnCreation: false,
};

export const rhvVMMultiNicConfig: VMImportConfig = {
  name: '',
  sourceVMName: 'rhel7-vm',
  provider: 'Red Hat Virtualization (RHV)',
  instanceConfig: newInstanceConfig,
};

// Configuration for 2 VMs created one by one to re-use existing RHV instance
export const rhvVMConfig1: VMImportConfig = {
  name: '',
  sourceVMName: 'rhel7-vm',
  provider: 'Red Hat Virtualization (RHV)',
  instanceConfig: newInstanceConfig,
};

export const rhvVMConfig2: VMImportConfig = {
  name: '',
  sourceVMName: 'rhel7-vm',
  provider: 'Red Hat Virtualization (RHV)',
  instanceConfig: exInstanceConfig,
};

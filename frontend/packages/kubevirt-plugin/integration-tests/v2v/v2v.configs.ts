import { VMImportConfig } from '../tests/utils/types';
import { IMPORT_WIZARD_CONN_TO_NEW_INSTANCE } from '../tests/utils/consts';
import { OperatingSystem, WorkloadProfile } from '../tests/utils/constants/wizard';

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
  workloadProfile: WorkloadProfile.DESKTOP,
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
    saveInstance: false,
  },
  operatingSystem: OperatingSystem.RHEL7_6,
  workloadProfile: WorkloadProfile.DESKTOP,
};

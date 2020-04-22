import { testName } from '@console/internal-integration-tests/protractor.conf';
import { V2V_VM_IMPORT_TIMEOUT, VM_STATUS } from '../tests/utils/consts';
import { VirtualMachine } from '../tests/models/virtualMachine';
import { vmwareVMMultiNicConfig } from './v2v.configs';
import {
  withResource,
  createResources,
  deleteResources,
} from '@console/shared/src/test-utils/utils';
import { multusNAD } from '../tests/utils/mocks';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();

  beforeAll(async () => {
    createResources([multusNAD]);
  });

  afterAll(async () => {
    deleteResources([multusNAD]);
  });

  it(
    'Imports VM from VMware Instance',
    async () => {
      const vm = new VirtualMachine({ name: vmwareVMMultiNicConfig.name, namespace: testName });
      await withResource(leakedResources, 
                          vm.asResource(), 
                          async () => {
        await vm.import(vmwareVMMultiNicConfig);
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
        }, 
        true
      );
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

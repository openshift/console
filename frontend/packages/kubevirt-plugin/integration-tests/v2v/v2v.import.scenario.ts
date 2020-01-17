import { withResource } from '@console/shared/src/test-utils/utils';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { V2V_VM_IMPORT_TIMEOUT, VM_STATUS } from '../tests/utils/consts';
import { VirtualMachine } from '../tests/models/virtualMachine';
import { vmwareVMConfig } from './v2v.configs';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();

  it(
    'Imports VM from VMware Instance',
    async () => {
      const vm = new VirtualMachine({ name: vmwareVMConfig.name, namespace: testName });
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.import(vmwareVMConfig);
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

import { withResource } from '@console/shared/src/test-utils/utils';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { V2V_VM_IMPORT_TIMEOUT, VM_STATUS } from '../tests/utils/consts';
import { VirtualMachine } from '../tests/models/virtualMachine';
import { vmware2VMsConfig1, vmware2VMsConfig2 } from './v2v.configs';

describe('Kubevirt create 2 VMs using wizard, one by one', () => {
  const leakedResources = new Set<string>();
  const notCleanEnv = true;

  it(
    `Imports VM ${vmware2VMsConfig1.name} and ${vmware2VMsConfig2.name} from VMware Instance`,
    async () => {
      const vm = new VirtualMachine({ name: vmware2VMsConfig1.name, namespace: testName });
      await withResource(
        leakedResources,
        vm.asResource(),
        async () => {
          await vm.import(vmware2VMsConfig2);
          await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
        },
        notCleanEnv,
      );
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

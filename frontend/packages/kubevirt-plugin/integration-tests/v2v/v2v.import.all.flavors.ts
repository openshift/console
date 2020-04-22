import { withResource } from '@console/shared/src/test-utils/utils';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { V2V_VM_IMPORT_TIMEOUT, VM_STATUS } from '../tests/utils/consts';
import { VirtualMachine } from '../tests/models/virtualMachine';
import { flavorConfigs } from './v2v.configs';

describe('Kubevirt create VMs using wizard, all flavors and profiles', () => {
  const leakedResources = new Set<string>();
//   const notCleanEnv = true;

  flavorConfigs.forEach( (importConfig) => {
    it(
      `Imports VM ${importConfig.name} from VMware Instance`,
      async () => {
        const vm = new VirtualMachine({ name: importConfig.name, namespace: testName });
        await withResource(
            leakedResources, 
            vm.asResource(), 
            async () => {
                await vm.import(importConfig);
                await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
            }
        );
      },
      V2V_VM_IMPORT_TIMEOUT,  
    );
  })
});

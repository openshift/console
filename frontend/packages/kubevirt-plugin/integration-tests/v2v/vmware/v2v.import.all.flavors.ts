import { withResource } from '@console/shared/src/test-utils/utils';
import { V2V_VM_IMPORT_TIMEOUT, VM_STATUS } from '../../tests/utils/consts';
import { flavorWorkloadConfigs } from './v2v.configs';
import { VmwareImportWizard } from '../../tests/models/vmwareImportWizard';

describe('Kubevirt create VMs using wizard, all flavors and profiles', () => {
  const leakedResources = new Set<string>();
  const wizard = new VmwareImportWizard();

  flavorWorkloadConfigs.forEach((currentConfig) => {
    it(
      `Imports VM ${currentConfig.name} from VMware Instance`,
      async () => {
        const vm = await wizard.import(currentConfig);
        await withResource(leakedResources, vm.asResource(), async () => {
          await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
        });
      },
      V2V_VM_IMPORT_TIMEOUT,
    );
  });
});

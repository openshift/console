import { withResource } from '@console/shared/src/test-utils/utils';
import { V2V_VM_IMPORT_TIMEOUT, VM_STATUS } from '../../tests/utils/consts';
import { rhvVMConfig } from './v2v.rhv.configs';
import { RhvImportWizard } from '../../tests/models/rhvImportWizard';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new RhvImportWizard();

  it(
    'Imports VM from RHV Instance',
    async () => {
      const vm = await wizard.import(rhvVMConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

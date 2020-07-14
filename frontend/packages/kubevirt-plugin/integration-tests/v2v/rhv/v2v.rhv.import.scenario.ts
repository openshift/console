import { withResource } from '@console/shared/src/test-utils/utils';
import { rhvVMConfig } from './v2v.rhv.configs';
import { RhvImportWizard } from '../../tests/models/rhvImportWizard';
import { V2V_VM_IMPORT_TIMEOUT } from '../../tests/utils/constants/common';
import { VM_STATUS } from '../../tests/utils/constants/vm';

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

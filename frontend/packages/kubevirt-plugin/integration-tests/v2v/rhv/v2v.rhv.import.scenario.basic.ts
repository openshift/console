import { withResource } from '@console/shared/src/test-utils/utils';
import { rhvVMConfigNoStartOnCreate, rhvVMConfigStartOnCreate } from './v2v.rhv.configs';
import { RhvImportWizard } from '../../tests/models/rhvImportWizard';
import { V2V_VM_IMPORT_TIMEOUT } from '../../tests/utils/constants/common';
import { VM_STATUS } from '../../tests/utils/constants/vm';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new RhvImportWizard();

  it(
    'Imports VM from RHV Instance without starting after migration',
    async () => {
      const vm = await wizard.import(rhvVMConfigNoStartOnCreate);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );

  it(
    'Imports VM from RHV Instance with start after migration',
    async () => {
      const vm = await wizard.import(rhvVMConfigStartOnCreate);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Running, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

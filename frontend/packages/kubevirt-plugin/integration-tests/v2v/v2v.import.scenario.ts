import { withResource } from '@console/shared/src/test-utils/utils';
import { V2V_VM_IMPORT_TIMEOUT, VM_STATUS } from '../tests/utils/consts';
import { vmwareVMConfig } from './v2v.configs';
import { ImportWizard } from '../tests/models/importWizard';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new ImportWizard();

  it(
    'Imports VM from VMware Instance',
    async () => {
      const vm = await wizard.import(vmwareVMConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

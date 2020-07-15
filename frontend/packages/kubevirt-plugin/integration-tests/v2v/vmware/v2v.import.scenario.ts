import { withResource } from '@console/shared/src/test-utils/utils';
import { vmwareVMConfig } from './v2v.configs';
import { VmwareImportWizard } from '../../tests/models/vmwareImportWizard';
import { V2V_VM_IMPORT_TIMEOUT } from '../../tests/utils/constants/common';
import { VM_STATUS } from '../../tests/utils/constants/vm';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new VmwareImportWizard();

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

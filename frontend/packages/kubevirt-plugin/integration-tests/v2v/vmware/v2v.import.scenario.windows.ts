import { withResource } from '@console/shared/src/test-utils/utils';
import { vmwareWindowsVMConfig } from './v2v.configs';
import { VmwareImportWizard } from '../../tests/models/vmwareImportWizard';
import { VM_STATUS } from '../../tests/utils/constants/vm';
import { V2V_VM_IMPORT_TIMEOUT } from '../../tests/utils/constants/common';

describe('Kubevirt import Windows 10 VM using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new VmwareImportWizard();

  it(
    'Imports Windows 10 VM from VMware Instance',
    async () => {
      const vm = await wizard.import(vmwareWindowsVMConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

import { withResource } from '@console/shared/src/test-utils/utils';
import { vmware2VMsConfig1, vmware2VMsConfig2 } from './v2v.configs';
import { VmwareImportWizard } from '../../tests/models/vmwareImportWizard';
import { VM_STATUS } from '../../tests/utils/constants/vm';
import { V2V_VM_IMPORT_TIMEOUT } from '../../tests/utils/constants/common';

describe('Kubevirt create 2 VMs using wizard, one by one', () => {
  const leakedResources = new Set<string>();
  const wizard = new VmwareImportWizard();
  const notCleanEnv = true;

  it(
    `Imports VM ${vmware2VMsConfig1.name} and ${vmware2VMsConfig2.name} from VMware Instance`,
    async () => {
      const vm = await wizard.import(vmware2VMsConfig2);
      await withResource(
        leakedResources,
        vm.asResource(),
        async () => {
          await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
        },
        notCleanEnv,
      );
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

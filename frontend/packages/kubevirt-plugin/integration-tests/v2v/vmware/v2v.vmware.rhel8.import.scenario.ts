import { rhel8VMConfig } from './v2v.configs';
import {
  withResource,
  deleteResources,
  removeLeakedResources,
} from '@console/shared/src/test-utils/utils';
import { VmwareImportWizard } from '../../tests/models/vmwareImportWizard';
import { v2vUIDeployment } from '../../tests/mocks/mocks';
import { VM_STATUS } from '../../tests/utils/constants/vm';
import { V2V_VM_IMPORT_TIMEOUT } from '../../tests/utils/constants/common';

describe('Kubevirt migrate VM from VMWare using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new VmwareImportWizard();

  afterAll(async () => {
    deleteResources([v2vUIDeployment]);
    removeLeakedResources(leakedResources);
  });

  it(
    'Imports RHEL 8 VM from VMware Instance, basic test',
    async () => {
      const vm = await wizard.import(rhel8VMConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

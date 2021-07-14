import {
  createResources,
  deleteResources,
  removeLeakedResources,
  withResource,
} from '@console/shared/src/test-utils/utils';
import { sriovVMConfigNoStartOnCreate } from './v2v.rhv.configs';
import { RhvImportWizard } from '../../tests/models/rhvImportWizard';
import { V2V_VM_IMPORT_TIMEOUT } from '../../tests/utils/constants/common';
import { VM_STATUS } from '../../tests/utils/constants/vm';
import { sriovNAD, v2vUIDeployment } from '../../tests/mocks/mocks';

describe('Kubevirt imports VM from RHV using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new RhvImportWizard();

  beforeAll(async () => {
    createResources([sriovNAD]);
  });

  afterAll(async () => {
    deleteResources([sriovNAD, v2vUIDeployment]);
    removeLeakedResources(leakedResources);
  });

  it(
    'Importing SRIOV VM from RHV Instance without starting after migration',
    async () => {
      const vm = await wizard.import(sriovVMConfigNoStartOnCreate);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

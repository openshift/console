import { V2V_VM_IMPORT_TIMEOUT, VM_STATUS } from '../../tests/utils/consts';
import { vmwareVMMultiNicConfig } from './v2v.configs';
import {
  withResource,
  createResources,
  deleteResources,
} from '@console/shared/src/test-utils/utils';
import { multusNAD } from '../../tests/utils/mocks';
import { VmwareImportWizard } from '../../tests/models/vmwareImportWizard';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new VmwareImportWizard();

  beforeAll(async () => {
    createResources([multusNAD]);
  });

  afterAll(async () => {
    deleteResources([multusNAD]);
  });

  it(
    'Imports VM from VMware Instance',
    async () => {
      const vm = await wizard.import(vmwareVMMultiNicConfig);
      await withResource(
        leakedResources,
        vm.asResource(),
        async () => {
          await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
        },
        true,
      );
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

import { multusNAD, v2vUIDeployment } from '../../tests/mocks/mocks';
import { RhvImportWizard } from '../../tests/models/rhvImportWizard';
import { V2V_VM_IMPORT_TIMEOUT } from '../../tests/utils/constants/common';
import { VM_STATUS } from '../../tests/utils/constants/vm';
import {
  createResources,
  deleteResources,
  removeLeakedResources,
  withResource,
} from '../../utils/shared-utils';
import {
  rhvVMConfigSecond,
  rhvVMConfigStartOnCreate,
  rhvVMMultiNicConfig,
} from './v2v.rhv.configs';

describe('Kubevirt imports VM from RHV using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new RhvImportWizard();

  beforeAll(async () => {
    createResources([multusNAD]);
  });

  afterAll(async () => {
    deleteResources([multusNAD, v2vUIDeployment]);
    removeLeakedResources(leakedResources);
  });

  it(
    'Importing VM from RHV Instance with starting after migration',
    async () => {
      const vm = await wizard.import(rhvVMConfigStartOnCreate);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Running, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );

  it(
    'Importing VM from RHV Instance with reuse of existing one',
    async () => {
      const vm = await wizard.import(rhvVMConfigSecond);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );

  it(
    'Importing VM from RHV Instance with multi NIC and multi disk config',
    async () => {
      const vm = await wizard.import(rhvVMMultiNicConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
      deleteResources([multusNAD]);
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});

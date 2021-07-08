import {
  createResources,
  deleteResources,
  removeLeakedResources,
  withResource,
} from '@console/shared/src/test-utils/utils';
import { multusNAD, v2vUIDeployment } from '../../tests/mocks/mocks';
import { VmwareImportWizard } from '../../tests/models/vmwareImportWizard';
import { V2V_VM_IMPORT_TIMEOUT } from '../../tests/utils/constants/common';
import { VM_STATUS } from '../../tests/utils/constants/vm';
import {
  flavorWorkloadConfigs,
  vmwareSecondVMConfig,
  vmwareVMConfig,
  vmwareVMMultiNicConfig,
} from './v2v.configs';

describe('Kubevirt migrate VM from VMWare using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new VmwareImportWizard();

  beforeAll(async () => {
    createResources([multusNAD]);
  });

  afterAll(async () => {
    deleteResources([multusNAD, v2vUIDeployment]);
    removeLeakedResources(leakedResources);
  });

  it(
    'Imports VM from VMware Instance, basic test',
    async () => {
      const vm = await wizard.import(vmwareVMConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );

  it(
    'Imports VM from VMware Instance, re-use of existing VMware instance, VM should not be started',
    async () => {
      const vm = await wizard.import(vmwareSecondVMConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );

  it(
    'Imports VM from VMware Instance - 2 x NICs, 2 x disks',
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

  flavorWorkloadConfigs.forEach((currentConfig) => {
    it(
      `Imports VM ${currentConfig.name} from VMware`,
      async () => {
        const vm = await wizard.import(currentConfig);
        await withResource(leakedResources, vm.asResource(), async () => {
          await vm.waitForStatus(VM_STATUS.Off, V2V_VM_IMPORT_TIMEOUT);
        });
      },
      V2V_VM_IMPORT_TIMEOUT,
    );
  });
});

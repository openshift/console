import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  removeLeakedResources,
  withResource,
  createResources,
  deleteResources,
} from '@console/shared/src/test-utils/utils';
import { VirtualMachine } from './models/virtualMachine';
import { getResourceObject, resolveStorageDataAttribute } from './utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  CLONE_VM_TIMEOUT_SECS,
  VM_ACTION,
  CLONED_VM_BOOTUP_TIMEOUT_SECS,
  VM_STATUS,
  CONFIG_NAME_DISK,
  CONFIG_NAME_URL,
} from './utils/consts';
import { multusNAD } from './utils/mocks';
import {
  vmConfig,
  getProvisionConfigs,
  getTestDataVolume,
  kubevirtStorage,
} from './vm.wizard.configs';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const provisionConfigs = getProvisionConfigs(testName);
  const testDataVolume = getTestDataVolume(testName);

  beforeAll(async () => {
    createResources([multusNAD, testDataVolume]);
  });

  afterAll(async () => {
    deleteResources([multusNAD, testDataVolume]);
  });

  afterEach(() => {
    removeLeakedResources(leakedResources);
  });

  provisionConfigs.forEach((provisionConfig, configName) => {
    const specTimeout =
      configName === CONFIG_NAME_DISK ? CLONE_VM_TIMEOUT_SECS : VM_BOOTUP_TIMEOUT_SECS;
    it(
      `Create VM using ${configName}.`,
      async () => {
        const vm = new VirtualMachine(
          vmConfig(configName.toLowerCase(), provisionConfig, testName),
        );
        await withResource(leakedResources, vm.asResource(), async () => {
          await vm.create(vmConfig(configName.toLowerCase(), provisionConfig, testName));
        });
      },
      specTimeout,
    );
  });

  it(
    'Creates DV with correct accessMode/volumeMode',
    async () => {
      const testVMConfig = vmConfig('test-dv', provisionConfigs.get(CONFIG_NAME_URL), testName);
      testVMConfig.networkResources = [];
      const vm = new VirtualMachine(testVMConfig);

      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create(testVMConfig);
        const vmDataVolume = getResourceObject(`${vm.name}-rootdisk`, vm.namespace, 'dv');
        const expectedAccessMode = resolveStorageDataAttribute(kubevirtStorage, 'accessMode');
        const expectedVolumeMode = resolveStorageDataAttribute(kubevirtStorage, 'volumeMode');

        expect(expectedAccessMode).toBeDefined();
        expect(expectedVolumeMode).toBeDefined();
        expect(vmDataVolume.spec.pvc.accessModes[0]).toEqual(expectedAccessMode);
        expect(vmDataVolume.spec.pvc.volumeMode).toEqual(expectedVolumeMode);
      });
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it(
    'Multiple VMs created using "Cloned Disk" method from single source',
    async () => {
      const clonedDiskProvisionConfig = provisionConfigs.get(CONFIG_NAME_DISK);
      const vm1Config = vmConfig('vm1', clonedDiskProvisionConfig, testName);
      const vm2Config = vmConfig('vm2', clonedDiskProvisionConfig, testName);
      vm1Config.startOnCreation = false;
      vm1Config.networkResources = [];
      const vm1 = new VirtualMachine(vm1Config);
      const vm2 = new VirtualMachine(vm2Config);

      await withResource(leakedResources, vm1.asResource(), async () => {
        await vm1.create(vm1Config);
        // Don't wait for the first VM to be running
        await vm1.action(VM_ACTION.Start, false);
        await withResource(leakedResources, vm2.asResource(), async () => {
          await vm2.create(vm2Config);
          // Come back to the first VM and verify it is Running as well
          await vm1.waitForStatus(VM_STATUS.Running, CLONED_VM_BOOTUP_TIMEOUT_SECS);
          // Verify that DV of VM created with Cloned disk method points to correct PVC
          const dvResource = getResourceObject(
            `${vm1.name}-${testDataVolume.metadata.name}`,
            vm1.namespace,
            'dv',
          );
          const pvcSource = _.get(dvResource, 'spec.source.pvc', {});
          expect(pvcSource).toEqual({
            name: testDataVolume.metadata.name,
            namespace: testDataVolume.metadata.namespace,
          });
        });
      });
    },
    CLONE_VM_TIMEOUT_SECS,
  );
});

import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  removeLeakedResources,
  withResource,
  createResources,
  deleteResources,
} from '@console/shared/src/test-utils/utils';
import { getAnnotations, getLabels } from '../../src/selectors/selectors';
import { VirtualMachine } from './models/virtualMachine';
import { getResourceObject, resolveStorageDataAttribute } from './utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  CLONE_VM_TIMEOUT_SECS,
  VM_ACTION,
  CLONED_VM_BOOTUP_TIMEOUT_SECS,
  VM_STATUS,
  commonTemplateVersion,
  COMMON_TEMPLATES_REVISION,
  INNER_TEMPLATE_VERSION,
} from './utils/consts';
import { multusNAD, cdGuestTools, basicVMConfig } from './utils/mocks';
import {
  vmConfig,
  getProvisionConfigs,
  getTestDataVolume,
  kubevirtStorage,
} from './vm.wizard.configs';
import {
  Flavor,
  OperatingSystem,
  OSIDLookup,
  ProvisionConfigName,
  WorkloadProfile,
} from './utils/constants/wizard';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const provisionConfigs = getProvisionConfigs();
  const testDataVolume = getTestDataVolume();

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
      configName === ProvisionConfigName.DISK ? CLONE_VM_TIMEOUT_SECS : VM_BOOTUP_TIMEOUT_SECS;
    it(
      `Create VM using ${configName}.`,
      async () => {
        const vm = new VirtualMachine(
          vmConfig(configName.toLowerCase(), testName, provisionConfig),
        );
        await withResource(leakedResources, vm.asResource(), async () => {
          await vm.create(vmConfig(configName.toLowerCase(), testName, provisionConfig));
        });
      },
      specTimeout,
    );
  });

  it('Creates VM with CD ROM added in Wizard', async () => {
    const vmName = 'vm-with-cdrom';
    const provisionConfig = provisionConfigs.get(ProvisionConfigName.CONTAINER);
    provisionConfig.CDRoms = [cdGuestTools];
    const vmCfg = vmConfig(vmName, testName, provisionConfig, basicVMConfig, false);
    const vm = new VirtualMachine(vmCfg);

    await withResource(leakedResources, vm.asResource(), async () => {
      await vm.create(vmCfg);
    });
  });

  it(
    'Creates windows 10 VM with correct metadata',
    async () => {
      const testVMConfig = vmConfig(
        'windows10',
        testName,
        provisionConfigs.get(ProvisionConfigName.CONTAINER),
        _.cloneDeep(basicVMConfig),
      );
      testVMConfig.networkResources = [];
      testVMConfig.operatingSystem = OperatingSystem.WINDOWS_10;
      testVMConfig.flavorConfig.flavor = Flavor.MEDIUM;
      testVMConfig.workloadProfile = WorkloadProfile.SERVER;
      testVMConfig.startOnCreation = false; // do not check as there is only medium/large profile present and we would get insufficient memory.
      const osID = OSIDLookup[testVMConfig.operatingSystem];

      const vm = new VirtualMachine(testVMConfig);

      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create(testVMConfig);
        const vmResult = getResourceObject(vm.name, vm.namespace, vm.kind);
        const annotations = getAnnotations(vmResult);
        const labels = getLabels(vmResult);

        expect(annotations).toBeDefined();
        expect(labels).toBeDefined();

        const requiredAnnotations = {
          [`name.os.template.kubevirt.io/${osID}`]: OperatingSystem.WINDOWS_10,
        };

        const requiredLabels = {
          [`workload.template.kubevirt.io/${testVMConfig.workloadProfile}`]: 'true',
          [`flavor.template.kubevirt.io/${testVMConfig.flavorConfig.flavor}`]: 'true',
          [`os.template.kubevirt.io/${osID}`]: 'true',
          'vm.kubevirt.io/template': `windows-${testVMConfig.workloadProfile}-${
            testVMConfig.flavorConfig.flavor
          }-${commonTemplateVersion()}`,
          'vm.kubevirt.io/template.revision': COMMON_TEMPLATES_REVISION,
          'vm.kubevirt.io/template.version': INNER_TEMPLATE_VERSION,
        };

        expect(_.pick(annotations, Object.keys(requiredAnnotations))).toEqual(requiredAnnotations);
        expect(_.pick(labels, Object.keys(requiredLabels))).toEqual(requiredLabels);
      });
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it(
    'Creates DV with correct accessMode/volumeMode',
    async () => {
      const testVMConfig = vmConfig(
        'test-dv',
        testName,
        provisionConfigs.get(ProvisionConfigName.URL),
      );
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
      const clonedDiskProvisionConfig = provisionConfigs.get(ProvisionConfigName.DISK);
      const vm1Config = vmConfig('vm1', testName, clonedDiskProvisionConfig);
      const vm2Config = vmConfig('vm2', testName, clonedDiskProvisionConfig);
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

import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  removeLeakedResources,
  withResource,
  createResources,
  deleteResources,
} from '@console/shared/src/test-utils/utils';
import { getAnnotations, getLabels } from '../../src/selectors/selectors';
import {
  getResourceObject,
  resolveStorageDataAttribute,
  selectNonDefaultAccessMode,
  selectNonDefaultVolumeMode,
} from './utils/utils';
import { Wizard } from './models/wizard';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  CLONE_VM_TIMEOUT_SECS,
  VM_ACTION,
  CLONED_VM_BOOTUP_TIMEOUT_SECS,
  VM_STATUS,
  commonTemplateVersion,
  COMMON_TEMPLATES_REVISION,
  DISK_INTERFACE,
  STORAGE_CLASS,
} from './utils/consts';
import { multusNAD, cdGuestTools, basicVMConfig } from './utils/mocks';
import {
  vmConfig,
  getProvisionConfigs,
  getTestDataVolume,
  VMTestCaseIDs,
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
  const defaultAccessMode = resolveStorageDataAttribute(kubevirtStorage, 'accessMode');
  const defaultVolumeMode = resolveStorageDataAttribute(kubevirtStorage, 'volumeMode');
  const wizard = new Wizard();

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
      `${VMTestCaseIDs[configName]} Create VM using ${configName}.`,
      async () => {
        const vm = await wizard.createVirtualMachine(
          vmConfig(configName.toLowerCase(), testName, provisionConfig),
        );
        await withResource(leakedResources, vm.asResource(), async () => {
          await vm.navigateToDetail();
        });
      },
      specTimeout,
    );
  });

  it('ID(CNV-3657) Creates VM with CD ROM added in Wizard', async () => {
    const vmName = 'vm-with-cdrom';
    const provisionConfig = provisionConfigs.get(ProvisionConfigName.CONTAINER);
    provisionConfig.CDRoms = [cdGuestTools];
    const vm = await wizard.createVirtualMachine(
      vmConfig(vmName, testName, provisionConfig, basicVMConfig, false),
    );
    await withResource(leakedResources, vm.asResource(), async () => {
      await vm.navigateToDetail();
    });
  });

  it(
    'ID(CNV-2039) Creates windows 10 VM with correct metadata',
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
      testVMConfig.workloadProfile = WorkloadProfile.DESKTOP;
      testVMConfig.startOnCreation = false; // do not check as there is only medium/large profile present and we would get insufficient memory.
      const osID = OSIDLookup[testVMConfig.operatingSystem];

      const vm = await wizard.createVirtualMachine(testVMConfig);
      const vmResource = vm.getResource();
      await withResource(leakedResources, vmResource, async () => {
        const annotations = getAnnotations(vmResource);
        const labels = getLabels(vmResource);

        expect(annotations).toBeDefined();
        expect(labels).toBeDefined();

        const requiredAnnotations = {
          [`name.os.template.kubevirt.io/${osID}`]: OperatingSystem.WINDOWS_10,
        };

        const requiredLabels = {
          [`workload.template.kubevirt.io/${testVMConfig.workloadProfile}`]: 'true',
          [`os.template.kubevirt.io/${osID}`]: 'true',
          'vm.kubevirt.io/template': `windows10-${testVMConfig.workloadProfile.toLowerCase()}-${testVMConfig.flavorConfig.flavor.toLowerCase()}-${commonTemplateVersion()}`,
          'vm.kubevirt.io/template.revision': COMMON_TEMPLATES_REVISION,
        };

        expect(_.pick(annotations, Object.keys(requiredAnnotations))).toEqual(requiredAnnotations);
        expect(_.pick(labels, Object.keys(requiredLabels))).toEqual(requiredLabels);
      });
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-3052) Creates DV with correct accessMode/volumeMode',
    async () => {
      expect(defaultAccessMode).toBeDefined();
      expect(defaultVolumeMode).toBeDefined();

      const testVMConfig = vmConfig(
        'test-dv',
        testName,
        provisionConfigs.get(ProvisionConfigName.URL),
      );
      testVMConfig.networkResources = [];
      const vm = await wizard.createVirtualMachine(testVMConfig);

      await withResource(leakedResources, vm.asResource(), async () => {
        const vmDataVolume = getResourceObject(`${vm.name}-rootdisk`, vm.namespace, 'dv');

        expect(vmDataVolume.spec.pvc.accessModes[0]).toEqual(defaultAccessMode);
        expect(vmDataVolume.spec.pvc.volumeMode).toEqual(defaultVolumeMode);
      });
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4096) Creates DV with user-selected accessMode/volumeMode',
    async () => {
      expect(defaultAccessMode).toBeDefined();
      expect(defaultVolumeMode).toBeDefined();
      const expectedAccessMode = selectNonDefaultAccessMode(defaultAccessMode).value;
      const expectedVolumeMode = selectNonDefaultVolumeMode(defaultVolumeMode);

      const customAccessVolumeRootDisk = {
        name: 'rootdisk',
        size: '1',
        interface: DISK_INTERFACE.VirtIO,
        storageClass: `${STORAGE_CLASS}`,
        advanced: {
          accessMode: expectedAccessMode,
          volumeMode: expectedVolumeMode,
        },
      };
      const testVMConfig = vmConfig('test-dv', testName, {
        provision: {
          method: ProvisionConfigName.URL,
          source: basicVMConfig.sourceURL,
        },
        storageResources: [customAccessVolumeRootDisk],
        networkResources: [],
      });
      // Do not attempt to start or wait for import as it's likely the created PVC won't bind
      testVMConfig.startOnCreation = false;
      testVMConfig.waitForDiskImport = false;

      const vm = await wizard.createVirtualMachine(testVMConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        const vmDataVolume = getResourceObject(`${vm.name}-rootdisk`, vm.namespace, 'dv');

        expect(vmDataVolume.spec.pvc.accessModes[0]).toEqual(expectedAccessMode);
        expect(vmDataVolume.spec.pvc.volumeMode).toEqual(expectedVolumeMode);
      });
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-2447) Multiple VMs created using "Cloned Disk" method from single source',
    async () => {
      const clonedDiskProvisionConfig = provisionConfigs.get(ProvisionConfigName.DISK);
      const vm1Config = vmConfig('vm1', testName, clonedDiskProvisionConfig);
      const vm2Config = vmConfig('vm2', testName, clonedDiskProvisionConfig);
      vm1Config.startOnCreation = false;
      vm1Config.networkResources = [];

      const vm1 = await wizard.createVirtualMachine(vm1Config);
      await withResource(leakedResources, vm1.asResource(), async () => {
        // Don't wait for the first VM to be running
        await vm1.action(VM_ACTION.Start, false);
        const vm2 = await wizard.createVirtualMachine(vm2Config);
        await withResource(leakedResources, vm2.asResource(), async () => {
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

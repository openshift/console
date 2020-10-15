import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { getAnnotations, getLabels } from '../../src/selectors/selectors';
import {
  removeLeakedResources,
  withResource,
  createResources,
  deleteResources,
} from '@console/shared/src/test-utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  CLONE_VM_TIMEOUT_SECS,
  commonTemplateVersion,
  STORAGE_CLASS,
  CLONED_VM_BOOTUP_TIMEOUT_SECS,
} from './utils/constants/common';
import {
  multusNAD,
  cdGuestTools,
  flavorConfigs,
  hddDisk,
  rootDisk,
  getTestDataVolume,
  kubevirtStorage,
  getDiskToCloneFrom,
} from './mocks/mocks';
import { Workload, OperatingSystem } from './utils/constants/wizard';
import { vmPresets, getBasicVMBuilder } from './mocks/vmBuilderPresets';
import { VMBuilder } from './models/vmBuilder';
import {
  resolveStorageDataAttribute,
  getDataVolumeByPrefix,
  selectNonDefaultAccessMode,
  selectNonDefaultVolumeMode,
} from './utils/utils';
import { DISK_DRIVE, DISK_INTERFACE, VM_STATUS } from './utils/constants/vm';
import { ProvisionSource } from './utils/constants/enums/provisionSource';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const testDataVolume = getTestDataVolume();
  const defaultAccessMode = resolveStorageDataAttribute(kubevirtStorage, 'accessMode');
  const defaultVolumeMode = resolveStorageDataAttribute(kubevirtStorage, 'volumeMode');

  const VMTestCaseIDs = {
    'ID(CNV-870)': vmPresets[ProvisionSource.CONTAINER.getValue()],
    'ID(CNV-2446)': vmPresets[ProvisionSource.DISK.getValue()],
    'ID(CNV-869)': vmPresets[ProvisionSource.URL.getValue()],
    'ID(CNV-771)': vmPresets[ProvisionSource.PXE.getValue()],
  };

  beforeAll(async () => {
    createResources([multusNAD, testDataVolume]);
  });

  afterAll(async () => {
    deleteResources([multusNAD, testDataVolume]);
  });

  afterEach(() => {
    removeLeakedResources(leakedResources);
  });

  for (const [id, vm] of Object.entries(VMTestCaseIDs)) {
    const { provisionSource } = vm.getData();
    const specTimeout =
      provisionSource === ProvisionSource.DISK ? CLONE_VM_TIMEOUT_SECS : VM_BOOTUP_TIMEOUT_SECS;
    it(
      `${id} Create VM using ${provisionSource}.`,
      async () => {
        await withResource(leakedResources, vm.asResource(), async () => {
          await vm.create();
          await vm.navigateToDetail();
        });
      },
      specTimeout,
    );
  }

  it('ID(CNV-3657) Creates VM with CD ROM added in Wizard', async () => {
    const vm = new VMBuilder(getBasicVMBuilder())
      .setProvisionSource(ProvisionSource.CONTAINER)
      .setDisks([cdGuestTools])
      .build();

    await withResource(leakedResources, vm.asResource(), async () => {
      await vm.create();
      await vm.navigateToDetail();
    });
  });

  it(
    'ID(CNV-2039) Creates windows 10 VM with correct metadata',
    async () => {
      const builder = new VMBuilder()
        .setNamespace(testName)
        .setProvisionSource(ProvisionSource.CONTAINER)
        .setOS(OperatingSystem.WINDOWS_10)
        .setFlavor(flavorConfigs.Medium)
        .setWorkload(Workload.DESKTOP)
        .setDisks([hddDisk]);
      const vm = builder.build();
      const osID = builder.getOSID();

      await vm.create();
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
          [`workload.template.kubevirt.io/${vm.getData().workload}`]: 'true',
          [`os.template.kubevirt.io/${osID}`]: 'true',
          'vm.kubevirt.io/template': `windows10-${vm
            .getData()
            .workload.toLowerCase()}-${vm
            .getData()
            .flavor.flavor.toLowerCase()}-${commonTemplateVersion()}`,
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

      const vm = new VMBuilder(getBasicVMBuilder())
        .setProvisionSource(ProvisionSource.URL)
        .setDisks([rootDisk])
        .build();
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create();
        const dv = getDataVolumeByPrefix(`${vm.name}-${rootDisk.name}`);
        expect(dv.spec.pvc.accessModes[0]).toEqual(defaultAccessMode);
        expect(dv.spec.pvc.volumeMode).toEqual(defaultVolumeMode);
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
        drive: DISK_DRIVE.Disk,
        interface: DISK_INTERFACE.VirtIO,
        storageClass: `${STORAGE_CLASS}`,
        advanced: {
          accessMode: expectedAccessMode,
          volumeMode: expectedVolumeMode,
        },
      };

      // Do not attempt to start or wait for disks to import as it's likely the created PVC won't bind
      const vm = new VMBuilder(getBasicVMBuilder())
        .setProvisionSource(ProvisionSource.URL)
        .setDisks([customAccessVolumeRootDisk])
        .build();
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create();
        const dv = getDataVolumeByPrefix(`${vm.name}-${customAccessVolumeRootDisk.name}`);
        expect(dv.spec.pvc.accessModes[0]).toEqual(expectedAccessMode);
        expect(dv.spec.pvc.volumeMode).toEqual(expectedVolumeMode);
      });
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-2447) Multiple VMs created using "Cloned Disk" method from single source',
    async () => {
      const vm1 = new VMBuilder(getBasicVMBuilder())
        .setProvisionSource(ProvisionSource.DISK)
        .setDisks([getDiskToCloneFrom()])
        .generateNameForPrefix('vm1')
        .build();

      const vm2 = new VMBuilder(getBasicVMBuilder())
        .setProvisionSource(ProvisionSource.DISK)
        .setDisks([getDiskToCloneFrom()])
        .setStartOnCreation(true)
        .setWaitForImport(true)
        .generateNameForPrefix('vm2')
        .build();

      await vm1.create();
      await withResource(leakedResources, vm1.asResource(), async () => {
        // Don't wait for the first VM to be running
        await vm1.start(false);
        await vm2.create();
        await withResource(leakedResources, vm2.asResource(), async () => {
          // Come back to the first VM and verify it is Running as well
          await vm1.waitForStatus(VM_STATUS.Running, CLONED_VM_BOOTUP_TIMEOUT_SECS);
          // Verify that DV of VM created with Cloned disk method points to correct PVC
          const dv = getDataVolumeByPrefix(`${vm1.name}-${testDataVolume.metadata.name}`);
          const pvcSource = _.get(dv, 'spec.source.pvc', {});
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

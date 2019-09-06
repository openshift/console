import { OrderedMap } from 'immutable';
import * as _ from 'lodash';
import { testName } from '../../../../integration-tests/protractor.conf';
import {
  removeLeakedResources,
  withResource,
  createResources,
  deleteResources,
} from '../../../console-shared/src/test-utils/utils';
import { statusIcons, waitForStatusIcon } from '../views/virtualMachine.view';
import { VirtualMachine } from './models/virtualMachine';
import { getResourceObject } from './utils/utils';
import { VM_BOOTUP_TIMEOUT_SECS, CLONE_VM_TIMEOUT_SECS, TABS } from './utils/consts';
import { StorageResource, NetworkResource, ProvisionOption } from './utils/types';
import {
  basicVmConfig,
  rootDisk,
  networkInterface,
  multusNad,
  hddDisk,
  dataVolumeManifest,
} from './utils/mocks';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const testDataVolume = dataVolumeManifest({
    name: `toclone-${testName}`,
    namespace: testName,
    sourceURL: basicVmConfig.sourceURL,
  });
  const diskToCloneFrom: StorageResource = {
    name: testDataVolume.metadata.name,
    size: '1',
    storageClass: testDataVolume.spec.pvc.storageClassName,
    attached: true,
  };
  const commonSettings = {
    startOnCreation: true,
    cloudInit: {
      useCloudInit: false,
    },
    namespace: testName,
    description: `Default description ${testName}`,
    flavor: basicVmConfig.flavor,
    operatingSystem: basicVmConfig.operatingSystem,
    workloadProfile: basicVmConfig.workloadProfile,
  };
  const vmConfig = (name, provisionConfig) => {
    return {
      ...commonSettings,
      name: `${name}-${testName}`,
      provisionSource: provisionConfig.provision,
      storageResources: provisionConfig.storageResources,
      networkResources: provisionConfig.networkResources,
    };
  };
  const provisionConfigs = OrderedMap<
    string,
    {
      provision: ProvisionOption;
      networkResources: NetworkResource[];
      storageResources: StorageResource[];
    }
  >()
    .set('URL', {
      provision: {
        method: 'URL',
        source: basicVmConfig.sourceURL,
      },
      networkResources: [networkInterface],
      storageResources: [rootDisk],
    })
    .set('Container', {
      provision: {
        method: 'Container',
        source: basicVmConfig.sourceContainer,
      },
      networkResources: [networkInterface],
      storageResources: [hddDisk],
    })
    .set('PXE', {
      provision: {
        method: 'PXE',
      },
      networkResources: [networkInterface],
      storageResources: [rootDisk],
    })
    .set('ClonedDisk', {
      provision: {
        method: 'Cloned Disk',
      },
      networkResources: [networkInterface],
      storageResources: [diskToCloneFrom],
    });

  beforeAll(async () => {
    createResources([multusNad, testDataVolume]);
  });

  afterAll(async () => {
    deleteResources([multusNad, testDataVolume]);
  });

  afterEach(() => {
    removeLeakedResources(leakedResources);
  });

  provisionConfigs.forEach((provisionConfig, configName) => {
    it(
      `Create VM using ${configName}.`,
      async () => {
        const vm = new VirtualMachine(vmConfig(configName.toLowerCase(), provisionConfig));
        await withResource(leakedResources, vm.asResource(), async () => {
          await vm.create(vmConfig(configName.toLowerCase(), provisionConfig));
        });
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );
  });

  it(
    'Multiple VMs created using "Cloned Disk" method from single source',
    async () => {
      const clonedDiskProvisionConfig = provisionConfigs.get('ClonedDisk');
      const vm1Config = vmConfig('vm1', clonedDiskProvisionConfig);
      const vm2Config = vmConfig('vm2', clonedDiskProvisionConfig);
      vm1Config.startOnCreation = false;
      vm1Config.networkResources = [];
      const vm1 = new VirtualMachine(vm1Config);
      const vm2 = new VirtualMachine(vm2Config);

      await withResource(leakedResources, vm1.asResource(), async () => {
        await vm1.create(vm1Config);
        // Don't wait for the first VM to be running
        await vm1.action('Start', false);
        await withResource(leakedResources, vm2.asResource(), async () => {
          await vm2.create(vm2Config);
          await vm1.navigateToTab(TABS.OVERVIEW);
          await waitForStatusIcon(statusIcons.running, VM_BOOTUP_TIMEOUT_SECS);

          // Verify that DV of VM created with Cloned disk method points to correct PVC
          const dvResource = getResourceObject(
            `${vm1.name}-${testDataVolume.metadata.name}-clone`,
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

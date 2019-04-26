/* eslint-disable no-undef, max-nested-callbacks */
import { execSync } from 'child_process';
import { OrderedMap } from 'immutable';
import { browser } from 'protractor';

// eslint-disable-next-line no-unused-vars
import { networkResource, provisionOptions, removeLeakedResources, storageResource, VM_BOOTUP_TIMEOUT } from './utils';
import { appHost, testName } from '../../protractor.conf';
import { errorMessage, isLoaded } from '../../views/crud.view';
import { statusIcons } from '../../views/kubevirt/virtualMachine.view';
import { basicVmConfig, glusterfsDisk, hddDisk, networkInterface, testNad } from './mocks';
import Wizard from './models/wizard';
import { VirtualMachine } from './models/virtualMachine';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new Wizard();
  const provisionConfigs = OrderedMap<string, {provision: provisionOptions, networkOptions: networkResource, storageOptions: storageResource}>()
    .set('URL (+2 disks, +1 NIC)', {
      provision: {
        method: 'URL',
        source: basicVmConfig.sourceURL,
      },
      networkOptions: [networkInterface],
      storageOptions: [hddDisk, glusterfsDisk],
    })
    .set('Container (+2 disks, +1 NIC)', {
      provision: {
        method: 'Container',
        source: basicVmConfig.sourceContainer,
      },
      networkOptions: [networkInterface],
      storageOptions: [glusterfsDisk, hddDisk],
    })
    .set('PXE (+2 disks, +1 NIC)', {
      provision: {method: 'PXE'},
      networkOptions: [networkInterface],
      storageOptions: [glusterfsDisk, hddDisk],
    });

  beforeAll(async() => {
    execSync(`echo '${JSON.stringify(testNad)}' | kubectl create -f -`);
  });

  afterAll(async() => {
    execSync(`kubectl delete -n ${testName} net-attach-def ${testNad.metadata.name}`);
    removeLeakedResources(leakedResources);
  });

  beforeEach(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
    await isLoaded();
    await wizard.openWizard();
  });

  provisionConfigs.forEach((provisionConfig, configName) => {
    it(`Create VM using ${configName}.`, async() => {
      const vmName = `vm-${provisionConfig.provision.method.toLowerCase()}-${testName}`;
      // Basic Settings

      await wizard.fillName(vmName);
      await wizard.fillDescription(testName);
      await wizard.selectProvisionSource(provisionConfig.provision);
      await wizard.selectFlavor(basicVmConfig.flavor);
      await wizard.selectOperatingSystem(basicVmConfig.operatingSystem);
      await wizard.selectWorkloadProfile(basicVmConfig.workloadProfile);
      await wizard.startOnCreation();
      await wizard.next();

      // Networking
      for (const networkOption of provisionConfig.networkOptions) {
        await wizard.addNic(networkOption.name, networkOption.mac, networkOption.networkDefinition, networkOption.binding);
      }
      await wizard.next();

      // Storage
      if (await wizard.getTableRowsCount() >= 1 && provisionConfig.provision.method !== 'Container') {
        await wizard.editDiskAttribute(1, 'size', '1'); // Change size of default rootdisk to 1 GB
      }
      for (const storageOption of provisionConfig.storageOptions) {
        await wizard.addDisk(storageOption.name, storageOption.size, storageOption.StorageClass);
      }

      // Create VM
      await wizard.next();
      await wizard.waitForCreation();

      // Check for errors and close wizard
      expect(errorMessage.isPresent()).toBe(false);
      leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
      await wizard.next();

      // Wait for VM to boot up
      const vm = new VirtualMachine(vmName, testName);
      await vm.waitForStatusIcon(statusIcons.running, VM_BOOTUP_TIMEOUT);

      await vm.action('Delete');
      leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    }, VM_BOOTUP_TIMEOUT);
  });
});

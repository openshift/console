/* eslint-disable no-undef, max-nested-callbacks */
import { execSync } from 'child_process';
import { OrderedMap } from 'immutable';
import { browser, ExpectedConditions as until } from 'protractor';

// eslint-disable-next-line no-unused-vars
import { networkResource, provision as provisionOptions, removeLeakedResources, storageResource, VM_BOOTUP_TIMEOUT } from './utils';
import { appHost, testName } from '../../protractor.conf';
import { deleteRow, errorMessage, filterForName, isLoaded, resourceRowsPresent } from '../../views/crud.view';
import { basicVmConfig, glusterfsDisk, hddDisk, networkInterface, testNAD } from './mocks';
import * as wizardView from '../../views/kubevirt/wizard.view';
import Wizard from './models/wizard';

describe('Kubevirt create VM template using wizard', () => {
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
    execSync(`echo '${JSON.stringify(testNAD)}' | kubectl create -f -`);
  });

  afterAll(async() => {
    execSync(`kubectl delete -n ${testName} net-attach-def ${testNAD.metadata.name}`);
    removeLeakedResources(leakedResources);
  });

  beforeEach(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/vmtemplates`);
    await isLoaded();
    await wizard.openWizard();
  });

  provisionConfigs.forEach((provisionConfig, configName) => {
    it(`Create VM template using ${configName}.`, async() => {
      const tmplName = `tmpl-${provisionConfig.provision.method.toLowerCase()}-${testName}`;
      // Basic Settings for VM template
      await wizard.fillName(tmplName);
      await wizard.filldescription(testName);
      await wizard.selectProvisionSource(provisionConfig.provision);
      await wizard.selectFlavor(basicVmConfig.flavor);
      await wizard.selectOperatingSystem(basicVmConfig.operatingSystem);
      await wizard.selectWorkloadProfile(basicVmConfig.workloadProfile);
      await wizard.next();

      // Networking
      for (const networkOption of provisionConfig.networkOptions) {
        await wizard.addNIC(networkOption.name, networkOption.mac, networkOption.networkDefinition);
      }
      await wizard.next();

      // Storage
      if (await wizard.getTableRowsCount() >= 1 && provisionConfig.provision.method !== 'Container') {
        await wizard.editDisk(1, 'size', '1'); // Change size of default rootdisk to 1 GB
      }
      for (const storageOption of provisionConfig.storageOptions) {
        await wizard.addDisk(storageOption.name, storageOption.size, storageOption.StorageClass);
      }

      // Create VM template
      await wizard.next();
      await wizard.waitForCreation();

      // Check for errors and close wizard
      expect(errorMessage.isPresent()).toBe(false);
      leakedResources.add(JSON.stringify({name: tmplName, namespace: testName, kind: 'template'}));
      await wizard.close();

      // Verify VM template is created
      await filterForName(tmplName);
      await resourceRowsPresent();

      // Verify the template can be used to create VM
      // Go to VM wizard
      await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
      await isLoaded();
      await wizard.openWizard();

      const vmName = `vm-${provisionConfig.provision.method.toLowerCase()}-${testName}`;
      // Basic Settings for VM
      await wizard.fillName(vmName);
      await wizard.filldescription(testName);
      await wizard.selectTemplate(tmplName);
      await wizard.startOnCreation();
      await wizard.next();

      // Networking
      await wizard.next();

      // Storage
      await wizard.next();

      // Create VM and close wizard
      await wizard.waitForCreation();

      // Check for errors and close wizard
      expect(errorMessage.isPresent()).toBe(false);
      leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
      await wizard.close();

      // Verify VM is created and running
      await filterForName(vmName);
      await resourceRowsPresent();
      await browser.wait(until.textToBePresentInElement(wizardView.firstRowVMStatus, 'Running'), VM_BOOTUP_TIMEOUT);

      // Delete VM
      await deleteRow('VirtualMachine')(vmName);
      leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));

      // Delete VM template
      // Go to VM wizard
      await browser.get(`${appHost}/k8s/ns/${testName}/vmtemplates`);
      await isLoaded();
      await deleteRow('Template')(tmplName);
      leakedResources.delete(JSON.stringify({name: tmplName, namespace: testName, kind: 'template'}));
    }, VM_BOOTUP_TIMEOUT);
  });
});

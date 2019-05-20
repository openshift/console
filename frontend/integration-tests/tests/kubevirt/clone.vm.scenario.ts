/* eslint-disable no-undef, max-nested-callbacks */
import { execSync } from 'child_process';
import { $, browser, ExpectedConditions as until } from 'protractor';
import * as _ from 'lodash';

// eslint-disable-next-line no-unused-vars
import { removeLeakedResources, waitForCount, searchYAML, searchJSON, getResourceJSON, addLeakableResource, removeLeakableResource, deleteResource, createResources, deleteResources } from './utils/utils';
import { CLONE_VM_TIMEOUT, VM_BOOTUP_TIMEOUT, PAGE_LOAD_TIMEOUT, VM_STOP_TIMEOUT, TABS } from './utils/consts';
import { appHost, testName } from '../../protractor.conf';
import { filterForName, isLoaded, resourceRowsPresent, resourceRows } from '../../views/crud.view';
import { basicVmConfig, networkInterface, testNad, getVmManifest, cloudInitCustomScriptConfig, emptyStr, rootDisk } from './mocks';
import * as wizardView from '../../views/kubevirt/wizard.view';
import Wizard from './models/wizard';
import { VirtualMachine } from './models/virtualMachine';
import { statusIcons } from '../../views/kubevirt/virtualMachine.view';


describe('Test clone VM.', () => {
  const leakedResources = new Set<string>();
  const wizard = new Wizard();
  const testContainerVm = getVmManifest('Container', testName);
  const vm = new VirtualMachine(testContainerVm.metadata.name, testContainerVm.metadata.namespace);
  const nameValidationNamespace = `${testName}-cloning`;
  const testNameValidationVm = getVmManifest('Container', nameValidationNamespace, testContainerVm.metadata.name);

  describe('Test Clone VM wizard dialog.', () => {
    beforeAll(() => {
      execSync(`oc new-project ${nameValidationNamespace} --skip-config-write=true`);
      execSync(`echo '${JSON.stringify(testContainerVm)}' | kubectl create -f -`);
      execSync(`echo '${JSON.stringify(testNad)}' | kubectl create -f -`);
      execSync(`echo '${JSON.stringify(testNameValidationVm)}' | kubectl create -f -`);
    });

    afterAll(() => {
      execSync(`kubectl delete -n ${testNad.metadata.namespace} net-attach-def ${testNad.metadata.name}`);
      execSync(`kubectl delete -n ${testContainerVm.metadata.namespace} vm ${testContainerVm.metadata.name}`);
      execSync(`kubectl delete -n ${testNameValidationVm.metadata.namespace} vm ${testNameValidationVm.metadata.name}`);
      execSync(`oc delete project ${nameValidationNamespace}`);
    });

    it('Display warning in clone wizard when cloned vm is running.', async() => {
      await vm.action('Start');
      await vm.action('Clone');

      await browser.wait(until.visibilityOf(wizardView.cloneVmWarning), PAGE_LOAD_TIMEOUT);
      expect(wizardView.nextButton.isEnabled()).toBeTruthy('It should still be possible to clone the VM');

      // Clone the VM
      await wizard.next();
      const clonedVm = new VirtualMachine(`${vm.name}-clone`, vm.namespace);
      leakedResources.add(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));

      // Verify that the original VM is stopped
      await vm.waitForStatusIcon(statusIcons.off, VM_STOP_TIMEOUT);

      await clonedVm.action('Delete');
      leakedResources.delete(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));
    }, CLONE_VM_TIMEOUT);

    it('Prefill correct data in the clone VM dialog.', async() => {
      await vm.action('Clone');

      expect(wizardView.cloneVmWarning.isPresent()).toBe(false, 'Warning should not be present.');
      expect(wizardView.nameInput.getAttribute('value')).toEqual(`${vm.name}-clone`, '\'-cloned\' should be appended to cloned VM name.');
      expect(wizardView.descriptionInput.getText()).toEqual(testContainerVm.metadata.annotations.description, 'Description should match original VM description.');
      expect($(wizardView.namespaceDropdownId).getText()).toEqual(vm.namespace, 'Namaspace should match original VM namespace.');

      await wizard.close();
    });

    it('Validate VM name.', async() => {
      await vm.action('Clone');

      expect(wizardView.cloneVmWarning.isPresent()).toBe(false, 'Warning should not be present.');

      // Check warning is displayed when VM has same name as existing VM
      await wizard.fillName(vm.name);
      await browser.wait(until.presenceOf(wizardView.wizardHelpBlock));
      expect(wizardView.wizardHelpBlock.getText()).toContain('Name is already used', 'Help block should be displayed.');

      // Check warning is displayed when VM has same name as existing VM in another namespace
      await wizard.fillName(testNameValidationVm.metadata.name);
      await wizard.selectNamespace(testNameValidationVm.metadata.namespace);
      await browser.wait(until.presenceOf(wizardView.wizardHelpBlock));
      expect(wizardView.wizardHelpBlock.getText()).toContain('Name is already used', 'Help block should be displayed.');

      await wizard.close();
    });
  });

  describe('Test Cloning VM.', () => {
    const urlVmManifest = getVmManifest('URL', testName);
    const urlVm = new VirtualMachine(urlVmManifest.metadata.name, urlVmManifest.metadata.namespace);
    const cloudInitVmName = `ci-${testName}`;
    const cloudInitVmProvisionConfig = {
      method: 'URL',
      source: basicVmConfig.sourceURL,
    };

    beforeAll(async() => {
      createResources([urlVmManifest, testNad]);
    });

    afterAll(async() => {
      deleteResources([urlVmManifest, testNad]);
      removeLeakedResources(leakedResources);
    });

    beforeEach(async() => {
      execSync(`echo '${JSON.stringify(testContainerVm)}' | kubectl create -f -`);
    });

    afterEach(async() => {
      execSync(`kubectl delete -n ${testName} vm ${vm.name}`);
    }, VM_BOOTUP_TIMEOUT);

    it('Start cloned VM on creation', async() => {
      await vm.action('Clone');
      await wizard.startOnCreation();
      await wizard.next();

      const clonedVm = new VirtualMachine(`${vm.name}-clone`, vm.namespace);
      leakedResources.add(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));

      await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
      await isLoaded();

      await filterForName(`${testContainerVm.metadata.name}-clone`);
      await resourceRowsPresent();
      await browser.wait(until.textToBePresentInElement(wizardView.firstRowVMStatus, 'Running'), VM_BOOTUP_TIMEOUT);

      await clonedVm.action('Delete');
      leakedResources.delete(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));
    }, VM_BOOTUP_TIMEOUT);

    it('Cloned VM has cleared MAC addresses.', async() => {
      await vm.addNic(networkInterface.name, networkInterface.mac, networkInterface.networkDefinition, networkInterface.binding);
      await vm.action('Clone');
      await wizard.next();

      const clonedVm = new VirtualMachine(`${vm.name}-clone`, vm.namespace);
      leakedResources.add(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));
      await clonedVm.navigateToTab(TABS.NICS);

      await browser.wait(until.and(waitForCount(resourceRows, 2)), PAGE_LOAD_TIMEOUT);
      // TODO: Add classes/ids to collumn attributes so that divs can be easily selected
      const mac = await resourceRows.first().$('div:nth-child(5)').getText();
      expect(mac === emptyStr).toBe(true, 'MAC address should be cleared');

      await clonedVm.action('Delete');
      leakedResources.delete(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));
      await vm.removeNic(networkInterface.name);
    }, VM_BOOTUP_TIMEOUT);

    it('Cloned VM has vm.kubevirt.io/name label.', async() => {
      await vm.action('Clone');
      await wizard.next();

      const clonedVm = new VirtualMachine(`${vm.name}-clone`, vm.namespace);
      leakedResources.add(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));
      expect(searchYAML(`vm.kubevirt.io/name: ${vm.name}`, clonedVm.name, clonedVm.namespace, 'vm'))
        .toBeTruthy('Cloned VM should have vm.kubevirt.io/name label.');

      await clonedVm.action('Delete');
      leakedResources.delete(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));
    }, VM_BOOTUP_TIMEOUT);

    it('Clone VM with Container source.', async() => {
      await vm.action('Clone');
      await wizard.next();

      const clonedVm = new VirtualMachine(`${vm.name}-clone`, vm.namespace);
      leakedResources.add(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));
      expect(searchYAML('kubevirt/cirros-registry-disk-demo', clonedVm.name, clonedVm.namespace, 'vm'))
        .toBeTruthy('Cloned VM should have container image.');

      await clonedVm.action('Start');
      await clonedVm.action('Delete');
      leakedResources.delete(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));
    }, CLONE_VM_TIMEOUT);

    it('Clone VM with URL source.', async() => {
      await urlVm.action('Start');
      await urlVm.action('Clone');
      await wizard.next();

      const clonedVm = new VirtualMachine(`${urlVm.name}-clone`, urlVm.namespace);
      leakedResources.add(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));
      await clonedVm.action('Start');

      // Check cloned PVC exists
      const clonedVmDiskName = `${clonedVm.name}-${urlVm.name}-rootdisk-clone`;
      await browser.get(`${appHost}/k8s/ns/${testName}/persistentvolumeclaims`);
      await isLoaded();
      await filterForName(clonedVmDiskName);
      await resourceRowsPresent();

      // Verify cloned disk dataVolumeTemplate is present in cloned VM manifest
      expect(searchJSON('spec.dataVolumeTemplates[0].metadata.name', clonedVmDiskName, clonedVm.name, clonedVm.namespace, 'vm'))
        .toBeTruthy('Cloned VM should have container image.');

      await clonedVm.action('Delete');
      leakedResources.delete(JSON.stringify({name: clonedVm.name, namespace: clonedVm.namespace, kind: 'vm'}));
    }, CLONE_VM_TIMEOUT);

    it('Clone VM with URL source and Cloud Init.', async() => {
      const ciVmConfig = {
        name: `ci-${testName}`,
        namespace: testName,
        description: `Default description ${testName}`,
        provisionSource: cloudInitVmProvisionConfig,
        storageResources: [rootDisk],
        networkResources: [],
        flavor: basicVmConfig.flavor,
        operatingSystem: basicVmConfig.operatingSystem,
        workloadProfile: basicVmConfig.workloadProfile,
        startOnCreation: false,
        cloudInit: cloudInitCustomScriptConfig,
      };
      const ciVm = new VirtualMachine(cloudInitVmName, testName);
      await ciVm.create(ciVmConfig);

      addLeakableResource(leakedResources, ciVm.asResource());

      // Clone VM
      await ciVm.action('Clone');
      await wizard.next();
      const clonedVm = new VirtualMachine(`${cloudInitVmName}-clone`, ciVm.namespace);
      addLeakableResource(leakedResources, clonedVm.asResource());

      // Check disks on cloned VM
      const disks = await clonedVm.getAttachedResources(TABS.DISKS);
      [rootDisk.name, 'cloudinitdisk'].forEach(element => {
        expect(disks.includes(element)).toBe(true, `Disk ${element} should be present on cloned VM.`);
      });

      // Verify configuration of cloudinitdisk is the same
      const clonedVmJson = JSON.parse(getResourceJSON(clonedVm.name, clonedVm.namespace, clonedVm.kind));
      const clonedVmVolumes = _.get(clonedVmJson, 'spec.template.spec.volumes');
      const result = _.filter(clonedVmVolumes, function(o) {
        return o.name === 'cloudinitdisk';
      });

      expect(result.length).toBe(1, 'There should be only one cloudinitdisk');
      expect(result[0].cloudInitNoCloud.userData).toEqual(cloudInitCustomScriptConfig.customScript, 'CI config should remain the same.');

      // Verify the cloned VM can boot
      await clonedVm.action('Start');

      // Delete VMs
      deleteResource(clonedVm.asResource());
      deleteResource(ciVm.asResource());
      removeLeakableResource(leakedResources, clonedVm.asResource());
      removeLeakableResource(leakedResources, ciVm.asResource());
    }, CLONE_VM_TIMEOUT);
  });
});

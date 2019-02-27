/* eslint-disable no-undef, max-nested-callbacks */

import { execSync } from 'child_process';
import { browser, by, ExpectedConditions as until } from 'protractor';
import { OrderedMap } from 'immutable';

import { appHost, testName } from '../../protractor.conf';
import { resourceRowsPresent, filterForName, deleteRow, createItemButton, isLoaded, errorMessage } from '../../views/crud.view';
import { removeLeakedResources } from './utils';
import { testNAD } from './mocks';
import * as vmView from '../../views/kubevirt/vm.view';

const VM_BOOTUP_TIMEOUT = 90000;
const PAGE_LOAD_TIMEOUT = 5000;
const VM_WIZARD_LOAD_TIMEOUT = 10000;

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const vmName = `vm-${testName}`;
  const operatingSystem = 'Red Hat Enterprise Linux 7.6';
  const flavor = 'small';
  const workloadProfile = 'generic';
  const sourceURL = 'https://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img';
  const sourceContainer = 'kubevirt/cirros-registry-disk-demo:latest';
  const pxeInterface = 'nic1';
  const provisionMethods = OrderedMap<string, (provisionSource: string) => void>()
    .set('PXE', async function(provisionSource) {
      await vmView.provisionSourceButton.click();
      await vmView.provisionSourceMenu.element(by.linkText(provisionSource)).click();
    })
    .set('Container', async function(provisionSource){
      await vmView.provisionSourceButton.click();
      await vmView.provisionSourceMenu.element(by.linkText(provisionSource)).click();

      await vmView.provisionSourceContainerImage.sendKeys(sourceContainer);
    })
    .set('URL', async function(provisionSource){
      await vmView.provisionSourceButton.click();
      await vmView.provisionSourceMenu.element(by.linkText(provisionSource)).click();

      await vmView.provisionSourceURL.sendKeys(sourceURL);
    });

  async function fillBasicSettings(provisionMethod: (provisionSource: string) => void, provisionSourceName: string){
    await browser.wait(until.presenceOf(vmView.nameInput), VM_WIZARD_LOAD_TIMEOUT);
    await vmView.nameInput.sendKeys(vmName);

    await vmView.namespaceButton.click();
    await vmView.namespaceMenu.element(by.linkText(testName)).click();

    await provisionMethod(provisionSourceName);

    await vmView.operatingSystemButton.click();
    await vmView.operatingSystemMenu.element(by.linkText(operatingSystem)).click();

    await vmView.flavorButton.click();
    await vmView.flavorSourceMenu.element(by.linkText(flavor)).click();

    await vmView.workloadProfileButton.click();
    await vmView.workloadProfileMenu.element(by.linkText(workloadProfile)).click();

    await vmView.startVMOnCreation.click();

    await vmView.nextButton.click();
  }

  async function fillVMNetworking(provisionSourceName: string){
    if (provisionSourceName === 'PXE'){
      await vmView.createNIC.click();

      await vmView.networkDefinitionButton.click();
      await vmView.networkDefinitionMenu.element(by.linkText(testNAD.metadata.name)).click();

      await vmView.pxeNICButton.click();
      await vmView.pxeNICMenu.element(by.linkText(pxeInterface)).click();
      await vmView.applyButton.click();
    }
    await vmView.nextButton.click();
  }

  async function fillVMStorage(provisionSourceName: string){
    if (provisionSourceName === 'URL'){
      await vmView.setDiskAttribute(0, 'size', '1');
    }
  }

  beforeAll(async() => {
    execSync(`echo '${JSON.stringify(testNAD)}' | kubectl create -f -`);
  });

  afterAll(async() => {
    execSync(`kubectl delete -n ${testName} net-attach-def ${testNAD.metadata.name}`);
    removeLeakedResources(leakedResources);
  });

  provisionMethods.forEach((provisionMethod, methodName) => {
    it(`Using ${methodName} provision source.`, async() => {
      await browser.get(`${appHost}/k8s/all-namespaces/virtualmachines`);
      await isLoaded();
      await createItemButton.click().then(() => vmView.createWithWizardLink.click());
      await fillBasicSettings(provisionMethod, methodName);
      await fillVMNetworking(methodName);
      await fillVMStorage(methodName);
      // confirm to create VM
      await vmView.nextButton.click();
      await browser.wait(until.not(until.textToBePresentInElement(vmView.wizardContent, 'Creation of VM in progress')), VM_WIZARD_LOAD_TIMEOUT);
      // Check for error and close wizard
      expect(errorMessage.isPresent()).toBe(false);
      leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
      await browser.wait(until.elementToBeClickable(vmView.nextButton), PAGE_LOAD_TIMEOUT).then(() => vmView.nextButton.click());
      // Verify VM is created and running
      await browser.wait(until.invisibilityOf(vmView.wizardHeader), PAGE_LOAD_TIMEOUT);
      await filterForName(vmName);
      await resourceRowsPresent();
      await browser.wait(until.textToBePresentInElement(vmView.firstRowVMStatus, 'Running'), VM_BOOTUP_TIMEOUT);
      // Delete VM
      await deleteRow('VirtualMachine')(vmName);
      leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    }, VM_BOOTUP_TIMEOUT);
  });
});

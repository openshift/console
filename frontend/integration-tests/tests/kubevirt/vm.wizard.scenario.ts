/* eslint-disable no-undef, max-nested-callbacks */

import { execSync } from 'child_process';
import { browser, by, ExpectedConditions as until } from 'protractor';
import { OrderedMap } from 'immutable';

import { appHost, testName } from '../../protractor.conf';
import { resourceRowsPresent, filterForName, deleteRow, createItemButton, isLoaded, errorMessage } from '../../views/crud.view';
import { removeLeakedResources } from './utils';
import { testNAD } from './mocks';
import * as vmView from '../../views/kubevirt/vm.view';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const vmName = `vm-${testName}`;
  const operatingSystem = 'fedora28';
  const flavor = 'small';
  const workloadProfile = 'generic';
  const sourceURL = 'https://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img';
  const sourceContainer = 'kubevirt/cirros-registry-disk-demo:latest';
  const pxeInterface = 'eth1';
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
    await browser.wait(until.presenceOf(vmView.nameInput), 10000);
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
      // Use default storage settings
      await vmView.nextButton.click();
      // Confirm to create VM
      await browser.wait(until.elementToBeClickable(vmView.nextButton), 5000).then(() => vmView.nextButton.click());
      expect(errorMessage.isPresent()).toBe(false);
      leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
      // Verify VM is created and running
      await browser.wait(until.invisibilityOf(vmView.wizardHeader), 5000);
      await filterForName(vmName);
      await resourceRowsPresent();
      await browser.wait(until.textToBePresentInElement(vmView.firstRowVMStatus, 'Running'), 20000);
      // Delete VM
      await deleteRow('VirtualMachine')(vmName);
      leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    });
  });
});

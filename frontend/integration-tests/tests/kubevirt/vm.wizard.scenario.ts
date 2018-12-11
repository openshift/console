/* eslint-disable no-undef */

import { execSync } from 'child_process';
import { browser, by, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '../../protractor.conf';
import { resourceRowsPresent, filterForName, deleteRow, isLoaded, createItemButton } from '../../views/crud.view';
import * as vmView from '../../views/kubevirt/vm.view';


describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const vmName = `vm-${testName}`;
  const provisionSource = 'PXE';
  const operatingSystem = 'fedora28';
  const flavor = 'small';
  const workloadProfile = 'generic';
  const networkDefinitionName = `${testName}-ovs-net-1`;
  const pxeInterface = 'eth1';
  const testNAD = {
    apiVersion: 'k8s.cni.cncf.io/v1',
    kind: 'NetworkAttachmentDefinition',
    metadata: {
      name: networkDefinitionName,
      namespace: testName,
    },
    spec: {
      config: '{ "cniVersion": "0.3.1", "type": "ovs", "bridge": "br0" }',
    },
  };

  beforeAll(async() => {
    execSync(`echo '${JSON.stringify(testNAD)}' | kubectl create -f -`);
  });

  afterAll(async() => {
    execSync(`kubectl delete -n ${testName} net-attach-def ${networkDefinitionName}`);
    const leakedArray: Array<string> = [...leakedResources];
    if (leakedArray.length > 0) {
      console.error(`Leaked ${leakedArray.join()}`);
      leakedArray.map(r => JSON.parse(r) as {name: string, namespace: string, kind: string})
        .forEach(({name, namespace, kind}) => {
          try {
            execSync(`kubectl delete -n ${namespace} --cascade ${kind} ${name}`);
          } catch (error) {
            console.error(`Failed to delete ${kind} ${name}:\n${error}`);
          }
        });
    }
  });

  it('Navigates to VMs', async() => {
    await browser.get(`${appHost}/k8s/all-namespaces/virtualmachines`);
    await isLoaded();
  });

  it('Opens VM wizard', async() => {
    await createItemButton.click().then(() => vmView.createWithWizardLink.click());
  });

  it('Configures VM Basic Settings', async() => {
    await browser.wait(until.presenceOf(vmView.nameInput), 10000);
    await vmView.nameInput.sendKeys(vmName);

    await vmView.namespaceButton.click();
    await vmView.namespaceMenu.element(by.linkText(testName)).click();

    await vmView.provisionSourceButton.click();
    await vmView.provisionSourceMenu.element(by.linkText(provisionSource)).click();

    await vmView.operatingSystemButton.click();
    await vmView.operatingSystemMenu.element(by.linkText(operatingSystem)).click();

    await vmView.flavorButton.click();
    await vmView.flavorSourceMenu.element(by.linkText(flavor)).click();

    await vmView.workloadProfileButton.click();
    await vmView.workloadProfileMenu.element(by.linkText(workloadProfile)).click();

    await vmView.startVMOnCreation.click();

    await vmView.nextButton.click();
  });

  it('Configures VM Networking', async() => {
    await vmView.createNIC.click();

    await vmView.networkDefinitionButton.click();
    await vmView.networkDefinitionMenu.element(by.linkText(networkDefinitionName)).click();

    await vmView.pxeNICButton.click();
    await vmView.pxeNICMenu.element(by.linkText(pxeInterface)).click();
    await vmView.applyButton.click();

    await vmView.nextButton.click();
  });

  it('Configures VM Storage', async() => {
    await vmView.nextButton.click();
  });

  it('Confirms to create VM', async() => {
    leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    await browser.wait(until.elementToBeClickable(vmView.nextButton), 5000).then(() => vmView.nextButton.click());
  });

  it('Verifies created VM', async() => {
    await browser.wait(until.invisibilityOf(vmView.wizardHeader), 5000);
    await filterForName(vmName);
    await resourceRowsPresent();
    await browser.wait(until.textToBePresentInElement(vmView.firstRowVMStatus, 'Running'), 20000);
  });

  it('Removes created VM', async() => {
    await deleteRow('VirtualMachine')(vmName);
    leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
  });
});

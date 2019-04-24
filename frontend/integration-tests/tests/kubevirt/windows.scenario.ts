/* eslint-disable no-undef, max-nested-callbacks */
import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
// eslint-disable-next-line no-unused-vars
import { removeLeakedResources, waitForStringInElement, VM_IP_ASSIGNMENT_TIMEOUT, WINDOWS_IMPORT_TIMEOUT, VM_BOOTUP_TIMEOUT} from './utils';
import { testName, appHost } from '../../protractor.conf';
import { errorMessage, isLoaded } from '../../views/crud.view';
import { windowsVmConfig, localStorageDisk, multusNetworkInterface, multusNad, localStorageClass, localStoragePersistentVolume } from './mocks';
import Wizard from './models/wizard';
import { VirtualMachine } from './models/virtualMachine';
import { consolesTab, overviewTab, overviewIpAddresses, statusIcon, statusIcons } from '../../views/kubevirt/virtualMachine.view';

const WINDOWS_RDP_TIMEOUT = WINDOWS_IMPORT_TIMEOUT + VM_IP_ASSIGNMENT_TIMEOUT + VM_BOOTUP_TIMEOUT;

describe('Windows VM', () => {
  const leakedResources = new Set<string>();
  const wizard = new Wizard();
  const provisionConfig = {
    provision: {
      method: 'URL',
      source: windowsVmConfig.sourceURL,
    },
    networkOptions: [multusNetworkInterface],
  };
  const vmIp = '192.168.0.55';
  const rdpPort = '3389';

  beforeAll(async() => {
    execSync(`echo '${JSON.stringify(multusNad)}' | kubectl create -f -`);
    execSync(`echo '${JSON.stringify(localStorageClass)}' | kubectl create -f -`);
    execSync(`echo '${JSON.stringify(localStoragePersistentVolume)}' | kubectl create -f -`);
  });

  afterAll(async() => {
    removeLeakedResources(leakedResources);
    execSync(`kubectl delete -n ${multusNad.metadata.namespace} net-attach-def ${multusNad.metadata.name}`);
    execSync(`kubectl delete ${localStorageClass.kind} ${localStorageClass.metadata.name}`);
    execSync(`kubectl delete ${localStoragePersistentVolume.kind} ${localStoragePersistentVolume.metadata.name}`);
  });

  beforeEach(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
    await isLoaded();
    await wizard.openWizard();
  });

  it('Windows L2 RDP', async() => {
    const vmName = `windows-${provisionConfig.provision.method.toLowerCase()}-${testName.slice(-5)}`;

    // Basic Settings
    await wizard.fillName(vmName);
    await wizard.fillDescription(testName);
    await wizard.selectProvisionSource(provisionConfig.provision);
    await wizard.selectFlavor(windowsVmConfig.flavor);
    await wizard.selectOperatingSystem(windowsVmConfig.operatingSystem);
    await wizard.selectWorkloadProfile(windowsVmConfig.workloadProfile);
    await wizard.next();

    // Networking
    for (const networkOption of provisionConfig.networkOptions) {
      await wizard.addNic(networkOption.name, networkOption.mac, networkOption.networkDefinition, networkOption.binding);
    }
    await wizard.next();

    // Change Rootdisk size and storage class
    await wizard.editDiskAttribute(1, 'storage', localStorageDisk.storageClass);
    await wizard.editDiskAttribute(1, 'size', localStorageDisk.size);

    // Create VM
    await wizard.next();
    await wizard.waitForCreation();

    // Check for errors and close wizard
    expect(errorMessage.isPresent()).toBe(false);
    leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
    await wizard.next();

    // Wait for import to finish
    await browser.wait(until.invisibilityOf(statusIcon(statusIcons.importing)), WINDOWS_IMPORT_TIMEOUT);

    // Start VM
    const vm = new VirtualMachine(vmName, testName);
    await vm.action('Start');

    // Wait for IP assignment
    await vm.navigateToTab(overviewTab);
    await browser.wait(until.and(waitForStringInElement(overviewIpAddresses(vm.name, vm.namespace), vmIp)), VM_IP_ASSIGNMENT_TIMEOUT);

    // Select Desktop Viewer
    await vm.navigateToTab(consolesTab);
    await vm.selectConsole('Desktop Viewer');

    // Verify that multus nic is selected by default and console page displays correct addresses
    expect(vm.getConsoleVmIpAddress()).toEqual(vmIp);
    expect(vm.getConsoleRdpPort()).toEqual(rdpPort);

    await vm.action('Delete');
    leakedResources.delete(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));
  }, WINDOWS_RDP_TIMEOUT);
});

/* eslint-disable no-undef, max-nested-callbacks */
import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
// eslint-disable-next-line no-unused-vars
import { removeLeakedResources, waitForStringInElement, deleteResource, createResources, removeLeakableResource, addLeakableResource } from './utils/utils';
import { VM_IP_ASSIGNMENT_TIMEOUT, WINDOWS_IMPORT_TIMEOUT, VM_BOOTUP_TIMEOUT, TABS } from './utils/consts';
import { testName } from '../../protractor.conf';
import { windowsVmConfig, localStorageDisk, multusNetworkInterface, multusNad, localStorageClass, localStoragePersistentVolume } from './mocks';
import { VirtualMachine } from './models/virtualMachine';
import { overviewIpAddresses } from '../../views/kubevirt/virtualMachine.view';

const WINDOWS_RDP_TIMEOUT = WINDOWS_IMPORT_TIMEOUT + VM_IP_ASSIGNMENT_TIMEOUT + VM_BOOTUP_TIMEOUT;

describe('Windows VM', () => {
  const leakedResources = new Set<string>();
  const vmConfig = {
    name: `windows-${testName.slice(-5)}`,
    startOnCreation: true,
    cloudInit: {
      useCloudInit: false,
    },
    namespace: testName,
    description: `Default description ${testName}`,
    flavor: windowsVmConfig.flavor,
    operatingSystem: windowsVmConfig.operatingSystem,
    workloadProfile: windowsVmConfig.workloadProfile,
    provisionSource: {
      method: 'URL',
      source: windowsVmConfig.sourceURL,
    },
    storageResources: [localStorageDisk],
    networkResources: [multusNetworkInterface],
  };
  const vm = new VirtualMachine(vmConfig);
  const vmIp = '192.168.0.55';
  const rdpPort = '3389';

  beforeAll(async() => {
    createResources([multusNad, localStorageClass, localStoragePersistentVolume]);
  });

  afterAll(async() => {
    removeLeakedResources(leakedResources);
    deleteResource(multusNad);
    execSync(`kubectl delete ${localStorageClass.kind} ${localStorageClass.metadata.name}`);
    execSync(`kubectl delete ${localStoragePersistentVolume.kind} ${localStoragePersistentVolume.metadata.name}`);
  });

  it('Windows L2 RDP', async() => {
    await vm.create(vmConfig);
    addLeakableResource(leakedResources, vm.asResource());

    // Wait for IP assignment
    await vm.navigateToTab(TABS.OVERVIEW);
    await browser.wait(until.and(waitForStringInElement(overviewIpAddresses(vm.name, vm.namespace), vmIp)), VM_IP_ASSIGNMENT_TIMEOUT);

    // Select Desktop Viewer
    await vm.navigateToTab(TABS.CONSOLES);
    await vm.selectConsole('Desktop Viewer');

    // Verify that multus nic is selected by default and console page displays correct addresses
    expect(vm.getConsoleVmIpAddress()).toEqual(vmIp);
    expect(vm.getConsoleRdpPort()).toEqual(rdpPort);

    await vm.action('Delete');
    removeLeakableResource(leakedResources, vm.asResource());
  }, WINDOWS_RDP_TIMEOUT);
});

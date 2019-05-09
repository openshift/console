/* eslint-disable no-undef */
import { $, browser } from 'protractor';

import { appHost, testName } from '../../protractor.conf';
import { isLoaded } from '../../views/crud.view';
import { testNad, basicVmConfig, networkInterface, networkBindingMethod, networkWizardTabCol, networkTabCol } from './mocks';
import * as vmView from '../../views/kubevirt/virtualMachine.view';
import { fillInput, selectDropdownOption, getDropdownOptions, createResources, deleteResources } from './utils//utils';
import Wizard from './models/wizard';
import { VirtualMachine } from './models/virtualMachine';
import * as wizardView from '../../views/kubevirt/wizard.view';

describe('Test VM network interface binding method', () => {
  const wizard = new Wizard();
  const vmName = `vm-${testName}`;
  const vm = new VirtualMachine(vmName, testName);
  const allBindingMethods = [networkBindingMethod.bridge, networkBindingMethod.masquerade, networkBindingMethod.sriov];
  const nonPodNetworkBindingMethods = [networkBindingMethod.bridge, networkBindingMethod.sriov];

  beforeAll(async() => {
    createResources([testNad]);
  });

  afterAll(async() => {
    deleteResources([testNad, vm.asResource()]);
  });

  it('Check nic binding method on wizard', async() => {

    const provisionSource = {method: 'Container', source: basicVmConfig.sourceContainer};

    await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
    await isLoaded();
    await wizard.openWizard();

    // Basic Settings for VM
    await wizard.fillName(vmName);
    await wizard.fillDescription(testName);
    await wizard.selectProvisionSource(provisionSource);
    await wizard.selectOperatingSystem(basicVmConfig.operatingSystem);
    await wizard.selectFlavor(basicVmConfig.flavor);
    await wizard.selectWorkloadProfile(basicVmConfig.workloadProfile);
    await wizard.next();

    // Networking
    // Pod networking
    let rowsCount = await wizardView.tableRowsCount();
    let bindingID = wizardView.dropdownOptionID('binding', rowsCount);
    const podNetworkBinding = wizardView.itemInTable(0, networkWizardTabCol.binding);
    // Pod networking default binding is masquerade
    expect(podNetworkBinding.getText()).toEqual(networkBindingMethod.masquerade);
    // Open binding method dropdown menu, 1st click activates the row, 2nd click gets the dropdown
    await podNetworkBinding.click();
    await podNetworkBinding.click();
    let options = await getDropdownOptions(bindingID);
    // Pod networking can choose binding method from masquerade, bridge and sriov
    expect(options.sort()).toEqual(allBindingMethods.sort());
    await wizardView.cancelButton.click();

    // Non pod networking
    await wizardView.createNIC.click();
    rowsCount = await wizardView.tableRowsCount();
    bindingID = wizardView.dropdownOptionID('binding', rowsCount);
    await $(bindingID).click();
    options = await getDropdownOptions(bindingID);
    // Without network selected, binding method masquerade, bridge and sriov are available
    expect(options.sort()).toEqual(allBindingMethods.sort());
    await $(bindingID).click();

    await wizardView.selectTableDropdownAttribute(rowsCount, 'network', networkInterface.networkDefinition);
    // Network selected, default binding method is bridge
    expect(wizardView.dropdownOption('binding', rowsCount).getText()).toEqual(networkBindingMethod.bridge);
    await $(bindingID).click();
    options = await getDropdownOptions(bindingID);
    // Network selected, binding method bridge and sriov are available
    expect(options.sort()).toEqual(nonPodNetworkBindingMethods.sort());
    await $(bindingID).click();

    await wizardView.selectTableDropdownAttribute(rowsCount, 'binding', networkBindingMethod.bridge);
    await wizardView.setTableInputAttribute(rowsCount, 'mac', networkInterface.mac);
    await wizardView.setTableInputAttribute(rowsCount, 'name', networkInterface.name);
    await wizardView.apply.click();
    const networkBinding = wizardView.itemInTable(1, networkWizardTabCol.binding);
    expect(networkBinding.getText()).toEqual(networkBindingMethod.bridge);

    // Storage
    await wizard.next();

    // Create VM
    await wizard.next();
  });

  it('Check nic binding method on vm nic tab', async() => {
    await vm.navigateToTab(vmView.nicsTab);
    await isLoaded();

    expect(vmView.itemInRow(networkInterface.podNicName, networkTabCol.binding).getText()).toEqual(networkBindingMethod.masquerade);
    expect(vmView.itemInRow(networkInterface.name, networkTabCol.binding).getText()).toEqual(networkBindingMethod.bridge);

    await vm.removeNic(networkInterface.name);
    await isLoaded();

    await vmView.createNic.click();
    await $(vmView.networkBindingId).click();
    let options = await getDropdownOptions(vmView.networkBindingId);
    // Without network selected, binding method masquerade, bridge and sriov are available
    expect(options.sort()).toEqual(allBindingMethods.sort());
    await $(vmView.networkBindingId).click();

    await selectDropdownOption(vmView.networkTypeDropdownId, networkInterface.networkDefinition);

    await $(vmView.networkBindingId).click();
    options = await getDropdownOptions(vmView.networkBindingId);
    // Network selected, binding method bridge and sriov are available
    expect(options.sort()).toEqual(nonPodNetworkBindingMethods.sort());
    await $(vmView.networkBindingId).click();

    await selectDropdownOption(vmView.networkBindingId, networkBindingMethod.bridge);
    await fillInput(vmView.nicName, networkInterface.name);
    await fillInput(vmView.macAddress, networkInterface.mac);
    await vmView.applyBtn.click();
    await isLoaded();
    expect(vmView.itemInRow(networkInterface.name, networkTabCol.binding).getText()).toEqual(networkBindingMethod.bridge);

    await vm.removeNic(networkInterface.name);
  });
});

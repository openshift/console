import { browser } from 'protractor';
import { testName, appHost } from '@console/internal-integration-tests/protractor.conf';
import {
  getVMManifest,
  getConfigMap,
  hddDisk,
  multusNetworkInterface,
  multusNAD,
} from './mocks/mocks';
import { VirtualMachine } from './models/virtualMachine';
import { getRandStr, getSelectedOptionText, selectOptionByText } from './utils/utils';
import {
  fillInput,
  click,
  createResources,
  deleteResources,
} from '@console/shared/src/test-utils/utils';
import { VM_ACTION } from './utils/constants/vm';
import { VM_BOOTUP_TIMEOUT_SECS } from './utils/constants/common';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { saveButton, tableRows } from '../views/kubevirtUIResource.view';
import * as editFlavorView from '../views/dialogs/editFlavorView';
import {
  isPCAlertPresent,
  isPCInfoAlertPresent,
  alertHeadings,
  alertValues,
} from '../views/vm.next.run.configuration.view';
import * as bootOrderView from '../views/dialogs/editBootOrderView';
import * as vmEnv from '../views/vm.environment.view';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { Flavor } from './utils/constants/wizard';

describe('Kubevirt VM Next Run Configuration', () => {
  const testVM = getVMManifest(
    ProvisionSource.CONTAINER,
    testName,
    `next-run-conf-${getRandStr(5)}`,
  );
  const vm = new VirtualMachine(testVM.metadata);
  const configmapName = 'configmap-mock';
  const configMap = getConfigMap(testName, configmapName);

  beforeAll(async () => {
    createResources([configMap, multusNAD, testVM]);
  });

  afterAll(() => {
    deleteResources([configMap, multusNAD, testVM]);
  });

  beforeEach(async () => {
    await vm.detailViewAction(VM_ACTION.Start);
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines/${vm.name}`);
    await isLoaded();
  }, VM_BOOTUP_TIMEOUT_SECS);

  afterEach(async () => {
    await vm.detailViewAction(VM_ACTION.Stop);
  }, VM_BOOTUP_TIMEOUT_SECS);

  it('Change Flavor from tiny to custom while VM is running.', async () => {
    await vm.navigateToDetail();
    await vm.modalEditFlavor();
    expect(await getSelectedOptionText(editFlavorView.flavorDropdown)).toEqual(Flavor.TINY);
    expect(await isPCInfoAlertPresent()).toBeTruthy();
    await selectOptionByText(editFlavorView.flavorDropdown, Flavor.CUSTOM);
    expect(await isPCAlertPresent()).toBeTruthy();
    await fillInput(editFlavorView.cpusInput(), '1');
    await fillInput(editFlavorView.memoryInput(), '1');
    await click(saveButton);

    await isLoaded();
    expect(await isPCAlertPresent()).toBeTruthy();

    const alertTabs = await alertHeadings();
    const alertTabAttrs = await alertValues();

    expect(alertTabs.includes('Details')).toBeTruthy();
    expect(alertTabAttrs.includes('Flavor')).toBeTruthy();
  });

  it('Change Custom Flavor while VM is running.', async () => {
    await vm.navigateToDetail();
    await vm.modalEditFlavor();
    expect(await getSelectedOptionText(editFlavorView.flavorDropdown)).toEqual(Flavor.CUSTOM);
    expect(await isPCInfoAlertPresent()).toBeTruthy();
    await fillInput(editFlavorView.cpusInput(), '2');
    expect(await isPCAlertPresent()).toBeTruthy();
    await click(saveButton);

    await isLoaded();
    expect(await isPCAlertPresent()).toBeTruthy();

    const alertTabs = await alertHeadings();
    const alertTabAttrs = await alertValues();

    expect(alertTabs.includes('Details')).toBeTruthy();
    expect(alertTabAttrs.includes('Flavor')).toBeTruthy();
  });

  it('Change Boot-Order while VM is running.', async () => {
    await vm.navigateToDetail();
    await vm.modalEditBootOrder();
    expect(await isPCInfoAlertPresent()).toBeTruthy();
    await click(bootOrderView.deleteDeviceButton(1));
    expect(await isPCAlertPresent()).toBeTruthy();
    await click(saveButton);

    await isLoaded();
    expect(await isPCAlertPresent()).toBeTruthy();

    const alertTabs = await alertHeadings();
    const alertTabAttrs = await alertValues();

    expect(alertTabs.includes('Details')).toBeTruthy();
    expect(alertTabAttrs.includes('Boot Order')).toBeTruthy();
  });

  it('Add Environment variable while VM is running.', async () => {
    await vm.navigateToEnvironment();
    await vmEnv.addSource(configmapName);
    await isLoaded();

    const alertTabs = await alertHeadings();
    const alertTabAttrs = await alertValues();

    // Check Environment and Disks tabs had changed
    expect(['Environment', 'Disks'].every((tabName) => alertTabs.includes(tabName))).toBeTruthy();

    // Check ${configmapName} env var appears
    expect(!!alertTabAttrs.find((val) => val === configmapName)).toBeTruthy();

    // Check ${configmapName} disk appears
    expect(!!alertTabAttrs.find((val: string) => val.match(`${configmapName}-[a-z0-9]*-disk`)));
  });

  it('Add Disk while VM is Running', async () => {
    await vm.addDisk(hddDisk);
    expect(await vm.hasDisk(hddDisk)).toBeTruthy();

    const alertTabs = await alertHeadings();
    const alertTabAttrs = await alertValues();

    // Check alert message at the top of the screen
    expect(alertTabs.includes('Disks')).toBeTruthy();
    expect(alertTabAttrs.includes(hddDisk.name));

    // Check for '(Pending restart)' label in disk table
    const rows = await tableRows();
    expect(
      !!rows.find((row) => row.includes(`${hddDisk.name}`) && row.includes('(pending restart)')),
    ).toBeTruthy();
  });

  it('Add NIC while VM is Running', async () => {
    await vm.addNIC(multusNetworkInterface);
    expect(await vm.hasNIC(multusNetworkInterface)).toBeTruthy();

    const alertTabs = await alertHeadings();
    const alertTabAttrs = await alertValues();

    // Check alert message at the top of the screen
    expect(alertTabs.includes('Network Interfaces')).toBeTruthy();
    expect(alertTabAttrs.includes(multusNetworkInterface.name));

    // Check for '(Pending restart)' label in Nic table
    const rows = await tableRows();
    expect(
      !!rows.find(
        (row) =>
          row.includes(`${multusNetworkInterface.name}`) && row.includes('(pending restart)'),
      ),
    ).toBeTruthy();
  });
});

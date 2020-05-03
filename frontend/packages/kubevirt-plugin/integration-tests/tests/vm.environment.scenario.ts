import { getSecret, getConfigMap, getServiceAccount } from './utils/mocks';
import { createResource, deleteResource, click } from '@console/shared/src/test-utils/utils';
import { browser, ExpectedConditions as until, Key, element, by } from 'protractor';
import { createExampleVMViaYAML } from './utils/utils';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import * as vmEnv from '../views/vm.environment.view';
import { addVariableFrom } from '@console/internal-integration-tests/views/environment.view';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  KUBEVIRT_SCRIPTS_PATH,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTION,
} from './utils/consts';
import { execSync } from 'child_process';
import { VirtualMachine } from './models/virtualMachine';

const expecScriptPath = `${KUBEVIRT_SCRIPTS_PATH}/expect-vm-env-readable.sh`;
const vmName = 'vm-example';
const configmapName = 'configmap-mock';
const secretName = 'secret-mock';
const serviceAccountName = 'service-account-mock';

describe('Test VM enviromnet tab', () => {
  const secret = getSecret(testName, secretName);
  const configmap = getConfigMap(testName, configmapName);
  const serviceAccount = getServiceAccount(testName, serviceAccountName);
  let vm: VirtualMachine;

  beforeAll(async () => {
    createResource(secret);
    createResource(configmap);
    createResource(serviceAccount);
    const vmObj = await createExampleVMViaYAML(true);
    vm = new VirtualMachine(vmObj.metadata);
  });

  afterAll(() => {
    deleteResource(secret);
    deleteResource(configmap);
    deleteResource(serviceAccount);
  });

  beforeEach(async () => {
    await vm.navigateToEnvironment();
  });

  it('Add configmap, secret and service account', async () => {
    await vmEnv.addSource(configmapName);
    await vmEnv.addSource(secretName);

    // Add Service Account
    await click(
      element(by.buttonText('Add All From Config Map or Secret')),
      PAGE_LOAD_TIMEOUT_SECS,
    );
    await addVariableFrom(serviceAccountName, null, true);
    await browser.wait(until.presenceOf(vmEnv.successAlert));
    expect(vmEnv.successAlert.isDisplayed()).toEqual(true);
  });

  it('Verify all the sources are present at the disks tab', async () => {
    const disks = await vm.getAttachedDisks();
    expect(!!disks.find((d) => d.name.includes(configmapName))).toBeTruthy();
    expect(!!disks.find((d) => d.name.includes(secretName))).toBeTruthy();
    expect(!!disks.find((d) => d.name.includes(serviceAccountName))).toBeTruthy();
  });

  it(
    'Verify all sources are readable inside the VM',
    async () => {
      await vm.action(VM_ACTION.Start);
      const out = execSync(`expect ${expecScriptPath} ${vmName} ${testName}`).toString();
      const isFailedTest = out.split('\n').find((line) => line === 'FAILED');
      expect(!isFailedTest).toBeTruthy();
    },
    VM_BOOTUP_TIMEOUT_SECS * 2, // VM boot time + test sources time
  );

  it('Error when resource has no serial', async () => {
    await vmEnv.serialField.get(1).clear();
    await vmEnv.serialField.get(1).sendKeys('i', Key.BACK_SPACE); // workaround: for some reason clear() is not enough
    await browser.wait(until.elementToBeClickable(vmEnv.saveBtn), PAGE_LOAD_TIMEOUT_SECS);
    await click(vmEnv.saveBtn, PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.presenceOf(vmEnv.errorAlert), PAGE_LOAD_TIMEOUT_SECS);
    const errorText = await vmEnv.errorAlert.getText();
    expect(vmEnv.errorAlert.isDisplayed()).toEqual(true);
    expect(errorText).toContain(vmEnv.noSerialError);
  });

  it('Error when two sources have the same serial', async () => {
    const firstSerial = await vmEnv.serialField.get(0).getAttribute('value');
    await vmEnv.serialField.get(1).clear();
    await vmEnv.serialField.get(1).sendKeys(firstSerial);
    await browser.wait(until.elementToBeClickable(vmEnv.saveBtn), PAGE_LOAD_TIMEOUT_SECS);
    await click(vmEnv.saveBtn, PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.presenceOf(vmEnv.errorAlert), PAGE_LOAD_TIMEOUT_SECS);
    expect(vmEnv.errorAlert.isDisplayed()).toEqual(true);
    const errorText = await vmEnv.errorAlert.getText();
    expect(errorText).toContain(vmEnv.dupSerialsError);
  });

  it('Cannot use the same resource more than once', async () => {
    await click(
      element(by.buttonText('Add All From Config Map or Secret')),
      PAGE_LOAD_TIMEOUT_SECS,
    );
    await isLoaded();
    await vmEnv.dropDownBtn
      .filter(async (elem) => {
        const elemText = await elem.getText();
        return elemText === 'Select a resource';
      })
      .first()
      .click();
    await vmEnv.textFilter.sendKeys(configmapName);
    const optionSize = await vmEnv.option
      .filter(async (elem) => {
        return (await elem.$('.co-resource-item__resource-name').getText()) === configmapName;
      })
      .count();
    expect(optionSize).toEqual(0);
  });

  it('Delete a source', async () => {
    const pairCountBefore = await vmEnv.allPairRows.count();
    await vmEnv.deleteButton.first().click();
    await browser.wait(until.elementToBeClickable(vmEnv.saveBtn), PAGE_LOAD_TIMEOUT_SECS);
    await click(vmEnv.saveBtn, PAGE_LOAD_TIMEOUT_SECS);
    const pairCountAfter = await vmEnv.allPairRows.count();
    expect(pairCountBefore).toEqual(pairCountAfter + 1);
  });
});

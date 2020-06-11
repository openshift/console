import { getSecret, getConfigMap, getServiceAccount } from './utils/mocks';
import { click, createResources, deleteResources } from '@console/shared/src/test-utils/utils';
import { browser, ExpectedConditions as until, Key } from 'protractor';
import { createExampleVMViaYAML } from './utils/utils';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { saveButton } from '../views/kubevirtUIResource.view';
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

const environmentExpecScriptPath = `${KUBEVIRT_SCRIPTS_PATH}/expect-vm-env-readable.sh`;
const configmapName = 'configmap-mock';
const secretName = 'secret-mock';
const serviceAccountName = 'service-account-mock';

describe('Test VM enviromnet tab', () => {
  const secret = getSecret(testName, secretName);
  const configMap = getConfigMap(testName, configmapName);
  const serviceAccount = getServiceAccount(testName, serviceAccountName);
  let vm: VirtualMachine;

  beforeAll(async () => {
    createResources([secret, configMap, serviceAccount]);
    const vmObj = await createExampleVMViaYAML(true);
    vm = new VirtualMachine(vmObj.metadata);
  });

  afterAll(() => {
    deleteResources([secret, configMap, serviceAccount, vm.asResource()]);
  });

  beforeEach(async () => {
    await vm.navigateToEnvironment();
  });

  it('ID(CNV-4046) Add configmap, secret and service account', async () => {
    await vmEnv.addSource(configmapName);
    await vmEnv.addSource(secretName);

    // Add Service Account
    await click(vmEnv.addVariableButton, PAGE_LOAD_TIMEOUT_SECS);
    await addVariableFrom(serviceAccountName, null, true);
    await browser.wait(until.presenceOf(vmEnv.successAlert));
    expect(vmEnv.successAlert.isDisplayed()).toEqual(true);
  });

  it('ID(CNV-4179) Verify all the sources are present at the disks tab', async () => {
    const disks = await vm.getAttachedDisks();
    expect(!!disks.find((d) => d.name.includes(configmapName))).toBeTruthy();
    expect(!!disks.find((d) => d.name.includes(secretName))).toBeTruthy();
    expect(!!disks.find((d) => d.name.includes(serviceAccountName))).toBeTruthy();
  });

  it(
    'ID(CNV-4185) Verify all sources are readable inside the VM',
    async () => {
      await vm.action(VM_ACTION.Start);
      const out = execSync(
        `expect ${environmentExpecScriptPath} ${vm.name} ${vm.namespace}`,
      ).toString();
      const isFailedTest = out.split('\n').find((line) => line === 'FAILED');
      expect(!isFailedTest).toBeTruthy();
      await vm.action(VM_ACTION.Stop);
    },
    VM_BOOTUP_TIMEOUT_SECS * 2, // VM boot time + test sources time
  );

  it('ID(CNV-4186) Error when resource has no serial', async () => {
    await vmEnv.serialField.get(1).clear();
    await vmEnv.serialField.get(1).sendKeys('i', Key.BACK_SPACE); // workaround: for some reason clear() is not enough
    await browser.wait(until.presenceOf(vmEnv.errorAlert), PAGE_LOAD_TIMEOUT_SECS);
    const errorText = await vmEnv.errorAlert.getText();
    expect(vmEnv.errorAlert.isDisplayed()).toEqual(true);
    expect(errorText).toContain(vmEnv.noSerialError);
  });

  it('ID(CNV-4187) Error when two sources have the same serial', async () => {
    const firstSerial = await vmEnv.serialField.get(0).getAttribute('value');
    await vmEnv.serialField.get(1).clear();
    await vmEnv.serialField.get(1).sendKeys(firstSerial);
    await browser.wait(until.presenceOf(vmEnv.errorAlert), PAGE_LOAD_TIMEOUT_SECS);
    expect(vmEnv.errorAlert.isDisplayed()).toEqual(true);
    const errorText = await vmEnv.errorAlert.getText();
    expect(errorText).toContain(vmEnv.dupSerialsError);
  });

  it('ID(CNV-4188) Cannot use the same resource more than once', async () => {
    await click(vmEnv.addVariableButton, PAGE_LOAD_TIMEOUT_SECS);
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

  it('ID(CNV-4189) Delete a source', async () => {
    const pairCountBefore = await vmEnv.allPairRows.count();
    await vmEnv.deleteButton.first().click();
    await browser.wait(until.elementToBeClickable(saveButton), PAGE_LOAD_TIMEOUT_SECS);
    await click(saveButton, PAGE_LOAD_TIMEOUT_SECS);
    const pairCountAfter = await vmEnv.allPairRows.count();
    expect(pairCountBefore).toEqual(pairCountAfter + 1);
  });
});

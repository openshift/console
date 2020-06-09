import { browser, ExpectedConditions as until, Key } from 'protractor';
import { execSync } from 'child_process';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import {
  createResource,
  deleteResource,
  selectDropdownOption,
  waitForStringNotInElement,
} from '@console/shared/src/test-utils/utils';
import {
  consoleTypeSelectorId,
  serialDisconnectButton,
  serialReconnectButton,
  vncSendKeyButton,
  vncConnectingBar,
  serialConsoleWrapper,
  serialConsole,
  sendCommandToConsole,
  vncConsole,
} from '../views/consolesView';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  VM_ACTION,
  VM_BOOTUP_TIMEOUT_SECS,
  KUBEVIRT_SCRIPTS_PATH,
} from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { ProvisionConfigName } from './utils/constants/wizard';
import { getVMManifest } from './utils/mocks';

describe('KubeVirt VM VNC/Serial consoles', () => {
  const vmResource = getVMManifest(ProvisionConfigName.CONTAINER, testName, 'cirros-vm');
  const vm = new VirtualMachine(vmResource.metadata);
  const cirrosUsername = 'cirros';
  const cirrosPassword = 'gocubsgo';
  const serialTestFile = 'serialTestFile';
  const vncTestFile = 'vncTestFile';
  const expectLoginScriptPath = `${KUBEVIRT_SCRIPTS_PATH}/expect-login.sh`;
  const expectFileExistsScriptPath = `${KUBEVIRT_SCRIPTS_PATH}/expect-file-exists.sh`;

  const logIntoConsole = async (consoleCanvas) => {
    await browser.wait(until.presenceOf(consoleCanvas), PAGE_LOAD_TIMEOUT_SECS);
    await sendCommandToConsole(consoleCanvas, Key.ENTER);
    await sendCommandToConsole(consoleCanvas, cirrosUsername);
    await sendCommandToConsole(consoleCanvas, cirrosPassword);
  };

  const extractResult = (output: string) =>
    output.split('\n').find((line) => line === 'SUCCESS' || line === 'FAILURE');

  beforeAll(async () => {
    createResource(vmResource);
    await vm.action(VM_ACTION.Start);
    // wait for the VM to boot up
    execSync(`expect ${expectLoginScriptPath} ${vm.name} ${vm.namespace}`);
    await vm.navigateToConsoles();
  }, VM_BOOTUP_TIMEOUT_SECS);

  afterAll(async () => {
    await browser.get(appHost);
    await browser
      .switchTo()
      .alert()
      .accept();
    deleteResource(vmResource);
  });

  it('ID(CNV-3609) Serial Console connects', async () => {
    await selectDropdownOption(consoleTypeSelectorId, 'Serial Console');

    // Wait for Loading span element to disappear
    await waitForStringNotInElement(serialConsoleWrapper, 'Loading');

    // Ensure presence of control buttons
    await browser.wait(until.presenceOf(serialReconnectButton), PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.presenceOf(serialDisconnectButton), PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.elementToBeClickable(serialDisconnectButton), PAGE_LOAD_TIMEOUT_SECS);

    await browser.wait(until.presenceOf(serialConsole), PAGE_LOAD_TIMEOUT_SECS);
    await logIntoConsole(serialConsole);
    await sendCommandToConsole(serialConsole, `touch ${serialTestFile}`);
    await sendCommandToConsole(serialConsole, 'exit');
    const out = execSync(
      `expect ${expectFileExistsScriptPath} ${vm.name} ${vm.namespace} ${serialTestFile}`,
    )
      .toString()
      .replace(/[\r]+/gm, '');

    expect(extractResult(out)).toEqual('SUCCESS');
  });

  it('ID(CNV-872) VNC Console connects', async () => {
    await selectDropdownOption(consoleTypeSelectorId, 'VNC Console');

    // Wait for Connecting bar element to disappear
    await browser.wait(until.invisibilityOf(vncConnectingBar));
    await browser.wait(until.presenceOf(vncSendKeyButton), PAGE_LOAD_TIMEOUT_SECS);

    await logIntoConsole(vncConsole);
    await sendCommandToConsole(vncConsole, `touch ${vncTestFile}`);

    const out = execSync(
      `expect ${expectFileExistsScriptPath} ${vm.name} ${vm.namespace} ${vncTestFile}`,
    )
      .toString()
      .replace(/[\r]+/gm, '');

    expect(extractResult(out)).toEqual('SUCCESS');
  });
});

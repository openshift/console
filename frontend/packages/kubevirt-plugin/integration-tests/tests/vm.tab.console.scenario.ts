import { browser, ExpectedConditions as until, Key } from 'protractor';
import { execSync } from 'child_process';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  click,
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
  openInNewWindow,
} from '../views/consolesView';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  VM_BOOTUP_TIMEOUT_SECS,
  KUBEVIRT_SCRIPTS_PATH,
} from './utils/constants/common';
import { VM_ACTION } from './utils/constants/vm';
import { VirtualMachine } from './models/virtualMachine';
import { ProvisionSource } from './utils/constants/wizard';
import { getVMManifest } from './mocks/mocks';

describe('KubeVirt VM console - VNC/Serial', () => {
  const vmResource = getVMManifest(ProvisionSource.URL, testName, 'cirros-vm');
  const testVM = new VirtualMachine(vmResource.metadata);
  const cirrosUsername = 'cirros';
  const cirrosPassword = 'gocubsgo';
  const serialTestFile = 'serialTestFile';
  const serialTestFile1 = 'serialTestFile1';
  const vncTestFile = 'vncTestFile';
  const vncTestFile1 = 'vncTestFile1';
  const expectLoginScriptPath = `${KUBEVIRT_SCRIPTS_PATH}/expect-login.sh`;
  const expectFileExistsScriptPath = `${KUBEVIRT_SCRIPTS_PATH}/expect-file-exists.sh`;

  const logIntoConsole = async (consoleCanvas) => {
    await browser.wait(until.presenceOf(consoleCanvas), PAGE_LOAD_TIMEOUT_SECS);
    await sendCommandToConsole(consoleCanvas, Key.ENTER);
    await sendCommandToConsole(consoleCanvas, cirrosUsername);
    await sendCommandToConsole(consoleCanvas, cirrosPassword);
  };

  const checkTouchedFile = async (vm: VirtualMachine, consoleType: string, file: string) => {
    await logIntoConsole(consoleType);
    await sendCommandToConsole(consoleType, `touch ${file}`);
    await sendCommandToConsole(consoleType, 'exit');

    const output = execSync(
      `expect ${expectFileExistsScriptPath} ${vm.name} ${vm.namespace} ${file}`,
    )
      .toString()
      .replace(/[\r]+/gm, '');

    const result = output.split('\n').find((line) => line === 'SUCCESS' || line === 'FAILURE');
    expect(result).toEqual('SUCCESS');
  };

  beforeAll(async () => {
    createResource(vmResource);
    await testVM.detailViewAction(VM_ACTION.Start);
    // wait for the VM to boot up
    execSync(`expect ${expectLoginScriptPath} ${testVM.name} ${testVM.namespace}`);
    await testVM.navigateToConsole();
  }, VM_BOOTUP_TIMEOUT_SECS);

  afterAll(async () => {
    deleteResource(vmResource);
  });

  it('ID(CNV-3609) Serial Console connects', async () => {
    await selectDropdownOption(consoleTypeSelectorId, 'Serial Console');

    // Wait for Loading span element to disappear
    await browser.wait(waitForStringNotInElement(serialConsoleWrapper, 'Loading'));

    // Ensure presence of control buttons
    await browser.wait(until.presenceOf(serialReconnectButton), PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.presenceOf(serialDisconnectButton), PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.elementToBeClickable(serialDisconnectButton), PAGE_LOAD_TIMEOUT_SECS);

    await browser.wait(until.presenceOf(serialConsole), PAGE_LOAD_TIMEOUT_SECS);

    await checkTouchedFile(testVM, serialConsole, serialTestFile);
  });

  it('ID(CNV-872) VNC Console connects', async () => {
    await selectDropdownOption(consoleTypeSelectorId, 'VNC Console');

    // Wait for Connecting bar element to disappear
    await browser.wait(until.invisibilityOf(vncConnectingBar));
    await browser.wait(until.presenceOf(vncSendKeyButton), PAGE_LOAD_TIMEOUT_SECS);

    await checkTouchedFile(testVM, vncConsole, vncTestFile);
  });

  it('ID(CNV-4660) Open VNC Console in new window', async () => {
    await click(openInNewWindow);

    const consoleWinHandles = await browser.getAllWindowHandles();
    const parentHandle = consoleWinHandles[0];
    const popUpHandle = consoleWinHandles[1];

    await browser.switchTo().window(popUpHandle);
    const getPopUpHandle = browser.getWindowHandle();
    expect(getPopUpHandle).toEqual(popUpHandle);

    // verify it's connecting to vnc console in the new window.
    await browser.wait(until.invisibilityOf(vncConnectingBar));
    await browser.wait(until.presenceOf(vncSendKeyButton), PAGE_LOAD_TIMEOUT_SECS);
    await checkTouchedFile(testVM, vncConsole, vncTestFile1);

    // verify it's connecting to serial console in the new window.
    await selectDropdownOption(consoleTypeSelectorId, 'Serial Console');
    await browser.wait(waitForStringNotInElement(serialConsoleWrapper, 'Loading'));
    await browser.wait(until.presenceOf(serialReconnectButton), PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.presenceOf(serialDisconnectButton), PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.elementToBeClickable(serialDisconnectButton), PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.presenceOf(serialConsole), PAGE_LOAD_TIMEOUT_SECS);

    await checkTouchedFile(testVM, serialConsole, serialTestFile1);

    await browser.close();

    await browser.switchTo().window(parentHandle);
    const getParentHandle = browser.getWindowHandle();
    expect(getParentHandle).toEqual(parentHandle);
  });
});

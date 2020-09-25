import { $, $$, element, by, browser, ExpectedConditions as until, Key } from 'protractor';
import { PAGE_LOAD_TIMEOUT_SECS } from '../tests/utils/constants/common';

export const consoleTypeSelectorId = '#console-type-selector';
export const openInNewWindow = element(by.buttonText('Open Console in new Window'));
export const consoleTypeSelector = $(consoleTypeSelectorId);
export const rdpServiceNotConfiguredElem = $('.kubevirt-vm-consoles__rdp'); // this class is used just for this informative elemenet
export const networkSelectorId = '#network-dropdown';

export const desktopClientTitle = $('.remote-viewer-pf > h2');
export const launchRemoteViewerButton = $('.remote-viewer-pf-launch-vv');
export const launchRemoteDesktopButton = $('.remote-viewer-pf-launch-rdp');

export const manualConnectionTitle = $('.manual-connection-pf > h2');
export const rdpManualConnectionTitles = () => $$('.manual-connection-pf-title'); // first for address, second for port
export const rdpManualConnectionValues = () => $$('.manual-connection-pf-value');

export const vncConnectingBar = $('.vnc-console-connecting');
export const vncSendKeyButton = $('#console-send-shortcut');
export const vncConsole = $('div.vnc-console canvas');

export const serialConsole = $('.xterm-cursor-layer');
export const serialConsoleWrapper = $('.console-terminal-pf');
export const serialDisconnectButton = element(by.buttonText('Disconnect'));
export const serialReconnectButton = element(by.buttonText('Reconnect'));

const terminalInteractionTimeout = 200;
export const sendCommandToConsole = async (terminal, command) => {
  await browser.wait(until.presenceOf(terminal), PAGE_LOAD_TIMEOUT_SECS);
  await browser
    .actions()
    .mouseMove(terminal)
    .click()
    .perform();
  await browser
    .actions()
    .sendKeys(command)
    .perform();
  await browser.sleep(terminalInteractionTimeout);
  await browser
    .actions()
    .sendKeys(Key.ENTER)
    .perform();
  return browser.sleep(terminalInteractionTimeout);
};

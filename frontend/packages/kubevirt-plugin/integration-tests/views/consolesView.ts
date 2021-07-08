import { $, $$, browser, by, element, ExpectedConditions as until, Key } from 'protractor';
import { PAGE_LOAD_TIMEOUT_SECS } from '../tests/utils/constants/common';

export const consoleTypeSelectorId = '#pf-c-console__type-selector';
export const openInNewWindow = element(by.buttonText('Open Console in new Window'));
export const consoleTypeSelector = $(consoleTypeSelectorId);
export const rdpServiceNotConfiguredElem = $('[data-test="rdp-console-desc"]');
export const networkSelectorId = '#network-dropdown';

export const desktopClientTitle = $('.remote-viewer-pf > h2');
export const launchRemoteViewerButton = $('.remote-viewer-pf-launch-vv');
export const launchRemoteDesktopButton = $('.remote-viewer-pf-launch-rdp');

export const manualConnectionTitle = $('.manual-connection-pf > h2');
export const rdpManualConnectionTitles = $$('.manual-connection-pf-title'); // first for address, second for port
export const rdpManualConnectionValues = $$('.manual-connection-pf-value');

export const vncSendKeyButton = $('#pf-c-console__actions-vnc-toggle-id');
export const vncConsole = $('div.pf-c-console__vnc canvas');

export const serialConsole = $('.xterm-cursor-layer');
export const serialDisconnectButton = element(by.buttonText('Disconnect'));
export const serialResetButton = element(by.buttonText('Reset'));
export const serialConnectButton = element(by.buttonText('Connect'));

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

import { $, $$ } from 'protractor';

export const consoleTypeSelectorId = '#console-type-selector';
export const consoleTypeSelector = $(consoleTypeSelectorId);
export const rdpServiceNotConfiguredElem = $('.kubevirt-vm-consoles__rdp'); // this class is used just for this informative elemenet

export const desktopClientTitle = $('.remote-viewer-pf > h2');
export const launchRemoteViewerButton = $('.remote-viewer-pf-launch-vv');
export const launchRemoteDesktopButton = $('.remote-viewer-pf-launch-rdp');

export const manualConnectionTitle = $('.manual-connection-pf > h2');
export const rdpManualConnectionTitles = () => $$('.manual-connection-pf-title'); // first for address, second for port
export const rdpManualConnectionValues = () => $$('.manual-connection-pf-value');

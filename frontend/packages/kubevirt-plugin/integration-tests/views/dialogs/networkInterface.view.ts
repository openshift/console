import { $, by, element } from 'protractor';

export const nicName = $('#nic-name');
export const nicModel = $('#nic-select-model');
export const nicNetwork = $('#nic-network');
export const nicType = $('#nic-select-type');
export const nicMACAddress = $('#nic-mac-address');
export const nicDropDownItem = (text) =>
  element(by.cssContainingText('.pf-c-select__menu-item-main', text));

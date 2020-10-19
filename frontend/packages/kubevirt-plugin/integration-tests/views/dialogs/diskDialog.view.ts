import { $, by, element } from 'protractor';

export const diskSource = $('#disk-select-source');
export const diskURL = $('#disk-url');
export const diskContainer = $('#disk-container');
export const diskNamespace = $('#disk-pvc-namespace');
export const diskPVC = $('#disk-pvc');
export const diskName = $('#disk-name');
export const diskSize = $('#disk-size-row-size');
export const diskInterface = $('#disk-select-interface');
export const diskStorageClass = $('#disk-storage-class');
export const advancedDrawerToggle = $('.modal-body').element(by.buttonText('Advanced'));
export const diskVolumeMode = $('#disk-volume-mode');
export const diskAccessMode = $('#disk-access-mode');
export const diskInterfaceHelper = $('#disk-interface-helper');
export const diskDropDownItem = (text) =>
  element(by.cssContainingText('.pf-c-select__menu-item-main', text));

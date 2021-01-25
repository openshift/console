import { by, element } from 'protractor';
import { rowForUID } from './vms.list.view';

export const templateCreateVMLink = (templateUID: string) =>
  rowForUID(templateUID).element(by.buttonText('Create'));
export const bootSource = $('[data-test="status-text"]');
export const vmtTitle = (vmtName: string) => $(`data-test-id="${vmtName}"`);
export const vmtLinkByName = (vmtName: string) => element(by.linkText(vmtName));
export const detailViewDropdown = $('[data-test-id="actions-menu-button"]');
export const createVMButton = $('[data-test-action="Create Virtual Machine"]');
export const vmtTopLink = $('[data-test-id="breadcrumb-link-1"]');

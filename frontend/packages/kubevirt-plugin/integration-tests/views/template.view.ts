import { by, element } from 'protractor';
import { rowForUID } from './vms.list.view';

export const templateCreateVMLink = (templateUID: string) =>
  rowForUID(templateUID).element(by.buttonText('Create'));
export const bootSource = $('[data-test="status-text"]');
export const vmtLinkByName = (vmtName: string) => element(by.linkText(vmtName));

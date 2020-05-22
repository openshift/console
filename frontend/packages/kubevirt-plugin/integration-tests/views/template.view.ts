import { by } from 'protractor';
import { rowForUID } from './vms.list.view';

export const templateCreateVMLink = (templateUID: string) =>
  rowForUID(templateUID).element(by.linkText('Create Virtual Machine'));

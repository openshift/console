import { by, element } from 'protractor';

export const vmListByName = (vmName) => element(by.linkText(vmName));

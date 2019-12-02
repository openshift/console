import { by, element, $ } from 'protractor';

export const vmListByName = (vmName) => element(by.linkText(vmName));
export const isRestrictedAccess = $('.cos-status-box__title');

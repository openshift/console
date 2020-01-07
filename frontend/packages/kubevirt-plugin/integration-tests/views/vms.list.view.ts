import { by, element, $ } from 'protractor';

export const vmListByName = (vmName) => element(by.linkText(vmName));
export const restrictedAccessBlock = $('.cos-status-box__title');
export const hintBlockTitle = $('.co-hint-block__title.h4');

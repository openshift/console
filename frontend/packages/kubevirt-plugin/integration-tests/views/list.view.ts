import { by, element, $ } from 'protractor';

export const listByName = (name) => element(by.linkText(name));
export const isRestrictedAccess = $('.cos-status-box__title');

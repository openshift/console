/* eslint-disable no-undef, no-unused-vars */

import { browser, $, ExpectedConditions as until, by, element } from 'protractor';

export const operatorModal = $('.modal-content');
export const operatorModalIsLoaded = () => browser.wait(until.presenceOf(operatorModal), 1000)
  .then(() => browser.sleep(500));
export const operatorModalTitle = operatorModal.$('.catalog-item-header-pf-title');
export const operatorModalInstallBtn = operatorModal.element(by.buttonText('Install'));
export const operatorModalUninstallBtn = operatorModal.element(by.buttonText('Uninstall'));
export const closeOperatorModal = () => operatorModal.$('.close').click();
export const operatorModalIsClosed = () => browser.wait(until.not(until.presenceOf(operatorModal)), 1000)
  .then(() => browser.sleep(500));
export const viewInstalledOperator = () => $('.hint-block-pf').element(by.linkText('View it here.')).click();

export const createSubscriptionFormBtn = element(by.buttonText('Subscribe'));
export const createSubscriptionFormInstallMode = element(by.cssContainingText('label', 'Installation Mode'));

export const installNamespaceDropdown = $('.dropdown--full-width');
export const installNamespaceDropdownBtn = installNamespaceDropdown.$('.dropdown-toggle');
export const installNamespaceDropdownFilter = (filter: string) => installNamespaceDropdown
  .$('.dropdown-menu__filter').$('input').sendKeys(filter);
export const installNamespaceDropdownSelect = (namespace: string) => installNamespaceDropdown
  .$(`#${namespace}-Project-link`);

export const communityWarningModal = $('.co-modal-ignore-warning');
export const operatorCommunityWarningIsLoaded = () => browser.wait(until.presenceOf(communityWarningModal), 1000)
  .then(() => browser.sleep(500));
export const operatorCommunityWarningIsClosed = () => browser.wait(until.not(until.presenceOf(communityWarningModal)), 1000)
  .then(() => browser.sleep(500));
export const closeCommunityWarningModal = () => communityWarningModal.$('.btn-default').click();
export const acceptCommunityWarningModal = () => communityWarningModal.$('.btn-primary').click();
